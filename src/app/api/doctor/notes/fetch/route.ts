import NoteModel from "@/app/model/Note.model";
import DoctorModel from "@/app/model/Doctor.model";
import dbConnect from "@/app/utils/dbConnect";
import { requireAuth } from "@/app/utils/authz";
import { errorResponse, successResponse } from "@/app/utils/api";

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(["Doctor", "Admin", "SuperAdmin"]);
    if ("error" in authResult) return authResult.error;
    const { user } = authResult;

    await dbConnect();

    // Get doctor ID from header or use the authenticated user's ID
    const doctorIdFromHeader = request.headers.get("x-doctor-id");
    const doctorId = doctorIdFromHeader || user.id;

    // Find the doctor to get clinicId
    const doctor = await DoctorModel.findOne({ userId: doctorId });
    if (!doctor) {
      // If doctor not found, allow access but with empty results
      // This handles cases where the user might not have a doctor profile yet
      console.warn(`Doctor profile not found for userId: ${doctorId}`);
      return successResponse({ notes: [] }, 200);
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    const category = searchParams.get("category");
    const priority = searchParams.get("priority");

    // Build filter
    const filter: Record<string, unknown> = {
      clinicId: doctor.clinicId,
    };

    if (patientId) {
      filter.patientId = patientId;
    }

    if (category) {
      filter.category = category;
    }

    if (priority) {
      filter.priority = priority;
    }

    // Fetch notes, sorted by most recent first
    const notes = await NoteModel.find(filter)
      .populate("doctorId", "fullName")
      .sort({ createdAt: -1 });

    return successResponse({ notes }, 200);
  } catch (error: unknown) {
    console.error("Error in fetchNotes route:", error);
    if (error instanceof Error) {
      return errorResponse(500, "Error fetching notes", error.message);
    }
    return errorResponse(500, "Unknown error occurred");
  }
}