import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/utils/dbConnect";
import LabWorkModel from "@/app/model/LabWork.model";
import { requireAuth } from "@/app/utils/authz";
import DoctorModel from "@/app/model/Doctor.model";
import { errorResponse, successResponse } from "@/app/utils/api";

async function deleteLabWork(id: string) {
  await dbConnect();

  try {
    const deleted = await LabWorkModel.findByIdAndDelete(id);

    if (!deleted) {
      return {
        success: false,
        error: "Lab work not found",
        status: 404,
      };
    }

    return {
      success: true,
      message: "Lab work deleted successfully",
      status: 200,
    };
  } catch (error) {
    console.error("[LABWORK_DELETE_ERROR]", error);
    return {
      success: false,
      error: "Failed to delete lab work",
      status: 500,
    };
  }
}

// 🚀 Updated route handler
export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth(["Doctor", "Admin", "SuperAdmin"]);
  if ("error" in authResult) return authResult.error;
  const { user } = authResult;

  // Extract ID from URL path
  const pathSegments = request.nextUrl.pathname.split("/");
  const id = pathSegments[pathSegments.length - 1];

  // Validate ID
  if (!id) {
    return errorResponse(400, "Missing lab work ID");
  }

  if (user.role === "Doctor") {
    const doctor = await DoctorModel.findOne({ userId: user.id }).select("_id");
    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    const existingLabWork = await LabWorkModel.findById(id).select("doctorId");
    if (!existingLabWork) {
      return NextResponse.json({ error: "Lab work not found" }, { status: 404 });
    }

    if (existingLabWork.doctorId.toString() !== doctor._id.toString()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const response = await deleteLabWork(id);

  if (!response.success) {
    return errorResponse(response.status, response.error ?? "Something went wrong");
  }

  return successResponse({ message: response.message }, response.status);
}
