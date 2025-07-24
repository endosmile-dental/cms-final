import { NextRequest, NextResponse } from "next/server";
import LabWorkModel from "@/app/model/LabWork.model";
import dbConnect from "@/app/utils/dbConnect";
import { deleteFromCloudinary } from "@/app/utils/cloudinaryUpload";

export async function DELETE(req: NextRequest) {
  await dbConnect();

  try {
    const { labWorkId, publicId, format } = await req.json();

    // Delete from Cloudinary
    await deleteFromCloudinary(publicId, format);

    // Delete from MongoDB
    const result = await LabWorkModel.findByIdAndUpdate(
      labWorkId,
      { $pull: { attachments: { public_id: publicId } } },
      { new: true }
    );

    if (!result) {
      return NextResponse.json(
        { error: "Lab work not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    console.error("[DELETE_ATTACHMENT_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to delete attachment" },
      { status: 500 }
    );
  }
}
