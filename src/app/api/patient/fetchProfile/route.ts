import { NextRequest } from "next/server";
import PatientModel from "@/app/model/Patient.model";
import dbConnect from "@/app/utils/dbConnect";
import { requireAuth, resolveUserIdFromHeader } from "@/app/utils/authz";
import { errorResponse, successResponse } from "@/app/utils/api";

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(["Patient", "Admin", "SuperAdmin"]);
    if ("error" in authResult) return authResult.error;
    const { user } = authResult;

    await dbConnect();

    const userIdResult = resolveUserIdFromHeader(
      req,
      user,
      "x-patient-user-id"
    );
    if ("error" in userIdResult) return userIdResult.error;
    const { userId: patientUserId } = userIdResult;

    // Find the patient record using the provided userId.
    // Exclude sensitive fields (e.g., "userId" and any other fields you deem sensitive).
    const patient = await PatientModel.findOne({
      userId: patientUserId,
    }).select("-userId -password -DoctorId -createdAt -permissions -updatedAt"); // Adjust the fields to exclude as needed

    if (!patient) {
      return errorResponse(404, "Patient profile not found");
    }

    // Convert ObjectId and Date fields to string format
    const transformedPatient = {
      ...patient.toObject(),
      _id: patient._id.toString(),
      ClinicId: patient.ClinicId.toString(),
    };

    return successResponse({ patient: transformedPatient }, 200);
  } catch (error: unknown) {
    console.error("Error fetching patient details:", error);
    if (error instanceof Error) {
      return errorResponse(500, error.message);
    }
    return errorResponse(500, "Unknown error occurred");
  }
}
