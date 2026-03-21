import { Treatment } from "@/app/model/Treatment.model";
import dbConnect from "@/app/utils/dbConnect";
import { NextRequest, NextResponse } from "next/server";

export type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();

    const { id } = await params;
    const treatment = await Treatment.findById(id);

    if (!treatment) {
      return NextResponse.json(
        {
          success: false,
          message: "Treatment not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: treatment,
    });
  } catch (error) {
    console.error("Error fetching treatment:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch treatment",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();

    const body = await request.json();
    const { name, category, description, defaultPrice, isActive } = body;
    const { id } = await params;

    // Validation
    if (!name || !category) {
      return NextResponse.json(
        {
          success: false,
          message: "Name and category are required",
        },
        { status: 400 },
      );
    }

    // Check if treatment already exists with different ID
    const existingTreatment = await Treatment.findOne({
      name: name.trim(),
      _id: { $ne: id },
    });
    if (existingTreatment) {
      return NextResponse.json(
        {
          success: false,
          message: "Treatment with this name already exists",
        },
        { status: 409 },
      );
    }

    const treatment = await Treatment.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        category,
        description: description?.trim(),
        defaultPrice: defaultPrice || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
      { new: true, runValidators: true },
    );

    if (!treatment) {
      return NextResponse.json(
        {
          success: false,
          message: "Treatment not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: treatment,
      message: "Treatment updated successfully",
    });
  } catch (error) {
    console.error("Error updating treatment:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update treatment",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();

    const { id } = await params;
    const treatment = await Treatment.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );

    if (!treatment) {
      return NextResponse.json(
        {
          success: false,
          message: "Treatment not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Treatment deactivated successfully",
    });
  } catch (error) {
    console.error("Error deleting treatment:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete treatment",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
