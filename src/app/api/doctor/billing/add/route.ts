import { NextResponse } from "next/server";
import dbConnect from "@/app/utils/dbConnect";
import Billing from "@/app/model/Billing.model";
import DoctorModel from "@/app/model/Doctor.model";
import { zodBillingSchema } from "@/schemas/zodBillingSchema";
import { ZodError } from "zod";

/**
 * POST route handler for creating a new billing record.
 *
 * This function:
 * - Establishes a database connection.
 * - Parses and validates the request body using zodBillingSchema.
 * - Retrieves the doctor's record (to get the clinicId) using a custom header "x-doctor-id".
 * - Creates a new billing document. The Billing model's pre-save middleware will
 *   compute financial fields (such as amountBeforeDiscount, totalAmount, and amountDue).
 *
 * @param request Request object containing billing data in JSON format.
 * @returns A NextResponse with a success message and the created billing record, or an error message.
 */
export async function POST(request: Request) {
  try {
    // Establish a database connection.
    await dbConnect();

    // Parse and validate the request body using the Zod schema.
    const body = await request.json();

    // Replace patientId with hiddenPatientId and remove original patientId
    if (body.hiddenPatientId) {
      body.patientId = body.hiddenPatientId; // Set as actual ObjectId
    }

    // Now run Zod validation
    const data = zodBillingSchema.parse(body);
    console.log("Parsed Billing Data:", data);

    // Retrieve doctorId from a custom header (or session).
    const doctorId = request.headers.get("x-doctor-id");
    if (!doctorId) {
      return NextResponse.json(
        { error: "Doctor ID is missing from session." },
        { status: 401 }
      );
    }

    // Retrieve the doctor's record to extract the associated clinicId.
    const doctor = await DoctorModel.findOne({ userId: doctorId });
    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found." }, { status: 404 });
    }
    const clinicId = doctor.clinicId;

    // Create a new billing document.
    // Dummy values are passed for computed fields to satisfy Mongoose's required constraints.
    // The pre-save middleware in the Billing model will recalculate these values.
    const billing = await Billing.create({
      invoiceId: data.invoiceId,
      patientId: data.patientId,
      doctorId: doctorId,
      clinicId: clinicId,
      date: new Date(data.date),
      treatments: data.treatments,
      discount: data.discount,
      advance: data.advance,
      amountReceived: data.amountReceived,
      modeOfPayment: data.modeOfPayment,
      address: data.address,
      amountBeforeDiscount: 0,
      totalAmount: 0,
      amountDue: 0,
    });

    return NextResponse.json(
      { message: "Billing created successfully", billing },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error creating billing:", error);
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: "Validation error", errors: error.issues },
        { status: 400 }
      );
    } else if (error instanceof Error) {
      // If it was a connection‐failure after all retries, you can return 503
      if (
        error.message.includes("Server selection") ||
        error.message.includes("connection") ||
        error.message.includes("Timeout")
      ) {
        return NextResponse.json(
          { message: "Database unavailable. Please try again later." },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { message: "Error creating billing", error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { message: "Unknown error occurred" },
      { status: 500 }
    );
  }
}
