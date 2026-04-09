import { z } from "zod";
import DoctorModel from "@/app/model/Doctor.model";
import NoteModel from "@/app/model/Note.model";
import dbConnect from "@/app/utils/dbConnect";
import { requireAuth, resolveUserIdFromHeader } from "@/app/utils/authz";
import { errorResponse, parseJson, successResponse } from "@/app/utils/api";

const noteSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  category: z
    .enum(["Clinical", "Personal", "Reminder", "Follow-up", "Other"])
    .optional()
    .default("Clinical"),
  priority: z
    .enum(["Low", "Medium", "High", "Urgent"])
    .optional()
    .default("Medium"),
  isPrivate: z.boolean().optional().default(false),
  tags: z.array(z.string()).optional().default([]),
});

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(["Doctor", "Admin", "SuperAdmin"]);
    if ("error" in authResult) return authResult.error;
    const { user } = authResult;

    await dbConnect();
    const parsed = await parseJson(request, noteSchema);
    if ("error" in parsed) return parsed.error;
    const data = parsed.data;

    // Get doctor ID from header
    const doctorIdResult = resolveUserIdFromHeader(
      request,
      user,
      "x-doctor-id"
    );
    if ("error" in doctorIdResult) return doctorIdResult.error;
    const { userId: doctorId } = doctorIdResult;

    // Find the doctor to get clinicId
    const doctor = await DoctorModel.findOne({ userId: doctorId });
    if (!doctor) {
      return errorResponse(404, "Doctor not found");
    }

    // Create the note
    const newNote = await NoteModel.create({
      patientId: data.patientId,
      doctorId: doctor._id,
      clinicId: doctor.clinicId,
      title: data.title,
      content: data.content,
      category: data.category,
      priority: data.priority,
      isPrivate: data.isPrivate,
      tags: data.tags,
    });

    return successResponse(
      { message: "Note created successfully", note: newNote },
      201
    );
  } catch (error: unknown) {
    console.error("Error in addNote route:", error);
    if (error instanceof Error) {
      return errorResponse(500, "Error creating note", error.message);
    }
    return errorResponse(500, "Unknown error occurred");
  }
}