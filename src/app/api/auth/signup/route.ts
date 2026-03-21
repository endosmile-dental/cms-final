import dbConnect from "../../../utils/dbConnect";
import { setSuperAdminStatus } from "../../../utils/globalStore";
import UserModel from "@/app/model/User.model";
import superAdminModel from "@/app/model/superAdmin.model";
import { errorResponse, parseJson, successResponse } from "@/app/utils/api";
import { superAdminSchema } from "@/app/schemas/api";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const parsed = await parseJson(req, superAdminSchema);
    if ("error" in parsed) return parsed.error;
    const { email, password, role, fullName, contactNumber, address } =
      parsed.data;

    // ✅ Only allow SuperAdmin signup first
    if (role !== "SuperAdmin") {
      return errorResponse(403, "Only SuperAdmin can sign up first.");
    }

    // ✅ Check if SuperAdmin already exists
    const existingSuperAdmin = await UserModel.findOne({ role: "SuperAdmin" });

    if (existingSuperAdmin) {
      return errorResponse(400, "SuperAdmin already exists.");
    }

    // ✅ Create User First
    const user = new UserModel({ email, password, role });
    await user.save();

    // ✅ Create SuperAdmin linked to User
    const superAdmin = new superAdminModel({
      userId: user._id,
      fullName: fullName ?? "Super Admin", // Default if not provided
      contactNumber: contactNumber ?? "0000000000",
      address: address ?? { street: "", city: "", state: "", postalCode: "" },
    });

    await superAdmin.save();

    // ✅ Persist the status in MongoDB
    await setSuperAdminStatus(true);

    return successResponse(
      { message: "SuperAdmin created successfully.", user, superAdmin },
      201
    );
  } catch (error) {
    console.error("Error creating SuperAdmin:", error);
    return errorResponse(500, "Internal server error.");
  }
}
