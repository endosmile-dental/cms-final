import { NextResponse } from "next/server";
import PatientModel from "@/app/model/Patient.model";
import DoctorModel from "@/app/model/Doctor.model";
import dbConnect from "@/app/utils/dbConnect";
import { requireAuth, resolveUserIdFromHeader } from "@/app/utils/authz";
import { errorResponse } from "@/app/utils/api";

export async function GET(request: Request) {
  const startedAt = Date.now();

  try {
    const authResult = await requireAuth(["Doctor", "Admin", "SuperAdmin"]);
    if ("error" in authResult) return authResult.error;
    const { user } = authResult;

    await dbConnect();

    const userIdResult = resolveUserIdFromHeader(
      request,
      user,
      "x-doctor-user-id",
    );
    if ("error" in userIdResult) return userIdResult.error;
    const { userId: doctorUserId } = userIdResult;

    const doctor = await DoctorModel.findOne({ userId: doctorUserId })
      .select("_id")
      .lean();

    if (!doctor?._id) {
      return errorResponse(404, "Doctor not found");
    }

    const patients = await PatientModel.find({ DoctorId: doctor._id })
      .select("_id userId DoctorId ClinicId PatientId fullName contactNumber gender age dateOfBirth email address medicalHistory currentMedications emergencyContact createdAt updatedAt")
      .sort({ createdAt: -1 })
      .lean();

    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[perf] GET /api/doctor/fetchPatients ${Date.now() - startedAt}ms (count=${patients.length})`,
      );
    }

    return NextResponse.json({ patients, success: true });
  } catch (error: unknown) {
    console.error("Error fetching patients:", error);
    if (error instanceof Error) {
      return errorResponse(500, "Error fetching patients:", error.message);
    }
    return errorResponse(500, "Unknown error occurred");
  }
}
