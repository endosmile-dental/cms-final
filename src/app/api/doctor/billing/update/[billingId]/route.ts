import { NextRequest, NextResponse } from "next/server";
import BillingModel from "@/app/model/Billing.model";
import dbConnect from "@/app/utils/dbConnect";

export async function PATCH(
  req: NextRequest,
  context: { params: Record<string, string | string[]> } // Corrected type
) {
  // Extract billingId with type assertion
  const billingId = context.params.billingId as string;

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
