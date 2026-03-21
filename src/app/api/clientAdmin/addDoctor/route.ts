import clientAdminModel from "@/app/model/clientAdmin.model";
import ClinicModel from "@/app/model/Clinic.model";
import DoctorModel from "@/app/model/Doctor.model";
import UserModel from "@/app/model/User.model";
import dbConnect from "@/app/utils/dbConnect";
import { isElevatedRole, requireAuth } from "@/app/utils/authz";
import { errorResponse, parseJson, successResponse } from "@/app/utils/api";
import { addDoctorSchema } from "@/app/schemas/api";

export async function POST(request: Request) {
  const authResult = await requireAuth(["clientAdmin", "Admin", "SuperAdmin"]);
  if ("error" in authResult) return authResult.error;
  const { user } = authResult;

  await dbConnect();

  try {
    const parsed = await parseJson(request, addDoctorSchema);
    if ("error" in parsed) return parsed.error;
    const {
      userId,
      fullName,
      email,
      password,
      specialization,
      specializationDetails,
      contactNumber,
      experienceYears,
      gender,
      address,
      qualifications,
    } = parsed.data;

    console.log(userId);

    if (userId !== user.id && !isElevatedRole(user.role)) {
      return errorResponse(403, "Forbidden");
    }

    // 1. Check if a Client Admin exists using userId.
    const clientAdmin = await clientAdminModel.findOne({ userId: userId });
    if (!clientAdmin) {
      return errorResponse(404, "Client Admin not found.");
    }

    // 2. Check if any Clinic exists that is associated with this Client Admin.
    // (Assuming your Clinic model stores a reference to ClientAdmin in a field named "clientAdmin")
    const clinic = await ClinicModel.findOne({
      clientAdminId: clientAdmin._id,
    });
    if (!clinic) {
      return errorResponse(404, "No clinic found for this Client Admin.");
    }

    // 3. Create a new User document for the doctor.
    // The password will be hashed automatically by the pre-save hook in your User model.
    const newUser = await UserModel.create({
      email,
      password,
      role: "Doctor",
      status: "Active", // or your desired default status
    });

    // 4. Create a new Doctor document that includes:
    //    - The newly created User's ID
    //    - The Clinic's ID from the found clinic
    //    - The rest of the form fields
    const newDoctor = await DoctorModel.create({
      userId: newUser._id,
      clinicId: clinic._id,
      fullName,
      specialization,
      specializationDetails,
      contactNumber,
      experienceYears,
      gender,
      address,
      // Convert comma-separated qualifications string into an array, if provided.
      qualifications: qualifications
        ? qualifications.split(",").map((q: string) => q.trim())
        : [],
    });

    return successResponse(
      {
        message: "Doctor created successfully.",
        user: newUser,
        doctor: newDoctor,
      },
      201
    );
  } catch (error: unknown) {
    console.error("Error creating doctor:", error);
    return errorResponse(
      500,
      "Error creating doctor",
      error instanceof Error ? error.message : "Unknown error occurred"
    );
  }
}
