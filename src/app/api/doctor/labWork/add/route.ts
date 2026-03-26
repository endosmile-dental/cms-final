import { NextRequest } from "next/server";
import { Types } from "mongoose";
import LabWorkModel from "@/app/model/LabWork.model";
import DoctorModel from "@/app/model/Doctor.model";
import dbConnect from "@/app/utils/dbConnect";
import { labWorkSchema } from "@/schemas/zobLabWorkSchema";
import { z } from "zod";
import { uploadToCloudinary } from "@/app/utils/cloudinaryUpload";
import { formatDateForServer } from "@/app/utils/dateUtils";
import { requireAuth } from "@/app/utils/authz";
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

async function createLabWork(req: NextRequest, userId: string) {
  await dbConnect();

  try {
    // Find the Doctor document using the userId to get the correct doctorId
    const doctor = await DoctorModel.findOne({ userId })
      .select("_id")
      .lean<{ _id: Types.ObjectId } | null>();
    
    if (!doctor?._id) {
      return {
        success: false,
        error: "Doctor profile not found",
        status: 404,
      };
    }

    const formData = await req.formData();
    const fileEntries = formData.getAll("attachments");
    const files = fileEntries.filter(
      (entry) => entry instanceof File && entry.size > 0
    ) as File[];

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
      return {
        success: false,
        error: "File validation failed",
        details: fileErrors,
        status: 400,
      };
    }

    // Upload files to Cloudinary using your utility function
    const uploadPromises = files.map((file) => uploadToCloudinary(file));
    const cloudinaryResults = await Promise.all(uploadPromises);

    // Prepare attachments data
    const attachments = cloudinaryResults.map((result, index) => ({
      public_id: result.public_id,
      url: result.secure_url,
      format: result.format,
      bytes: result.bytes,
      original_filename: result.original_filename || files[index].name,
    }));

    // Extract other form data
    const formObject = Object.fromEntries(formData.entries());

    // Prepare lab work data - use Doctor model's _id for doctorId
    const labWorkData = {
      ...formObject,
      doctorId: doctor._id, // Use Doctor model's _id, not User model's _id
      toothNumbers: JSON.parse(formObject.toothNumbers as string),
      attachments,
      sentToLabOn: formatDateForServer(new Date()),
    };

    // Validate with Zod
    const parsed = labWorkSchema.parse(labWorkData);

    // Save to database
    const newLabWork = await LabWorkModel.create(parsed);

    // Populate the newly created lab work to match the fetchAll response format
    const populatedLabWork = await LabWorkModel.findById(newLabWork._id)
      .populate("patientId", "fullName contactNumber")
      .populate("doctorId", "fullName specialization")
      .lean() as { _id: Types.ObjectId; [key: string]: unknown } | null;

    if (!populatedLabWork) {
      return {
        success: false,
        error: "Failed to retrieve created lab work",
        status: 500,
      };
    }

    // Convert to plain object and serialize _id to string
    const serializedLabWork: Record<string, unknown> = {
      ...populatedLabWork,
      _id: populatedLabWork._id.toString(),
    };

    return {
      success: true,
      data: serializedLabWork,
    };
  } catch (error) {
    console.error("[LABWORK_CREATE_ERROR]", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation failed",
        details: error.errors,
        status: 400,
      };
    }

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create lab work entry",
      status: 500,
    };
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(["Doctor", "Admin", "SuperAdmin"]);
  if ("error" in authResult) return authResult.error;

  const response = await createLabWork(req, authResult.user.id);

  if (!response.success || !response.data) {
    return errorResponse(
      response.status || 500,
      response.error ?? "Something went wrong",
      response.details || null
    );
  }

  return successResponse(response.data, 201);
}
