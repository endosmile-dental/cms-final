import { NextRequest, NextResponse } from "next/server";
import { Treatment } from "@/app/model/Treatment.model";
import dbConnect from "@/app/utils/dbConnect";

export async function GET() {
  try {
    await dbConnect();
    
    const treatments = await Treatment.find({ isActive: true })
      .sort({ category: 1, name: 1 })
      .lean();
    
    return NextResponse.json({
      success: true,
      treatments,
    });
  } catch (error) {
    console.error("Error fetching treatments:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch treatments",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { name, category, description, defaultPrice } = body;
    
    // Validation
    if (!name || !category) {
      return NextResponse.json(
        {
          success: false,
          message: "Name and category are required",
        },
        { status: 400 }
      );
    }
    
    // Check if treatment already exists
    const existingTreatment = await Treatment.findOne({ name: name.trim() });
    if (existingTreatment) {
      return NextResponse.json(
        {
          success: false,
          message: "Treatment with this name already exists",
        },
        { status: 409 }
      );
    }
    
    const treatment = new Treatment({
      name: name.trim(),
      category,
      description: description?.trim(),
      defaultPrice: defaultPrice || 0,
    });
    
    await treatment.save();
    
    return NextResponse.json({
      success: true,
      treatment,
      message: "Treatment created successfully",
    });
  } catch (error) {
    console.error("Error creating treatment:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create treatment",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
