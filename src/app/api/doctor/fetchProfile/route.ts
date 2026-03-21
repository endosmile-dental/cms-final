import dbConnect from "@/app/utils/dbConnect";
import DoctorModel from "@/app/model/Doctor.model";
import { requireAuth, resolveUserIdFromHeader } from "@/app/utils/authz";
import { errorResponse, successResponse } from "@/app/utils/api";

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
      .select(
        "_id clinicId fullName specialization specializationDetails contactNumber address qualifications experienceYears gender rating workingHours createdAt updatedAt",
      )
      .lean<{ _id: string; clinicId: string; fullName: string; specialization: string; specializationDetails: string; contactNumber: string; address: string; qualifications: string; experienceYears: number; gender: string; rating: number; workingHours: string; createdAt: Date; updatedAt: Date } | null>();

    if (!doctor?._id) {
      return errorResponse(404, "Doctor not found");
    }

    const transformedDoctor = {
      ...doctor,
      _id: doctor._id?.toString(),
      clinicId: doctor.clinicId?.toString(),
      createdAt: doctor.createdAt?.toISOString(),
      updatedAt: doctor.updatedAt?.toISOString(),
    };

    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[perf] GET /api/doctor/fetchProfile ${Date.now() - startedAt}ms`,
      );
    }

    return successResponse({ doctor: transformedDoctor }, 200);
  } catch (error: unknown) {
    console.error("Error fetching doctor details:", error);
    if (error instanceof Error) {
      return errorResponse(500, error.message);
    }
    return errorResponse(500, "Unknown error occurred");
  }
}
