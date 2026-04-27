import dbConnect from "@/app/utils/dbConnect";
import AppointmentModel from "@/app/model/Appointment.model";
import DoctorModel from "@/app/model/Doctor.model";
import AssistantModel from "@/app/model/Assistant.model";
import { requireAuth, resolveUserIdFromHeader } from "@/app/utils/authz";
import { errorResponse, successResponse } from "@/app/utils/api";

export async function GET(request: Request) {
  const startedAt = Date.now();

  try {
    const authResult = await requireAuth(["Doctor", "Assistant", "Admin", "SuperAdmin"]);
    if ("error" in authResult) return authResult.error;
    const { user } = authResult;

    await dbConnect();

    if (user.role === "Assistant") {
      const assistant = await AssistantModel.findOne({ userId: user.id }).select("clinicId");
      if (!assistant) {
        return errorResponse(404, "Assistant not found");
      }

      const clinicDoctors = await DoctorModel.find({
        clinicId: assistant.clinicId,
      })
        .select("_id")
        .lean<{ _id: string }[]>();

      const doctorIds = clinicDoctors.map((doctor) => doctor._id);

      if (doctorIds.length === 0) {
        return successResponse({ appointments: [] }, 200);
      }

      const appointments = await AppointmentModel.find({
        doctor: { $in: doctorIds },
      })
        .populate("patient", "fullName contactNumber PatientId")
        .populate("doctor", "fullName")
        .sort({ appointmentDate: 1, timeSlot: 1 })
        .lean<{ _id: string; patient: { _id?: string; PatientId: string; fullName: string; contactNumber: string }; doctor: { _id?: string; fullName: string }; appointmentDate: Date; timeSlot: string; status: string; reason: string; createdAt: Date; updatedAt: Date }[]>();

      if (process.env.NODE_ENV !== "production") {
        console.log(
          `[perf] GET /api/doctor/appointments/fetchAppointments ${Date.now() - startedAt}ms (count=${appointments.length})`,
        );
      }

      return successResponse({ appointments });
    } else {
      const userIdResult = resolveUserIdFromHeader(
        request,
        user,
        "x-doctor-user-id",
      );
      if ("error" in userIdResult) return userIdResult.error;
      const doctor = await DoctorModel.findOne({ userId: userIdResult.userId })
        .select("_id")
        .lean<{ _id: string } | null>();

      if (!doctor?._id) {
        return errorResponse(404, "Doctor not found");
      }

      // Indexed lookup by doctor (see Appointment model index), lean for smaller overhead.
      const appointments = await AppointmentModel.find({ doctor: doctor._id })
      .populate("patient", "fullName contactNumber PatientId")
      .populate("doctor", "fullName")
      .sort({ appointmentDate: 1, timeSlot: 1 })
      .lean<{ _id: string; patient: { _id?: string; PatientId: string; fullName: string; contactNumber: string }; doctor: { _id?: string; fullName: string }; appointmentDate: Date; timeSlot: string; status: string; reason: string; createdAt: Date; updatedAt: Date }[]>();

      if (process.env.NODE_ENV !== "production") {
        console.log(
          `[perf] GET /api/doctor/appointments/fetchAppointments ${Date.now() - startedAt}ms (count=${appointments.length})`,
        );
      }

      return successResponse({ appointments });
    }
  } catch (error: unknown) {
    console.error("Error fetching appointments:", error);
    if (error instanceof Error) {
      return errorResponse(500, "Error fetching appointments", error.message);
    }
    return errorResponse(500, "Unknown error occurred");
  }
}
