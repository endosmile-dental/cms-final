import { NextResponse } from "next/server";
import dbConnect from "@/app/utils/dbConnect";
import BillingModel from "@/app/model/Billing.model";
import PatientModel from "@/app/model/Patient.model";

export async function GET(request: Request) {
  try {
    await dbConnect();

    // Extract patientUserId from custom headers.
    const patientUserId = request.headers.get("x-patient-user-id");

    if (!patientUserId) {
      return NextResponse.json(
        { message: "Patient user id not provided" },
        { status: 400 }
      );
    }

    // Find the patient using userId
    const patient = await PatientModel.findOne({ userId: patientUserId });

    if (!patient) {
      return NextResponse.json(
        { message: "Patient not found" },
        { status: 404 }
      );
    }

    // Fetch billing records associated with the found patient's _id.
    const billings = await BillingModel.find({ patientId: patient.PatientId });

    return NextResponse.json({ billings });
  } catch (error: unknown) {
    console.error("Error fetching patient billings:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { message: "Error fetching patient billings", error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { message: "Unknown error occurred" },
      { status: 500 }
    );
  }
}
