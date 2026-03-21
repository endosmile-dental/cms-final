import clientAdminModel from "@/app/model/clientAdmin.model";
import ClinicModel from "@/app/model/Clinic.model";
import dbConnect from "@/app/utils/dbConnect";
import { isElevatedRole, requireAuth } from "@/app/utils/authz";
import { errorResponse, parseJson, successResponse } from "@/app/utils/api";
import { addClinicSchema } from "@/app/schemas/api";

export async function POST(request: Request) {
  const authResult = await requireAuth(["clientAdmin", "Admin", "SuperAdmin"]);
  if ("error" in authResult) return authResult.error;
  const { user } = authResult;

  await dbConnect();

  try {
    const parsed = await parseJson(request, addClinicSchema);
    if ("error" in parsed) return parsed.error;
    const {
      name,
      registrationNumber,
      email,
      contactNumber,
      address,
      status,
      userId,
    } = parsed.data;

    if (userId !== user.id && !isElevatedRole(user.role)) {
      return errorResponse(403, "Forbidden");
    }

    // Find the client admin document using the provided userId.
    // Adjust the lookup criteria if necessary.
    const clientAdminDoc = await clientAdminModel.findOne({ userId: userId });

    if (!clientAdminDoc) {
      return errorResponse(404, "Client admin not found");
    }

    // Create the new clinic, setting the clientAdmin field to the found client's _id.
    const newClinic = await ClinicModel.create({
      name,
      registrationNumber,
      email,
      contactNumber,
      address,
      status,
      clientAdminId: clientAdminDoc._id,
      // Other fields like services, businessHours, subscriptionPlan, etc. will use default values
    });

    return successResponse(
      { message: "Clinic created successfully", clinic: newClinic },
      201
    );
  } catch (error: unknown) {
    console.error("Error creating clinic:", error);
    return errorResponse(
      500,
      "Error creating clinic",
      error instanceof Error ? error.message : "Unknown error occurred"
    );
  }
}
