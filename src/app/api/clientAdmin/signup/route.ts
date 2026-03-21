import dbConnect from "@/app/utils/dbConnect";
import UserModel from "@/app/model/User.model";
import clientAdminModel from "@/app/model/clientAdmin.model";
import { requireAuth } from "@/app/utils/authz";
import { errorResponse, parseJson, successResponse } from "@/app/utils/api";
import { clientAdminSignupSchema } from "@/app/schemas/api";

export async function POST(request: Request) {
  const authResult = await requireAuth(["SuperAdmin", "Admin"]);
  if ("error" in authResult) return authResult.error;

  await dbConnect(); // Ensure the DB connection is established

  try {
    const parsed = await parseJson(request, clientAdminSignupSchema);
    if ("error" in parsed) return parsed.error;
    const { fullName, email, password, contactNumber, address } = parsed.data;

    // 1. Check if a user with the given email already exists.
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return errorResponse(400, "User with this email already exists.");
    }

    // 2. Create the user in the User model with role "clientAdmin"
    // The password will be hashed automatically by the pre-save middleware on your User model.
    const newUser = await UserModel.create({
      email,
      password,
      role: "clientAdmin",
      status: "Active", // You can set default status as needed
    });

    // 3. Create the client admin in the clientAdmin model with the provided details.
    const newClientAdmin = await clientAdminModel.create({
      userId: newUser._id,
      fullName,
      contactNumber,
      address, // address is expected to be an object containing street, city, state, postalCode
    });

    // 4. Return a success response
    return successResponse(
      {
        message: "Client Admin created successfully",
        user: newUser,
        clientAdmin: newClientAdmin,
      },
      201
    );
  } catch (error: unknown) {
    console.error("Error during client admin signup:", error);
    return errorResponse(
      500,
      "Error during client admin signup",
      error instanceof Error ? error.message : "Unknown error occurred"
    );
  }
}
