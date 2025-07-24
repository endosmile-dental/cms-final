import LabWorkModel from "@/app/model/LabWork.model";
import dbConnect from "@/app/utils/dbConnect";
import { NextResponse } from "next/server";

// ✅ Controller logic defined directly inside this route file
async function fetchLabWorks() {
  await dbConnect();

  try {
    const labWorks = await LabWorkModel.find()
      .populate("patientId", "fullName contactNumber")
      .populate("doctorId", "fullName specialization")
      .sort({ createdAt: -1 });

    return {
      success: true,
      data: labWorks,
    };
  } catch (error) {
    console.error("[LABWORK_FETCH_ERROR]", error);
    return {
      success: false,
      error: "Failed to fetch lab work records",
    };
  }
}

// ✅ App Router GET handler
export async function GET() {
  const response = await fetchLabWorks();

  if (!response.success) {
    return NextResponse.json({ error: response.error }, { status: 500 });
  }

  return NextResponse.json(response.data, { status: 200 });
}
