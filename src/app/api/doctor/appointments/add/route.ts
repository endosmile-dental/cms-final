import AppointmentModel from "@/app/model/Appointment.model";
import DoctorModel from "@/app/model/Doctor.model";
import dbConnect from "@/app/utils/dbConnect";
import { isElevatedRole, requireAuth } from "@/app/utils/authz";
import { errorResponse, parseJson, successResponse } from "@/app/utils/api";
import { addAppointmentSchema } from "@/app/schemas/api";
import {
  startOfDayIST,
  endOfDayIST,
  parseDateFromServer,
} from "@/app/utils/dateUtils";

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(["Doctor", "Admin", "SuperAdmin"]);
    if ("error" in authResult) return authResult.error;
    const { user } = authResult;

    await dbConnect();

    const parsed = await parseJson(request, addAppointmentSchema);
    if ("error" in parsed) return parsed.error;
    const {
      doctor,
      patient,
      appointmentDate,
      consultationType,
      createdBy,
      notes,
      timeSlot,
      treatments,
      teeth,
    } = parsed.data;

    if (doctor !== user.id && !isElevatedRole(user.role)) {
      return errorResponse(403, "Forbidden");
    }

    // Parse date as simple yyyy-MM-dd format
    const appointmentDateObj = parseDateFromServer(appointmentDate);
    if (!appointmentDateObj) {
      return errorResponse(400, "Invalid date format. Use yyyy-MM-dd");
    }
    const normalizedAppointmentDate = startOfDayIST(appointmentDateObj);

    const now = new Date();
    const nowStartOfDay = startOfDayIST(now);

    if (normalizedAppointmentDate < nowStartOfDay) {
      return errorResponse(
        400,
        "Appointment date must be today or in the future",
      );
    }

    // Fetch doctor info to extract internal ID and clinic ID
    const doctorInfo = await DoctorModel.findOne({ userId: doctor });
    if (!doctorInfo) {
      return errorResponse(404, "Doctor not found");
    }

    // Check for duplicate appointment (same doctor, date, and timeSlot)
    const appointmentEndOfDay = endOfDayIST(normalizedAppointmentDate);

    const existingAppointment = await AppointmentModel.findOne({
      doctor: doctorInfo._id,
      appointmentDate: {
        $gte: normalizedAppointmentDate,
        $lte: appointmentEndOfDay,
      },
      timeSlot: timeSlot,
      status: { $ne: "Cancelled" },
    });

    if (existingAppointment) {
      return errorResponse(
        409,
        "This time slot is already booked for the selected date",
      );
    }

    const appointment = new AppointmentModel({
      doctor: doctorInfo._id,
      clinic: doctorInfo.clinicId,
      patient,
      appointmentDate: normalizedAppointmentDate,
      consultationType,
      createdBy,
      notes,
      timeSlot,
      treatments, // should be array of strings or ObjectIds
      teeth, // should be array of numbers or strings
      status: "Scheduled",
    });

    console.log("appointment", appointment);

    const savedAppointment = await appointment.save();

    return successResponse({ appointment: savedAppointment }, 201);
  } catch (error: unknown) {
    console.error("Error creating appointment:", error);
    return errorResponse(
      500,
      error instanceof Error ? error.message : "Internal Server Error",
    );
  }
}
