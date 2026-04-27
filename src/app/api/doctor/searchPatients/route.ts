import { NextResponse } from "next/server";
import PatientModel from "@/app/model/Patient.model";
import DoctorModel from "@/app/model/Doctor.model";
import AssistantModel from "@/app/model/Assistant.model";
import dbConnect from "@/app/utils/dbConnect";
import { requireAuth } from "@/app/utils/authz";
import { errorResponse } from "@/app/utils/api";

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(["Doctor", "Assistant", "Admin", "SuperAdmin"]);
    if ("error" in authResult) return authResult.error;
    const { user } = authResult;

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const xDoctorUserId = searchParams.get('x-doctor-user-id');
    const doctorId = searchParams.get('doctorId');
    
    if (!query.trim()) {
      return NextResponse.json({ patients: [] });
    }

    let doctor = null;

    if (user.role === "Assistant") {
      const assistant = await AssistantModel.findOne({ userId: user.id })
        .select("doctorId clinicId")
        .lean<{ doctorId: string; clinicId: string } | null>();
      if (!assistant?.doctorId || !assistant?.clinicId) {
        return errorResponse(403, "Assistant not assigned to a doctor");
      }

      const targetDoctorId = doctorId || assistant.doctorId.toString();
      doctor = await DoctorModel.findOne({
        $or: [{ _id: targetDoctorId }, { userId: targetDoctorId }],
        clinicId: assistant.clinicId,
      });
    } else {
      const targetDoctorId = doctorId || xDoctorUserId || user.id;
      doctor = await DoctorModel.findOne({
        $or: [{ _id: targetDoctorId }, { userId: targetDoctorId }],
      });
    }

    if (!doctor) {
      return errorResponse(404, "Doctor not found");
    }

    // Enhanced search with multiple fields and fuzzy matching
    // Escape special regex characters to prevent injection
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escapedQuery, 'i');
    
    const patients = await PatientModel.find({
      DoctorId: doctor._id,
      $or: [
        { fullName: { $regex: searchRegex } },
        { PatientId: { $regex: searchRegex } },
        { contactNumber: { $regex: searchRegex } }
      ]
    })
    .select("userId DoctorId ClinicId PatientId fullName contactNumber gender age dateOfBirth email address medicalHistory currentMedications emergencyContact createdAt updatedAt")
    .sort({ 
      // Prioritize exact matches and shorter names
      fullName: 1 
    })
    .limit(20); // Limit results for performance

    return NextResponse.json({ patients });
  } catch (error: unknown) {
    console.error("Patient search error:", error);
    if (error instanceof Error) {
      return errorResponse(500, "Search failed:", error.message);
    }
    return errorResponse(500, "Unknown error occurred during search");
  }
}
