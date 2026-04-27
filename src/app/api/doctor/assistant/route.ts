import dbConnect from "@/app/utils/dbConnect";
import AssistantModel from "@/app/model/Assistant.model";
import DoctorModel from "@/app/model/Doctor.model";
import UserModel from "@/app/model/User.model";
import { requireAuth } from "@/app/utils/authz";
import { errorResponse, successResponse } from "@/app/utils/api";

/**
 * GET - Fetch all assistants for a doctor
 */
export async function GET() {
  const startedAt = Date.now();

  try {
    const authResult = await requireAuth(["Doctor", "Admin", "SuperAdmin"]);
    if ("error" in authResult) return authResult.error;
    const { user } = authResult;

    await dbConnect();

    // Get doctor's id from user id
    const doctor = await DoctorModel.findOne({ userId: user.id }).select("_id clinicId");

    if (!doctor?._id) {
      return errorResponse(400, "Doctor profile not found");
    }

    const assistants = await AssistantModel.find({
      doctorId: doctor._id,
      clinicId: doctor.clinicId,
    })
      .select(
        "_id userId fullName email contactNumber specialization bio profileImageUrl address qualifications experienceYears gender status joinDate createdAt updatedAt"
      )
      .lean();

    const transformedAssistants = assistants.map((assistant) => ({
      ...assistant,
      _id: assistant._id?.toString(),
      userId: assistant.userId?.toString(),
      doctorId: assistant.doctorId?.toString(),
      clinicId: assistant.clinicId?.toString(),
      createdAt: assistant.createdAt?.toISOString(),
      updatedAt: assistant.updatedAt?.toISOString(),
      joinDate: assistant.joinDate?.toISOString(),
    }));

    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[perf] GET /api/doctor/assistant ${Date.now() - startedAt}ms`
      );
    }

    return successResponse({ assistants: transformedAssistants }, 200);
  } catch (error: unknown) {
    console.error("Error fetching assistants:", error);
    if (error instanceof Error) {
      return errorResponse(500, error.message);
    }
    return errorResponse(500, "Unknown error occurred");
  }
}

/**
 * POST - Create a new assistant
 */
export async function POST(request: Request) {
  const startedAt = Date.now();

  try {
    const authResult = await requireAuth(["Doctor", "Admin", "SuperAdmin"]);
    if ("error" in authResult) return authResult.error;
    const { user } = authResult;

    const body = await request.json();

    await dbConnect();

    // Validate password is provided for new assistant
    if (!body.password || body.password.length < 6) {
      return errorResponse(400, "Password must be at least 6 characters");
    }

    // Get doctor's id from user id
    const doctor = await DoctorModel.findOne({ userId: user.id }).select("_id clinicId");

    if (!doctor?._id) {
      return errorResponse(400, "Doctor profile not found");
    }

    // Check if email already exists in users
    const existingUser = await UserModel.findOne({
      email: body.email.toLowerCase(),
    });

    if (existingUser) {
      return errorResponse(409, "Email already exists");
    }

    // Check if email already exists in assistants
    const existingAssistant = await AssistantModel.findOne({
      email: body.email.toLowerCase(),
    });

    if (existingAssistant) {
      return errorResponse(409, "Email already exists");
    }

    // Check if contact number already exists
    const existingContact = await AssistantModel.findOne({
      contactNumber: body.contactNumber,
    });

    if (existingContact) {
      return errorResponse(409, "Contact number already exists");
    }

    // Create User account for the assistant
    const newUser = new UserModel({
      email: body.email.toLowerCase(),
      password: body.password,
      role: "Assistant",
      status: "Active",
    });

    const savedUser = await newUser.save();

    // Create Assistant record
    const newAssistant = new AssistantModel({
      userId: savedUser._id,
      doctorId: doctor._id,
      clinicId: doctor.clinicId,
      fullName: body.fullName,
      email: body.email.toLowerCase(),
      contactNumber: body.contactNumber,
      specialization: body.specialization,
      bio: body.bio || "",
      profileImageUrl: body.profileImageUrl || "",
      address: body.address || {},
      qualifications: body.qualifications || [],
      experienceYears: body.experienceYears || 0,
      gender: body.gender,
      status: "Active",
      joinDate: new Date(),
    });

    const savedAssistant = await newAssistant.save();

    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[perf] POST /api/doctor/assistant ${Date.now() - startedAt}ms`
      );
    }

    return successResponse(
      {
        assistant: {
          ...savedAssistant.toObject(),
          _id: savedAssistant._id.toString(),
          userId: savedAssistant.userId.toString(),
          doctorId: savedAssistant.doctorId.toString(),
          clinicId: savedAssistant.clinicId.toString(),
        },
      },
      201
    );
  } catch (error: unknown) {
    console.error("Error creating assistant:", error);
    if (error instanceof Error) {
      return errorResponse(500, error.message);
    }
    return errorResponse(500, "Unknown error occurred");
  }
}

/**
 * PUT - Update an assistant
 */
export async function PUT(request: Request) {
  const startedAt = Date.now();

  try {
    const authResult = await requireAuth(["Doctor", "Admin", "SuperAdmin"]);
    if ("error" in authResult) return authResult.error;
    const { user } = authResult;

    const body = await request.json();
    const { assistantId, ...updateData } = body;

    if (!assistantId) {
      return errorResponse(400, "Assistant ID is required");
    }

    await dbConnect();

    // Get doctor's id from user id
    const doctor = await DoctorModel.findOne({ userId: user.id }).select("_id clinicId");

    if (!doctor?._id) {
      return errorResponse(400, "Doctor profile not found");
    }

    const assistant = await AssistantModel.findOne({
      _id: assistantId,
      doctorId: doctor._id,
      clinicId: doctor.clinicId,
    });

    if (!assistant) {
      return errorResponse(404, "Assistant not found");
    }

    // Extract password from updateData if provided
    const password = updateData.password;
    delete updateData.password;

    // Check if new email already exists (if email is being updated)
    if (updateData.email && updateData.email !== assistant.email) {
      const existingEmail = await AssistantModel.findOne({
        email: updateData.email.toLowerCase(),
        _id: { $ne: assistantId },
      });

      if (existingEmail) {
        return errorResponse(409, "Email already exists");
      }
    }

    // Check if new contact number already exists (if contact is being updated)
    if (
      updateData.contactNumber &&
      updateData.contactNumber !== assistant.contactNumber
    ) {
      const existingContact = await AssistantModel.findOne({
        contactNumber: updateData.contactNumber,
        _id: { $ne: assistantId },
      });

      if (existingContact) {
        return errorResponse(409, "Contact number already exists");
      }
    }

    // Update password if provided
    if (password && password.length >= 6) {
      const userUpdate: { password: string; email?: string } = {
        password,
      };

      if (updateData.email) {
        userUpdate.email = updateData.email.toLowerCase();
      }

      await UserModel.findByIdAndUpdate(assistant.userId, userUpdate);
    }

    const updatedAssistant = await AssistantModel.findByIdAndUpdate(
      assistantId,
      {
        ...updateData,
        email: updateData.email?.toLowerCase() || assistant.email,
      },
      { new: true }
    );

    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[perf] PUT /api/doctor/assistant ${Date.now() - startedAt}ms`
      );
    }

    return successResponse(
      {
        assistant: {
          ...updatedAssistant?.toObject(),
          userId: updatedAssistant?.userId.toString(),
          _id: updatedAssistant?._id.toString(),
          doctorId: updatedAssistant?.doctorId.toString(),
          clinicId: updatedAssistant?.clinicId.toString(),
        },
      },
      200
    );
  } catch (error: unknown) {
    console.error("Error updating assistant:", error);
    if (error instanceof Error) {
      return errorResponse(500, error.message);
    }
    return errorResponse(500, "Unknown error occurred");
  }
}

/**
 * DELETE - Delete an assistant
 */
export async function DELETE(request: Request) {
  const startedAt = Date.now();

  try {
    const authResult = await requireAuth(["Doctor", "Admin", "SuperAdmin"]);
    if ("error" in authResult) return authResult.error;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const assistantId = searchParams.get("id");

    if (!assistantId) {
      return errorResponse(400, "Assistant ID is required");
    }

    await dbConnect();

    // Get doctor's id from user id
    const doctor = await DoctorModel.findOne({ userId: user.id }).select("_id clinicId");

    if (!doctor?._id) {
      return errorResponse(400, "Doctor profile not found");
    }

    const assistant = await AssistantModel.findOne({
      _id: assistantId,
      doctorId: doctor._id,
      clinicId: doctor.clinicId,
    });

    if (!assistant) {
      return errorResponse(404, "Assistant not found");
    }

    // Delete User record associated with this assistant
    await UserModel.findByIdAndDelete(assistant.userId);

    // Delete Assistant record
    await AssistantModel.findByIdAndDelete(assistantId);

    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[perf] DELETE /api/doctor/assistant ${Date.now() - startedAt}ms`
      );
    }

    return successResponse({ message: "Assistant deleted successfully" }, 200);
  } catch (error: unknown) {
    console.error("Error deleting assistant:", error);
    if (error instanceof Error) {
      return errorResponse(500, error.message);
    }
    return errorResponse(500, "Unknown error occurred");
  }
}
