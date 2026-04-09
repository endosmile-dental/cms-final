import NoteModel from "@/app/model/Note.model";
import dbConnect from "@/app/utils/dbConnect";
import { requireAuth } from "@/app/utils/authz";
import { errorResponse, successResponse } from "@/app/utils/api";

export async function DELETE(request: Request) {
  try {
    const authResult = await requireAuth(["Doctor", "Admin", "SuperAdmin"]);
    if ("error" in authResult) return authResult.error;

    await dbConnect();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get("noteId");

    if (!noteId) {
      return errorResponse(400, "Note ID is required");
    }

    // Delete the note
    const deletedNote = await NoteModel.findByIdAndDelete(noteId);

    if (!deletedNote) {
      return errorResponse(404, "Note not found");
    }

    return successResponse(
      { message: "Note deleted successfully" },
      200
    );
  } catch (error: unknown) {
    console.error("Error in deleteNote route:", error);
    if (error instanceof Error) {
      return errorResponse(500, "Error deleting note", error.message);
    }
    return errorResponse(500, "Unknown error occurred");
  }
}