import { NextRequest } from "next/server";
import LabWorkModel from "@/app/model/LabWork.model";
import dbConnect from "@/app/utils/dbConnect";
import { deleteFromCloudinary } from "@/app/utils/cloudinaryUpload";
import { requireAuth } from "@/app/utils/authz";
import DoctorModel from "@/app/model/Doctor.model";
import { errorResponse, parseJson, successResponse } from "@/app/utils/api";
import { deleteAttachmentSchema } from "@/app/schemas/api";

export async function DELETE(req: NextRequest) {
  const authResult = await requireAuth(["Doctor", "Admin", "SuperAdmin"]);
  if ("error" in authResult) return authResult.error;
  const { user } = authResult;

  await dbConnect();

  try {
    const parsed = await parseJson(req, deleteAttachmentSchema);
    if ("error" in parsed) return parsed.error;
    const { labWorkId, publicId, format } = parsed.data;

    if (user.role === "Doctor") {
      const doctor = await DoctorModel.findOne({ userId: user.id }).select("_id");
      if (!doctor) {
        return errorResponse(404, "Doctor not found");
      }

      const existingLabWork = await LabWorkModel.findById(labWorkId).select("doctorId");
      if (!existingLabWork) {
        return errorResponse(404, "Lab work not found");
      }

      if (existingLabWork.doctorId.toString() !== doctor._id.toString()) {
        return errorResponse(403, "Forbidden");
      }
    }

    // Delete from Cloudinary
    await deleteFromCloudinary(publicId, format);

    // Delete from MongoDB
    const result = await LabWorkModel.findByIdAndUpdate(
      labWorkId,
      { $pull: { attachments: { public_id: publicId } } },
      { new: true }
    );

    if (!result) {
      return errorResponse(404, "Lab work not found");
    }

    return successResponse({ data: result }, 200);
  } catch (error) {
    console.error("[DELETE_ATTACHMENT_ERROR]", error);
    return errorResponse(500, "Failed to delete attachment");
  }
}
