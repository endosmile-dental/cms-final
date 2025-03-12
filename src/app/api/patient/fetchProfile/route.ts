import { NextRequest, NextResponse } from "next/server";
import PatientModel from "@/app/model/Patient.model";
import dbConnect from "@/app/utils/dbConnect";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const patientUserId = req.headers.get("x-patient-user-id");

    if (!patientUserId) {
      return NextResponse.json(
        { error: "Patient user id not provided" },
        { status: 400 }
      );
    }

    // Find the patient record using the provided userId.
    // Exclude sensitive fields (e.g., "userId" and any other fields you deem sensitive).
    const patient = await PatientModel.findOne({
      userId: patientUserId,
    }).select("-userId -password -DoctorId -createdAt -permissions -updatedAt"); // Adjust the fields to exclude as needed

    if (!patient) {
      return NextResponse.json(
        { error: "Patient profile not found" },
        { status: 404 }
      );
    }

    // Convert ObjectId and Date fields to string format
    const transformedPatient = {
      ...patient.toObject(),
      _id: patient._id.toString(),
      ClinicId: patient.ClinicId.toString(),
    };

    return NextResponse.json({ patient: transformedPatient }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error fetching patient details:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: "Unknown error occurred" },
      { status: 500 }
    );
  }
}
