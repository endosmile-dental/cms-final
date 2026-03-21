import { NextRequest } from "next/server";
import LabWorkModel from "@/app/model/LabWork.model";
import dbConnect from "@/app/utils/dbConnect";
import { labWorkSchema } from "@/schemas/zobLabWorkSchema";
import { z } from "zod";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from "@/app/utils/cloudinaryUpload";
import { requireAuth } from "@/app/utils/authz";
import DoctorModel from "@/app/model/Doctor.model";
import { errorResponse, successResponse } from "@/app/utils/api";

// File validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",          // Added
  "image/bmp",          // Added
  "image/svg+xml",      // Added
  "image/heic",         // For iOS
  "image/heif",         // For iOS
  "application/pdf",
];

export async function PUT(request: NextRequest) {
  try {
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

    await dbConnect();

    if (user.role === "Doctor") {
      const doctor = await DoctorModel.findOne({ userId: user.id }).select("_id");
      if (!doctor) {
        return errorResponse(404, "Doctor not found");
      }

      const existingLabWork = await LabWorkModel.findById(id).select("doctorId");
      if (!existingLabWork) {
        return errorResponse(404, "Lab work not found");
      }

      if (existingLabWork.doctorId.toString() !== doctor._id.toString()) {
        return errorResponse(403, "Forbidden");
      }
    }

    // Parse FormData instead of JSON
    const formData = await request.formData();

    // Extract updates JSON
    const updates = JSON.parse(formData.get("updates") as string);
    const files = formData.getAll("attachments") as File[];
    const deletedAttachments = updates.deletedAttachments || [];

    // Convert toothNumbers from string to array if needed
    if (updates.toothNumbers && typeof updates.toothNumbers === "string") {
      updates.toothNumbers = updates.toothNumbers
        .split(",")
        .map((t: string) => t.trim())
        .filter(Boolean);
    }

    // ✅ Automatic date handling based on status
    if (updates.status === "Received" && !updates.receivedFromLabOn) {
      updates.receivedFromLabOn = new Date();
    }

    if (updates.status === "Rework" && !updates.reWorkSentDate) {
      updates.reWorkSentDate = new Date();
    }

    if (updates.status === "Fitted" && !updates.fittedOn) {
      updates.fittedOn = new Date();
    }

    // Validate files
    const fileErrors = [];
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        fileErrors.push(`File ${file.name} exceeds 10MB limit`);
      }
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        fileErrors.push(`Invalid file type for ${file.name}: ${file.type}`);
      }
    }

    if (fileErrors.length > 0) {
      return errorResponse(400, "File validation failed", fileErrors);
    }

    // Delete attachments marked for deletion
    for (const publicId of deletedAttachments) {
      try {
        // We don't have the format, so we use 'auto' as a fallback
        await deleteFromCloudinary(publicId, "auto");
      } catch (error) {
        console.error(`Failed to delete attachment ${publicId}:`, error);
      }
    }

    // Upload new files to Cloudinary
    const uploadPromises = files.map((file) => uploadToCloudinary(file));
    const cloudinaryResults = await Promise.all(uploadPromises);

    // Prepare new attachments data
    const newAttachments = cloudinaryResults.map((result, index) => ({
      public_id: result.public_id,
      url: result.secure_url,
      format: result.format,
      bytes: result.bytes,
      original_filename: result.original_filename || files[index].name,
    }));

    // Validate partial input using Zod (excluding attachments)
    const { attachments: _, ...updatesWithoutAttachments } = updates; // eslint-disable-line @typescript-eslint/no-unused-vars
    const parsed = labWorkSchema.partial().parse(updatesWithoutAttachments);

    interface UpdateOperations {
      [key: string]: unknown;
      $pull?: { attachments: { public_id: { $in: string[] } } };
      $push?: { attachments: { $each: typeof newAttachments } };
    }

    const updateOperations: UpdateOperations = {
      ...parsed,
    };

    // Add MongoDB operators for attachments
    if (deletedAttachments.length > 0) {
      updateOperations.$pull = {
        attachments: { public_id: { $in: deletedAttachments } },
      };
    }

    if (newAttachments.length > 0) {
      updateOperations.$push = {
        attachments: { $each: newAttachments },
      };
    }

    // Update LabWork by ID
    const updatedLabWork = await LabWorkModel.findByIdAndUpdate(
      id,
      updateOperations,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedLabWork) {
      return errorResponse(404, "Lab work not found");
    }

    return successResponse(updatedLabWork, 200);
  } catch (error) {
    console.error("[LABWORK_UPDATE_ERROR]", error);

    if (error instanceof z.ZodError) {
      return errorResponse(400, "Validation failed", error.errors);
    }

    return errorResponse(500, "Failed to update lab work entry");
  }
}
