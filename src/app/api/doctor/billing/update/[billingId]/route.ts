// src/app/api/doctor/billing/update/[billingId]/route.ts
import { NextRequest } from "next/server";
import BillingModel from "@/app/model/Billing.model";
import dbConnect from "@/app/utils/dbConnect";
import { requireAuth } from "@/app/utils/authz";
import DoctorModel from "@/app/model/Doctor.model";
import { errorResponse, parseJson, successResponse } from "@/app/utils/api";
import { updateBillingSchema } from "@/app/schemas/api";

export async function PATCH(req: NextRequest) {
  try {
    const authResult = await requireAuth(["Doctor", "Admin", "SuperAdmin"]);
    if ("error" in authResult) return authResult.error;
    const { user } = authResult;

    await dbConnect();

    // Extract billingId from URL path
    const path = req.nextUrl.pathname;
    const billingId = path.split("/").pop()!;

    const parsed = await parseJson(req, updateBillingSchema);
    if ("error" in parsed) return parsed.error;
    const updatedBillingData = parsed.data;

    if (user.role === "Doctor") {
      const billing = await BillingModel.findById(billingId).select("doctorId");
      if (!billing) {
        return errorResponse(404, "Billing record not found");
      }

      const doctor = await DoctorModel.findOne({ userId: user.id }).select("_id");
      const doctorIdMatch =
        billing.doctorId.toString() === user.id ||
        (doctor && billing.doctorId.toString() === doctor._id.toString());

      if (!doctorIdMatch) {
        return errorResponse(403, "Forbidden");
      }
    }

    const updatedBilling = await BillingModel.findByIdAndUpdate(
      billingId,
      { $set: updatedBillingData },
      { new: true, runValidators: true }
    );

    if (!updatedBilling) {
      return errorResponse(404, "Billing record not found");
    }

    return successResponse({ billing: updatedBilling }, 200);
  } catch (error) {
    console.error("Billing update error:", error);
    return errorResponse(500, "Server error while updating billing record");
  }
}
