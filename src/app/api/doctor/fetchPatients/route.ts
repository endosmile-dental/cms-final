import { NextResponse } from "next/server";
import PatientModel from "@/app/model/Patient.model";
import dbConnect from "@/app/utils/dbConnect";

export async function GET() {
  try {
    dbConnect();
    // Fetch all patients from the database
    const patients = await PatientModel.find().select("-permissions -__v");
    return NextResponse.json({ patients });
  } catch (error: unknown) {
    console.error("Error fetching patients:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { message: "Error fetching patients:", error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { message: "Unknown error occurred" },
      { status: 500 }
    );
  }
}
