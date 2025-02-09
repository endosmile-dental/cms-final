import { NextResponse } from "next/server";
import PatientModel from "@/app/model/Patient.model";
import dbConnect from "@/app/utils/dbConnect";

export async function GET() {
  try {
    dbConnect();
    // Fetch all patients from the database
    const patients = await PatientModel.find().select(
      "-permissions -__v"
    );
    return NextResponse.json({ patients });
  } catch (error: any) {
    console.error("Error fetching patients:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
