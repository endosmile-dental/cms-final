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

    // Serialize the data to ensure proper string conversion for frontend
    const serializedLabWorks = labWorks.map((labWork) => {
      const plainObj = { ...labWork };
      
      // Convert _id to string
      if (plainObj._id && plainObj._id.toString) {
        plainObj._id = plainObj._id.toString();
      }
      
      // Convert patientId to proper object format
      if (plainObj.patientId && typeof plainObj.patientId === 'object' && '_id' in plainObj.patientId) {
        const patient = plainObj.patientId as { _id: unknown; fullName?: string; contactNumber?: string };
        plainObj.patientId = {
          _id: patient._id?.toString() || '',
          fullName: patient.fullName || '',
          contactNumber: patient.contactNumber || '',
        };
      }
      
      // Convert doctorId to proper object format
      if (plainObj.doctorId && typeof plainObj.doctorId === 'object' && '_id' in plainObj.doctorId) {
        const doctor = plainObj.doctorId as { _id: unknown; fullName?: string; specialization?: string };
        plainObj.doctorId = {
          _id: doctor._id?.toString() || '',
          fullName: doctor.fullName || '',
          specialization: doctor.specialization || '',
        };
      }
      
      return plainObj;
    });

    return {
      success: true,
      data: serializedLabWorks,
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
      .lean<{ _id: string } | null>();
    if (!doctor?._id) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }
    filter = { doctorId: doctor._id };
  } else if (user.role === "Patient") {
    const patient = await PatientModel.findOne({ userId: user.id })
      .select("_id")
      .lean<{ _id: string } | null>();
    if (!patient?._id) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }
    filter = { patientId: patient._id };
  }

  const response = await fetchLabWorks(filter);

  if (!response.success) {
    return errorResponse(500, response.error ?? "Something went wrong");
  }

  if (process.env.NODE_ENV !== "production") {
    console.log(
      `[perf] GET /api/doctor/labWork/fetchAll ${Date.now() - startedAt}ms (count=${response.data?.length || 0})`,
    );
  }

  return successResponse({ labWorks: response.data || [] }, 200);
}
