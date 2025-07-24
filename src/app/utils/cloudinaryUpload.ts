import { v2 as cloudinary, UploadApiOptions, ResourceType } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const UPLOAD_OPTIONS: UploadApiOptions = {
  folder: "lab-work-attachments",
  resource_type: "auto",
  use_filename: true,
  unique_filename: false,
  overwrite: false,
  type: "upload",
  invalidate: true,
};

export const uploadToCloudinary = async (
  file: File
): Promise<CloudinaryUploadResult> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = file.type;

    const dataURI = `data:${mimeType};base64,${base64}`;

    const result = await cloudinary.uploader.upload(
      dataURI,
      UPLOAD_OPTIONS
    ) as CloudinaryUploadResult;

    return result;
  } catch (error) {
    throw new Error(
      `Cloudinary upload failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  format: string;
  bytes: number;
  original_filename: string;
  created_at: string;
  resource_type: string;
}

export const deleteFromCloudinary = async (publicId: string, format: string) => {
  // Determine resource type based on file format
  let resourceType: ResourceType = "image";
  if (format.toLowerCase() === "pdf") {
    resourceType = "raw";
  }

  return cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    invalidate: true,
  });
};