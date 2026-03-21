import { NextResponse } from "next/server";
import LabWorkModel from "@/app/model/LabWork.model";
import dbConnect from "@/app/utils/dbConnect";
import { requireAuth } from "@/app/utils/authz";
import DoctorModel from "@/app/model/Doctor.model";
import PatientModel from "@/app/model/Patient.model";
import { errorResponse, successResponse } from "@/app/utils/api";

async function fetchLabWorks(filter: Record<string, unknown>) {
  await dbConnect();

  try {
    const labWorks = await LabWorkModel.find(filter)
      .populate("patientId", "fullName contactNumber")
      .populate("doctorId", "fullName specialization")
      .sort({ createdAt: -1 })
      .lean();

    return {
      success: true,
      data: labWorks,
    };
  } catch (error) {
    console.error("[LABWORK_FETCH_ERROR]", error);
    return {
      success: false,
      error: "Failed to fetch lab work records",
    };
  }
}

export async function GET() {
  const startedAt = Date.now();

  const authResult = await requireAuth([
    "Doctor",
    "Patient",
    "Admin",
    "SuperAdmin",
  ]);
  if ("error" in authResult) return authResult.error;
  const { user } = authResult;

  let filter: Record<string, unknown> = {};
  if (user.role === "Doctor") {
    const doctor = await DoctorModel.findOne({ userId: user.id })
      .select("_id")
      .lean();
    if (!doctor?._id) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }
    filter = { doctorId: doctor._id };
  } else if (user.role === "Patient") {
    const patient = await PatientModel.findOne({ userId: user.id })
      .select("_id")
      .lean();
    if (!patient?._id) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }
    filter = { patientId: patient._id };
  }

  const response = await fetchLabWorks(filter);

  if (!response.success) {
    return errorResponse(500, response.error);
  }

  if (process.env.NODE_ENV !== "production") {
    console.log(
      `[perf] GET /api/doctor/labWork/fetchAll ${Date.now() - startedAt}ms (count=${response.data.length})`,
    );
  }

  return successResponse({ labWorks: response.data }, 200);
}
