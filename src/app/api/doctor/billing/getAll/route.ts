import dbConnect from "@/app/utils/dbConnect";
import BillingModel from "@/app/model/Billing.model";
import { requireAuth, resolveUserIdFromHeader } from "@/app/utils/authz";
import { errorResponse, successResponse } from "@/app/utils/api";

export async function GET(request: Request) {
  const startedAt = Date.now();

  try {
    const authResult = await requireAuth(["Doctor", "Admin", "SuperAdmin"]);
    if ("error" in authResult) return authResult.error;
    const { user } = authResult;

    await dbConnect();

    const userIdResult = resolveUserIdFromHeader(
      request,
      user,
      "x-doctor-user-id",
    );
    if ("error" in userIdResult) return userIdResult.error;
    const { userId: doctorUserId } = userIdResult;

    // doctorId index + date sort for stable payload ordering.
    const billings = await BillingModel.find({ doctorId: doctorUserId })
      .sort({ date: -1 })
      .lean<{ _id: string; patientId: string; doctorId: string; clinicId: string; treatments: Array<{ name: string; quantity: number; price: number; }>; totalAmount: number; status: string; date: Date; createdAt: Date; updatedAt: Date }[]>();

    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[perf] GET /api/doctor/billing/getAll ${Date.now() - startedAt}ms (count=${billings.length})`,
      );
    }

    return successResponse({ billings });
  } catch (error: unknown) {
    console.error("Error fetching billings:", error);
    if (error instanceof Error) {
      return errorResponse(500, "Error fetching billings", error.message);
    }
    return errorResponse(500, "Unknown error occurred");
  }
}
