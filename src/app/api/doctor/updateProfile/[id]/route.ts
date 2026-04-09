import dbConnect from "@/app/utils/dbConnect";
import DoctorModel from "@/app/model/Doctor.model";
import { requireAuth } from "@/app/utils/authz";
import { errorResponse, successResponse } from "@/app/utils/api";
import { NextRequest } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startedAt = Date.now();
  const { id } = await params;

  try {
    const authResult = await requireAuth(["Doctor", "Admin", "SuperAdmin"]);
    if ("error" in authResult) return authResult.error;
    const { user } = authResult;

    await dbConnect();

    // Find the doctor document by the ID in the URL
    const doctorToUpdate = await DoctorModel.findById(id);
    if (!doctorToUpdate) {
      return errorResponse(404, "Doctor not found");
    }

    // Verify the authenticated user owns this doctor profile
    // The doctor document's userId field should match the authenticated user's ID
    if (doctorToUpdate.userId?.toString() !== user.id) {
      return errorResponse(403, "Unauthorized to update this profile");
    }

    const body = await request.json();

    // Build update object with only allowed fields
    const updateData: Record<string, unknown> = {};

    if (body.fullName !== undefined) {
      updateData.fullName = body.fullName;
    }
    if (body.contactNumber !== undefined) {
      updateData.contactNumber = body.contactNumber;
    }
    if (body.address !== undefined) {
      updateData.address = body.address;
    }
    if (body.specialization !== undefined) {
      updateData.specialization = body.specialization;
    }
    if (body.specializationDetails !== undefined) {
      updateData.specializationDetails = body.specializationDetails;
    }
    if (body.qualifications !== undefined) {
      updateData.qualifications = body.qualifications;
    }
    if (body.experienceYears !== undefined) {
      updateData.experienceYears = body.experienceYears;
    }
    if (body.gender !== undefined) {
      updateData.gender = body.gender;
    }

    updateData.updatedAt = new Date();

    const updatedDoctor = await DoctorModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .select(
        "_id clinicId fullName specialization specializationDetails contactNumber address qualifications experienceYears gender rating workingHours createdAt updatedAt"
      )
      .lean<{
        _id: string;
        clinicId: string;
        fullName: string;
        specialization: string;
        specializationDetails: string;
        contactNumber: string;
        address: string;
        qualifications: string;
        experienceYears: number;
        gender: string;
        rating: number;
        workingHours: string;
        createdAt: Date;
        updatedAt: Date;
      } | null>();

    if (!updatedDoctor?._id) {
      return errorResponse(404, "Doctor not found after update");
    }

    const transformedDoctor = {
      ...updatedDoctor,
      _id: updatedDoctor._id?.toString(),
      clinicId: updatedDoctor.clinicId?.toString(),
      createdAt: updatedDoctor.createdAt?.toISOString(),
      updatedAt: updatedDoctor.updatedAt?.toISOString(),
    };

    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[perf] PUT /api/doctor/updateProfile/${id} ${Date.now() - startedAt}ms`
      );
    }

    return successResponse(transformedDoctor, 200);
  } catch (error: unknown) {
    console.error("Error updating doctor profile:", error);
    if (error instanceof Error) {
      return errorResponse(500, error.message);
    }
    return errorResponse(500, "Unknown error occurred");
  }
}