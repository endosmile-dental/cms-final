// src/app/api/doctor/billing/delete/[billingId]/route.ts
import { NextRequest } from "next/server";
import BillingModel from "@/app/model/Billing.model";
import dbConnect from "@/app/utils/dbConnect";
import { requireAuth } from "@/app/utils/authz";
import DoctorModel from "@/app/model/Doctor.model";
import { errorResponse, successResponse } from "@/app/utils/api";

export async function DELETE(req: NextRequest) {
  try {
    const authResult = await requireAuth(["Doctor", "Admin", "SuperAdmin"]);
    if ("error" in authResult) return authResult.error;
    const { user } = authResult;

    await dbConnect();

    // Extract billingId from URL path
    const path = req.nextUrl.pathname;
    const billingId = path.split("/").pop()!;

    // Find the billing record to verify it exists
    const billing = await BillingModel.findById(billingId);
    if (!billing) {
      return errorResponse(404, "Billing record not found");
    }

    // Check permissions for Doctor role
    if (user.role === "Doctor") {
      const doctor = await DoctorModel.findOne({ userId: user.id }).select("_id");
      const doctorIdMatch =
        billing.doctorId.toString() === user.id ||
        (doctor && billing.doctorId.toString() === doctor._id.toString());

      if (!doctorIdMatch) {
        return errorResponse(403, "Forbidden");
      }
    }

    // Delete the billing record
    await BillingModel.findByIdAndDelete(billingId);

    return successResponse({ message: "Billing record deleted successfully" }, 200);
  } catch (error) {
    console.error("Billing delete error:", error);
    return errorResponse(500, "Server error while deleting billing record");
  }
}