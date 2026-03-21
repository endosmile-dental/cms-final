import PatientModel from "@/app/model/Patient.model";
import UserModel from "@/app/model/User.model";
import dbConnect from "@/app/utils/dbConnect";
import { NextRequest } from "next/server";
import { isElevatedRole, requireAuth } from "@/app/utils/authz";
import { errorResponse, parseJson, successResponse } from "@/app/utils/api";
import { updatePasswordSchema } from "@/app/schemas/api";

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(["Patient", "Admin", "SuperAdmin"]);
  if ("error" in authResult) return authResult.error;
  const { user: sessionUser } = authResult;

  // Connect to database
  await dbConnect();
  try {
    const parsed = await parseJson(req, updatePasswordSchema);
    if ("error" in parsed) return parsed.error;
    const { patientId, newPassword } = parsed.data;

    // Find the patient by ID
    const patient = await PatientModel.findById(patientId);
    if (!patient) {
      return errorResponse(404, "Patient not found.", null, { success: false });
    }

    // Ensure the patient has a linked user
    if (!patient.userId) {
      return errorResponse(404, "No linked user found for this patient.", null, {
        success: false,
      });
    }

    if (!isElevatedRole(sessionUser.role)) {
      if (patient.userId.toString() !== sessionUser.id) {
        return errorResponse(403, "Forbidden.", null, { success: false });
      }
    }

    // Find the user associated with this patient
    const userDoc = await UserModel.findById(patient.userId);
    if (!userDoc) {
      return errorResponse(404, "User not found for this patient.", null, {
        success: false,
      });
    }

    // Update the user's password (password hashing is handled by middleware)
    userDoc.password = newPassword;
    await userDoc.save(); // `pre("save")` middleware will hash it automatically

    return successResponse({ message: "Password updated successfully." }, 200);
  } catch (error) {
    console.error("Error updating password:", error);
    return errorResponse(500, "Internal Server Error.", null, {
      success: false,
    });
  }
}
