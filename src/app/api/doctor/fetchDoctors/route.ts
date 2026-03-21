import { NextRequest } from "next/server";
import dbConnect from "@/app/utils/dbConnect";
import DoctorModel from "@/app/model/Doctor.model";
import PatientModel from "@/app/model/Patient.model";
import { requireAuth, resolveUserIdFromHeader } from "@/app/utils/authz";
import { errorResponse, successResponse } from "@/app/utils/api";

export async function GET(request: NextRequest) {
  const startedAt = Date.now();

  try {
    const authResult = await requireAuth([
      "Doctor",
      "Patient",
      "Admin",
      "SuperAdmin",
    ]);
    if ("error" in authResult) return authResult.error;

    const { user } = authResult;

    await dbConnect();

    const userIdResult = resolveUserIdFromHeader(request, user, "x-user-id");
    if ("error" in userIdResult) return userIdResult.error;
    const { userId } = userIdResult;

    let clinicId: string | null = null;

    if (user.role === "Doctor") {
      const doctor = await DoctorModel.findOne({ userId })
        .select("clinicId")
        .lean();
      clinicId = doctor?.clinicId?.toString() || null;
    } else if (user.role === "Patient") {
      const patient = await PatientModel.findOne({ userId })
        .select("ClinicId")
        .lean();
      clinicId = patient?.ClinicId?.toString() || null;
    } else {
      return errorResponse(
        403,
        "Access denied. Only Doctors and Patients are allowed.",
      );
    }

    if (!clinicId) {
      return errorResponse(404, "No clinic found for this user");
    }

    const doctors = await DoctorModel.find({ clinicId })
      .select(
        "_id clinicId fullName specialization specializationDetails contactNumber address qualifications experienceYears gender rating workingHours createdAt updatedAt",
      )
      .lean();

    const transformedDoctors = doctors.map((doctor) => ({
      ...doctor,
      _id: doctor._id?.toString(),
      clinicId: doctor.clinicId?.toString(),
      createdAt: doctor.createdAt?.toISOString(),
      updatedAt: doctor.updatedAt?.toISOString(),
    }));

    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[perf] GET /api/doctor/fetchDoctors ${Date.now() - startedAt}ms (count=${transformedDoctors.length})`,
      );
    }

    return successResponse({ doctors: transformedDoctors }, 200);
  } catch (error: unknown) {
    console.error("Error fetching doctors:", error);
    return errorResponse(
      500,
      error instanceof Error ? error.message : "Unknown error occurred",
    );
  }
}
