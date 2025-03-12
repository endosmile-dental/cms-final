import { NextResponse } from "next/server";
import dbConnect from "@/app/utils/dbConnect";
import AppointmentModel from "@/app/model/Appointment.model";
import PatientModel from "@/app/model/Patient.model";

export async function GET(request: Request) {
  try {
    await dbConnect();

    // Retrieve the patientUserId from the custom header.
    const patientUserId = request.headers.get("x-patient-user-id");

    if (!patientUserId) {
      return NextResponse.json(
        { message: "Patient user id not provided" },
        { status: 400 }
      );
    }

    // Find the patient document using the patient.userId field.
    const patient = await PatientModel.findOne({ userId: patientUserId });
    if (!patient) {
      return NextResponse.json(
        { message: "Patient not found" },
        { status: 404 }
      );
    }

    // Fetch appointments associated with the patient's _id.
    const appointments = await AppointmentModel.find({ patient: patient._id });

    return NextResponse.json({ appointments });
  } catch (error: unknown) {
    console.error("Error fetching appointments:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { message: "Error fetching appointments", error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { message: "Unknown error occurred" },
      { status: 500 }
    );
  }
}
