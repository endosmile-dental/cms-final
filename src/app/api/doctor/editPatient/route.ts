import { z } from "zod";
import PatientModel from "@/app/model/Patient.model";
import dbConnect from "@/app/utils/dbConnect";
import { requireAuth } from "@/app/utils/authz";
import { errorResponse, parseJson, successResponse } from "@/app/utils/api";

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
    const authResult = await requireAuth(["Doctor", "Admin", "SuperAdmin"]);
    if ("error" in authResult) return authResult.error;

    // Connect to the database
    await dbConnect();

    const parsed = await parseJson(request, editPatientSchema);
    if ("error" in parsed) return parsed.error;
    const data = parsed.data;

    // Find and update the patient in the database
    const updatedPatient = await PatientModel.findByIdAndUpdate(
      data._id,
      data,
      { new: true, runValidators: true }
    );

    if (!updatedPatient) {
      return errorResponse(404, "Patient not found");
    }

    return successResponse(
      { message: "Patient updated successfully", patient: updatedPatient },
      200
    );
  } catch (error) {
    console.error("Error in editPatient route:", error);
    return errorResponse(
      500,
      "Error updating patient",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
