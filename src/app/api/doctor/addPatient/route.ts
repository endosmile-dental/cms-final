// app/api/auth/doctor/addPatient/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

// Import your models (adjust the paths as needed)
import DoctorModel from "@/app/model/Doctor.model";
import UserModel from "@/app/model/User.model";
import PatientModel from "@/app/model/Patient.model";
import dbConnect from "@/app/utils/dbConnect";

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
    await dbConnect();
    // Parse and validate the incoming JSON request body
    const body = await request.json();
    const data = patientRegistrationSchema.parse(body);

    // Retrieve the doctor id from the custom header (provided via session)
    const doctorId = request.headers.get("x-doctor-id");
    if (!doctorId) {
      return NextResponse.json(
        { error: "Doctor ID is missing from session." },
        { status: 401 }
      );
    }

    // Find the doctor record (to later retrieve ClinicId)
    const doctor = await DoctorModel.findOne({ userId: doctorId });
    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found." }, { status: 404 });
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

    return NextResponse.json(
      { message: "Patient registered successfully", patient: newPatient },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error in addPatient route:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { message: "Error in adding patient route:", error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { message: "Unknown error occurred" },
      { status: 500 }
    );
  }
}
