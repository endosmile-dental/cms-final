import dbConnect from "@/app/utils/dbConnect";
import BillingModel from "@/app/model/Billing.model";
import PatientModel from "@/app/model/Patient.model";
import { requireAuth, resolveUserIdFromHeader } from "@/app/utils/authz";
import { errorResponse, successResponse } from "@/app/utils/api";

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(["Patient", "Admin", "SuperAdmin"]);
    if ("error" in authResult) return authResult.error;
    const { user } = authResult;

    await dbConnect();

    // Extract patientUserId from custom headers.
    const userIdResult = resolveUserIdFromHeader(
      request,
      user,
      "x-patient-user-id"
    );
    if ("error" in userIdResult) return userIdResult.error;
    const { userId: patientUserId } = userIdResult;

    // Find the patient using userId
    const patient = await PatientModel.findOne({ userId: patientUserId });

    if (!patient) {
      return errorResponse(404, "Patient not found");
    }

    // Fetch billing records associated with the found patient's _id.
    const billings = await BillingModel.find({ patientId: patient._id });

    return successResponse({ billings });
  } catch (error: unknown) {
    console.error("Error fetching patient billings:", error);
    if (error instanceof Error) {
      return errorResponse(500, "Error fetching patient billings", error.message);
    }
    return errorResponse(500, "Unknown error occurred");
  }
}
