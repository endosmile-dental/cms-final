// app/api/doctor/appointments/update/route.ts
import dbConnect from "@/app/utils/dbConnect";
import AppointmentModel from "@/app/model/Appointment.model";
import { requireAuth } from "@/app/utils/authz";
import DoctorModel from "@/app/model/Doctor.model";
import AssistantModel from "@/app/model/Assistant.model";
import { errorResponse, parseJson, successResponse } from "@/app/utils/api";
import { updateAppointmentSchema } from "@/app/schemas/api";
import {
  endOfDayIST,
  formatForInput,
  parseDateFromServer,
  startOfDayIST,
} from "@/app/utils/dateUtils";

export async function PUT(request: Request) {
  try {
    const authResult = await requireAuth(["Doctor", "Assistant", "Admin", "SuperAdmin"]);
    if ("error" in authResult) return authResult.error;
    const { user } = authResult;

    // Establish database connection
    await dbConnect();

    const parsed = await parseJson(request, updateAppointmentSchema);
    if ("error" in parsed) return parsed.error;
    const body = parsed.data;

    const appointmentId = body._id;

    const currentAppointment = await AppointmentModel.findById(appointmentId);
    if (!currentAppointment) {
      return errorResponse(404, "Appointment not found");
    }

    const selectedDoctor = body.doctor
      ? await DoctorModel.findOne({
          $or: [{ _id: body.doctor }, { userId: body.doctor }],
        }).select("_id userId clinicId")
      : await DoctorModel.findById(currentAppointment.doctor).select("_id userId clinicId");

    if (!selectedDoctor) {
      return errorResponse(404, "Doctor not found");
    }

    if (user.role === "Doctor") {
      const doctor = await DoctorModel.findOne({ userId: user.id }).select("_id userId");
      if (!doctor) {
        return errorResponse(404, "Doctor not found");
      }

      if (currentAppointment.doctor.toString() !== doctor._id.toString()) {
        return errorResponse(403, "Forbidden");
      }

      const isDoctorChangingAway =
        selectedDoctor._id.toString() !== doctor._id.toString() &&
        selectedDoctor.userId.toString() !== doctor.userId.toString();

      if (isDoctorChangingAway) {
        return errorResponse(403, "Forbidden");
      }
    } else if (user.role === "Assistant") {
      const assistant = await AssistantModel.findOne({ userId: user.id }).select("clinicId");
      if (!assistant) {
        return errorResponse(404, "Assistant not found");
      }

      const currentDoctor = await DoctorModel.findById(currentAppointment.doctor).select("clinicId");
      if (!currentDoctor) {
        return errorResponse(404, "Doctor not found");
      }

      const isOutsideClinic =
        currentDoctor.clinicId.toString() !== assistant.clinicId.toString() ||
        selectedDoctor.clinicId.toString() !== assistant.clinicId.toString();

      if (isOutsideClinic) {
        return errorResponse(403, "Forbidden");
      }
    }

    // Check for duplicate appointment if timeSlot or appointmentDate is being changed
    const newAppointmentDateObj = parseDateFromServer(body.appointmentDate);
    if (Number.isNaN(newAppointmentDateObj.getTime())) {
      return errorResponse(400, "Invalid date format. Use yyyy-MM-dd");
    }

    const normalizedAppointmentDate = startOfDayIST(newAppointmentDateObj);
    const currentAppointmentDate = formatForInput(
      new Date(currentAppointment.appointmentDate),
    );
    const nextTimeSlot = body.timeSlot ?? currentAppointment.timeSlot;
    const isDoctorChanged =
      selectedDoctor._id.toString() !== currentAppointment.doctor.toString();

    const isDateChanged = body.appointmentDate !== currentAppointmentDate;
    const isTimeSlotChanged = nextTimeSlot !== currentAppointment.timeSlot;

    if (isDateChanged || isTimeSlotChanged || isDoctorChanged) {
      // Check for existing appointment with the same doctor, date, and timeSlot
      const conflictingAppointment = await AppointmentModel.findOne({
        doctor: selectedDoctor._id,
        appointmentDate: {
          $gte: normalizedAppointmentDate,
          $lte: endOfDayIST(normalizedAppointmentDate),
        },
        timeSlot: nextTimeSlot,
        status: { $ne: "Cancelled" },
        _id: { $ne: appointmentId }, // Exclude current appointment
      });

      if (conflictingAppointment) {
        return errorResponse(409, "This time slot is already booked for the selected date");
      }
    }

    // Update the appointment document with the provided body fields; { new: true } returns the updated document.
    const updatedAppointment = await AppointmentModel.findByIdAndUpdate(
      appointmentId,
      {
        $set: {
          doctor: selectedDoctor._id,
          clinic: selectedDoctor.clinicId,
          appointmentDate: normalizedAppointmentDate,
          status: body.status,
          consultationType: body.consultationType,
          timeSlot: nextTimeSlot,
          treatments: body.treatments, // Optional, will overwrite if provided
          teeth: body.teeth, // Optional, will overwrite if provided
          notes: body.notes, // Optional, will overwrite if provided
          paymentStatus: body.paymentStatus, // Optional, will overwrite if provided
          amount: body.amount, // Optional, will overwrite if provided
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedAppointment) {
      return errorResponse(404, "Appointment not found");
    }

    return successResponse({ appointment: updatedAppointment }, 200);
  } catch (error: unknown) {
    console.error("Error updating appointment:", error);
    if (error instanceof Error) {
      return errorResponse(500, error.message);
    }
    return errorResponse(500, "Unknown error occurred");
  }
}
