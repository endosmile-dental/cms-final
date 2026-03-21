import dbConnect from "@/app/utils/dbConnect";
import AppointmentModel from "@/app/model/Appointment.model";
import PatientModel from "@/app/model/Patient.model";
import { requireAuth, resolveUserIdFromHeader } from "@/app/utils/authz";
import { errorResponse, successResponse } from "@/app/utils/api";

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(["Patient", "Admin", "SuperAdmin"]);
    if ("error" in authResult) return authResult.error;
    const { user } = authResult;

    await dbConnect();

    // Retrieve the patientUserId from the custom header.
    const userIdResult = resolveUserIdFromHeader(
      request,
      user,
      "x-patient-user-id"
    );
    if ("error" in userIdResult) return userIdResult.error;
    const { userId: patientUserId } = userIdResult;

    // Find the patient document using the patient.userId field.
    const patient = await PatientModel.findOne({ userId: patientUserId });
    if (!patient) {
      return errorResponse(404, "Patient not found");
    }

    // Fetch appointments associated with the patient's _id.
    const appointments = await AppointmentModel.find({ patient: patient._id });

    return successResponse({ appointments });
  } catch (error: unknown) {
    console.error("Error fetching appointments:", error);
    if (error instanceof Error) {
      return errorResponse(500, "Error fetching appointments", error.message);
    }
    return errorResponse(500, "Unknown error occurred");
  }
}
