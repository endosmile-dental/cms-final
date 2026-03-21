import { NextResponse } from "next/server";
import PatientModel from "@/app/model/Patient.model";
import DoctorModel from "@/app/model/Doctor.model";
import dbConnect from "@/app/utils/dbConnect";
import { requireAuth } from "@/app/utils/authz";
import { errorResponse } from "@/app/utils/api";

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(["Doctor", "Admin", "SuperAdmin"]);
    if ("error" in authResult) return authResult.error;
    const { user } = authResult;

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    
    if (!query.trim()) {
      return NextResponse.json({ patients: [] });
    }

    // Use the authenticated user's ID directly
    const doctorUserId = user.id;

    const doctor = await DoctorModel.findOne({ userId: doctorUserId });
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