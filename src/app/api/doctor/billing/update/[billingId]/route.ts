import { NextRequest, NextResponse } from "next/server";
import BillingModel from "@/app/model/Billing.model";
import dbConnect from "@/app/utils/dbConnect";

// Define the expected parameter structure
interface RouteParams {
  billingId: string;
}

// Define the context type with index signature
interface RouteContext {
  params: RouteParams & { [key: string]: string | string[] };
}

export async function PATCH(
  req: NextRequest,
  context: RouteContext // Use the context type with index signature
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
