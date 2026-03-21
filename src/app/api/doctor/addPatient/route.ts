// app/api/auth/doctor/addPatient/route.ts
import { z } from "zod";

// Import your models (adjust the paths as needed)
import DoctorModel from "@/app/model/Doctor.model";
import UserModel from "@/app/model/User.model";
import PatientModel from "@/app/model/Patient.model";
import dbConnect from "@/app/utils/dbConnect";
import { requireAuth, resolveUserIdFromHeader } from "@/app/utils/authz";
import { errorResponse, parseJson, successResponse } from "@/app/utils/api";

// Define a Zod schema for incoming patient registration data.
const patientRegistrationSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  contactNumber: z.string().min(1, "Contact number is required"),
  gender: z.enum(["Male", "Female", "Other"]),
  age: z.string().min(1, "Age must be a positive number"),
  dateOfBirth: z.string().optional(),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
    })
    .optional(),
  medicalHistory: z.string().optional(),
  currentMedications: z.string().optional(),
  emergencyContact: z
    .object({
      fullName: z.string().optional(),
      contactNumber: z.string().optional(),
      relationship: z.string().optional(),
    })
    .optional(),
});

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(["Doctor", "Admin", "SuperAdmin"]);
    if ("error" in authResult) return authResult.error;
    const { user } = authResult;

    await dbConnect();
    const parsed = await parseJson(request, patientRegistrationSchema);
    if ("error" in parsed) return parsed.error;
    const data = parsed.data;

    // Retrieve the doctor id from the custom header (provided via session)
    const doctorIdResult = resolveUserIdFromHeader(
      request,
      user,
      "x-doctor-id"
    );
    if ("error" in doctorIdResult) return doctorIdResult.error;
    const { userId: doctorId } = doctorIdResult;

    // Find the doctor record (to later retrieve ClinicId)
    const doctor = await DoctorModel.findOne({ userId: doctorId });
    if (!doctor) {
      return errorResponse(404, "Doctor not found.");
    }

    // Create a new user for the patient.
    // NOTE: In a production system, hash the password before storing.
    const newUser = await UserModel.create({
      email: data.email,
      password: data.password,
      role: "Patient",
      status: "Active", // or your desired default status
    });

    // Count how many patients exist already
    const count = await PatientModel.countDocuments();
    // Generate a new PatientId. For example, prefix with "P" and pad to 6 digits.
    const newPatientId = "ES" + (count + 1).toString().padStart(6, "0");

    // Create the patient record using the new user's _id,
    // the doctor id from session, and the ClinicId from the doctor record.
    const newPatient = await PatientModel.create({
      userId: newUser._id,
      DoctorId: doctor._id,
      PatientId: newPatientId,
      ClinicId: doctor.clinicId, // Assumes the doctor document contains a ClinicId field
      fullName: data.fullName,
      email: data.email,
      contactNumber: data.contactNumber,
      gender: data.gender,
      age: data.age,
      ...(data.dateOfBirth && {
        dateOfBirth: new Date(data.dateOfBirth),
      }),
      address: data.address,
      medicalHistory: data.medicalHistory
        ? data.medicalHistory.split(",").map((s: string) => s.trim())
        : [],
      currentMedications: data.currentMedications
        ? data.currentMedications.split(",").map((s: string) => s.trim())
        : [],
      emergencyContact: data.emergencyContact
        ? {
            fullName: data.emergencyContact.fullName,
            contactNumber: data.emergencyContact.contactNumber,
            relationship: data.emergencyContact.relationship,
          }
        : undefined,
      // The permissions field will be set to its default value defined in the model.
    });

    return successResponse(
      { message: "Patient registered successfully", patient: newPatient },
      201
    );
  } catch (error: unknown) {
    console.error("Error in addPatient route:", error);
    if (error instanceof Error) {
      return errorResponse(500, "Error in adding patient route:", error.message);
    }
    return errorResponse(500, "Unknown error occurred");
  }
}
