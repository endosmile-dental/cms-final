// File: /app/api/doctor/billing/update/[billingId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import BillingModel from "@/app/model/Billing.model";
import dbConnect from "@/app/utils/dbConnect";

export async function PATCH(
  req: NextRequest,
  context: { params: { billingId: string } }
) {
  const { billingId } = context.params;

  try {
    await dbConnect();

    const updatedBillingData = await req.json();

    const updatedBilling = await BillingModel.findByIdAndUpdate(
      billingId,
      { $set: updatedBillingData },
      { new: true, runValidators: true }
    );

    if (!updatedBilling) {
      return NextResponse.json(
        { error: "Billing record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ billing: updatedBilling }, { status: 200 });
  } catch (error) {
    console.error("Billing update error:", error);
    return NextResponse.json(
      { error: "Server error while updating billing record" },
      { status: 500 }
    );
  }
}

// Optional: block other methods with 405 response
export async function GET() {
  return NextResponse.json(
    { error: "GET method not allowed" },
    { status: 405 }
  );
}
export async function POST() {
  return NextResponse.json(
    { error: "POST method not allowed" },
    { status: 405 }
  );
}
export async function DELETE() {
  return NextResponse.json(
    { error: "DELETE method not allowed" },
    { status: 405 }
  );
}
