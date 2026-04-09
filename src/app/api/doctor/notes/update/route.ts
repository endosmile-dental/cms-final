import { z } from "zod";
import NoteModel from "@/app/model/Note.model";
import dbConnect from "@/app/utils/dbConnect";
import { requireAuth } from "@/app/utils/authz";
import { errorResponse, parseJson, successResponse } from "@/app/utils/api";

const noteUpdateSchema = z.object({
  noteId: z.string().min(1, "Note ID is required"),
  title: z.string().min(1, "Title is required").optional(),
  content: z.string().min(1, "Content is required").optional(),
  category: z
    .enum(["Clinical", "Personal", "Reminder", "Follow-up", "Other"])
    .optional(),
  priority: z
    .enum(["Low", "Medium", "High", "Urgent"])
    .optional(),
  isPrivate: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

export async function PUT(request: Request) {
  try {
    const authResult = await requireAuth(["Doctor", "Admin", "SuperAdmin"]);
    if ("error" in authResult) return authResult.error;

    await dbConnect();
    const parsed = await parseJson(request, noteUpdateSchema);
    if ("error" in parsed) return parsed.error;
    const data = parsed.data;

    // Find and update the note
    const updatedNote = await NoteModel.findByIdAndUpdate(
      data.noteId,
      {
        ...(data.title && { title: data.title }),
        ...(data.content && { content: data.content }),
        ...(data.category && { category: data.category }),
        ...(data.priority && { priority: data.priority }),
        ...(data.isPrivate !== undefined && { isPrivate: data.isPrivate }),
        ...(data.tags && { tags: data.tags }),
      },
      { new: true, runValidators: true }
    );

    if (!updatedNote) {
      return errorResponse(404, "Note not found");
    }

    return successResponse(
      { message: "Note updated successfully", note: updatedNote },
      200
    );
  } catch (error: unknown) {
    console.error("Error in updateNote route:", error);
    if (error instanceof Error) {
      return errorResponse(500, "Error updating note", error.message);
    }
    return errorResponse(500, "Unknown error occurred");
  }
}