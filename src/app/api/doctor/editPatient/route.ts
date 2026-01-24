import { NextResponse } from "next/server";
import { z } from "zod";
import PatientModel from "@/app/model/Patient.model";
import dbConnect from "@/app/utils/dbConnect";

// Define validation schema using Zod
const editPatientSchema = z.object({
  _id: z.string().min(1, "Patient ID is required"),
  fullName: z.string().min(1, "Full name is required"),
  contactNumber: z.string().min(1, "Contact number is required"),
  gender: z.enum(["Male", "Female", "Other"]),
  age: z.string().min(1, "Age is required"),
  dateOfBirth: z.string().optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
    })
    .optional(),
  currentMedications: z.array(z.string()).optional(),
  emergencyContact: z
    .object({
      fullName: z.string().optional(),
      contactNumber: z.string().optional(),
      relationship: z.string().optional(),
    })
    .optional(),
});

export async function PUT(request: Request) {
  try {
    // Connect to the database
    await dbConnect();

    // Parse and validate request body
    const body = await request.json();
    const data = editPatientSchema.parse(body);

    // Find and update the patient in the database
    const updatedPatient = await PatientModel.findByIdAndUpdate(
      data._id,
      data,
      { new: true, runValidators: true }
    );

    if (!updatedPatient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Patient updated successfully", patient: updatedPatient },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in editPatient route:", error);
    return NextResponse.json(
      {
        message: "Error updating patient",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
