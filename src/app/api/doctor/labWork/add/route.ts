import { NextRequest, NextResponse } from "next/server";
import LabWorkModel from "@/app/model/LabWork.model";
import dbConnect from "@/app/utils/dbConnect";
import { labWorkSchema } from "@/schemas/zobLabWorkSchema";
import { z } from "zod";
import { uploadToCloudinary } from "@/app/utils/cloudinaryUpload";

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

async function createLabWork(req: NextRequest) {
  await dbConnect();

  try {
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

    // Prepare lab work data
    const labWorkData = {
      ...formObject,
      toothNumbers: JSON.parse(formObject.toothNumbers as string),
      attachments,
      sentToLabOn: new Date().toISOString(),
    };

    // Validate with Zod
    const parsed = labWorkSchema.parse(labWorkData);

    // Save to database
    const newLabWork = await LabWorkModel.create(parsed);

    return {
      success: true,
      data: newLabWork,
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
  const response = await createLabWork(req);

  if (!response.success) {
    return NextResponse.json(
      {
        error: response.error,
        details: response.details || null,
      },
      { status: response.status || 500 }
    );
  }

  return NextResponse.json(response.data, { status: 201 });
}
