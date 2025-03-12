import PatientModel from "@/app/model/Patient.model";
import UserModel from "@/app/model/User.model";
import dbConnect from "@/app/utils/dbConnect";
import { NextRequest, NextResponse } from "next/server";


export async function POST(req: NextRequest) {
  try {
    const { patientId, newPassword } = await req.json();

    // Validate input
    if (!patientId || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Patient ID and new password are required." },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Find the patient by ID
    const patient = await PatientModel.findById(patientId);
    if (!patient) {
      return NextResponse.json(
        { success: false, message: "Patient not found." },
        { status: 404 }
      );
    }

    // Ensure the patient has a linked user
    if (!patient.userId) {
      return NextResponse.json(
        { success: false, message: "No linked user found for this patient." },
        { status: 404 }
      );
    }

    // Find the user associated with this patient
    const user = await UserModel.findById(patient.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found for this patient." },
        { status: 404 }
      );
    }

    // Update the user's password (password hashing is handled by middleware)
    user.password = newPassword;
    await user.save(); // `pre("save")` middleware will hash it automatically

    return NextResponse.json(
      { success: true, message: "Password updated successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating password:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error." },
      { status: 500 }
    );
  }
}
