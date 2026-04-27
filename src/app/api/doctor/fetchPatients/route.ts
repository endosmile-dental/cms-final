import { NextResponse } from "next/server";
import PatientModel from "@/app/model/Patient.model";
import DoctorModel from "@/app/model/Doctor.model";
import AssistantModel from "@/app/model/Assistant.model";
import dbConnect from "@/app/utils/dbConnect";
import { requireAuth, resolveUserIdFromHeader } from "@/app/utils/authz";
import { errorResponse } from "@/app/utils/api";

export async function GET(request: Request) {
  const startedAt = Date.now();

  try {
    const authResult = await requireAuth(["Doctor", "Assistant", "Admin", "SuperAdmin"]);
    if ("error" in authResult) return authResult.error;
    const { user } = authResult;

    await dbConnect();

    let doctorUserId: string;

    // For Assistants, get their assigned doctor's userId
    if (user.role === "Assistant") {
      const assistant = await AssistantModel.findOne({ userId: user.id }).select("doctorId");
      if (!assistant) {
        return errorResponse(404, "Assistant not found");
      }
      const doctorRecord = await DoctorModel.findById(assistant.doctorId).select("userId");
      if (!doctorRecord) {
        return errorResponse(404, "Assigned doctor not found");
      }
      doctorUserId = doctorRecord.userId.toString();
    } else {
      const userIdResult = resolveUserIdFromHeader(
        request,
        user,
        "x-doctor-user-id",
      );
      if ("error" in userIdResult) return userIdResult.error;
      doctorUserId = userIdResult.userId;
    }

    const doctor = await DoctorModel.findOne({ userId: doctorUserId })
      .select("_id")
      .lean<{ _id: string } | null>();

    if (!doctor?._id) {
      return errorResponse(404, "Doctor not found");
    }

    const patients = await PatientModel.find({ DoctorId: doctor._id })
      .select("_id userId DoctorId ClinicId PatientId fullName contactNumber gender age dateOfBirth email address medicalHistory currentMedications emergencyContact createdAt updatedAt")
      .sort({ createdAt: -1 })
      .lean<{ _id: string; userId: string; DoctorId: string; ClinicId: string; PatientId: string; fullName: string; contactNumber: string; gender: string; age: number; dateOfBirth: Date; email: string; address: string; medicalHistory: string; currentMedications: string; emergencyContact: string; createdAt: Date; updatedAt: Date }[]>();

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
