import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/utils/dbConnect";
import LabWorkModel from "@/app/model/LabWork.model";

async function deleteLabWork(id: string) {
  await dbConnect();

  try {
    const deleted = await LabWorkModel.findByIdAndDelete(id);

    if (!deleted) {
      return {
        success: false,
        error: "Lab work not found",
        status: 404,
      };
    }

    return {
      success: true,
      message: "Lab work deleted successfully",
      status: 200,
    };
  } catch (error) {
    console.error("[LABWORK_DELETE_ERROR]", error);
    return {
      success: false,
      error: "Failed to delete lab work",
      status: 500,
    };
  }
}

// 🚀 Updated route handler
export async function DELETE(request: NextRequest) {
  // Extract ID from URL path
  const pathSegments = request.nextUrl.pathname.split("/");
  const id = pathSegments[pathSegments.length - 1];

  // Validate ID
  if (!id) {
    return NextResponse.json({ error: "Missing lab work ID" }, { status: 400 });
  }

  const response = await deleteLabWork(id);

  if (!response.success) {
    return NextResponse.json(
      { error: response.error },
      { status: response.status }
    );
  }

  return NextResponse.json(
    { message: response.message },
    { status: response.status }
  );
}
