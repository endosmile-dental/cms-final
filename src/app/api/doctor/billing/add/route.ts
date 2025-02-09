import { NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import dbConnect from "@/app/utils/dbConnect";
import Billing from "@/app/model/Billing.model";
import DoctorModel from "@/app/model/Doctor.model";
// Optionally, import Doctor model if you want to fetch ClinicId from it.
// import Doctor from "@/app/model/Doctor.model";

// Define a Zod schema for the billing form data
const billingSchema = z.object({
  invoiceId: z.string().nonempty("Invoice Id is required"),
  patientId: z.string().nonempty("Patient Id is required"),
  patientModelId: z.string().nonempty("Patient Model Id is required"),
  patientName: z.string().nonempty("Patient Name is required"),
  contactNumber: z.string().nonempty("Contact Number is required"),
  date: z.string().nonempty("Date is required"),
  treatments: z.array(
    z.object({
      treatment: z.string().nonempty("Treatment is required"),
      price: z.string().nonempty("Price is required"),
      quantity: z.string().nonempty("Quantity is required"),
    })
  ),
  discount: z.string().optional(),
  advance: z.string().optional(),
  amountRecieved: z.string().nonempty("Amount Received is required"),
  modeOfPayment: z.string().nonempty("Mode of Payment is required"),
  address: z.string().optional(),
  email: z.string().optional(),
  gender: z.string().nonempty("Gender is required"),
});

export async function POST(request: Request) {
  try {
    // Ensure database connection is established.
    await dbConnect();

    // Parse and validate the request body
    const body = await request.json();
    const data = billingSchema.parse(body);

    console.log("DATA", data);

    // Retrieve doctorId from a custom header (or from session)
    const doctorId = request.headers.get("x-doctor-id");
    if (!doctorId) {
      return NextResponse.json(
        { error: "Doctor ID is missing from session." },
        { status: 401 }
      );
    }

    // Optionally, retrieve the doctor's ClinicId from the Doctor model.
    // For example:
    const doctor = await DoctorModel.findOne({ userId: doctorId });
    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found." }, { status: 404 });
    }
    const clinicId = doctor.clinicId;

    // For this example, we'll assume a dummy clinicId.
    // const clinicId = "67a245dc2a37ab4cb3d61318"; // Replace with actual logic

    // Convert string numbers from form data to actual numbers
    const treatments = data.treatments.map((t) => ({
      treatment: t.treatment,
      price: Number(t.price),
      quantity: Number(t.quantity),
    }));
    const discount = data.discount ? Number(data.discount) : 0;
    const advance = data.advance ? Number(data.advance) : 0;
    const amountReceived = Number(data.amountRecieved);

    // Create a new billing document
    const billing = await Billing.create({
      invoiceId: data.invoiceId, // or you can let the default generator work
      patientId: data.patientModelId,
      doctorId: doctorId,
      clinicId: clinicId,
      date: new Date(data.date),
      treatments: treatments,
      discount: discount,
      advance: advance,
      amountReceived: amountReceived,
      modeOfPayment: data.modeOfPayment,
      address: data.address,
    });

    return NextResponse.json(
      { message: "Billing created successfully", billing },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating billing:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred during billing creation" },
      { status: 400 }
    );
  }
}
