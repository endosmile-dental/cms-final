// app/api/doctor/appointments/update/route.ts
import dbConnect from "@/app/utils/dbConnect";
import AppointmentModel from "@/app/model/Appointment.model";
import { requireAuth } from "@/app/utils/authz";
import DoctorModel from "@/app/model/Doctor.model";
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
    const authResult = await requireAuth(["Doctor", "Admin", "SuperAdmin"]);
    if ("error" in authResult) return authResult.error;
    const { user } = authResult;

    // Establish database connection
    await dbConnect();

    const parsed = await parseJson(request, updateAppointmentSchema);
    if ("error" in parsed) return parsed.error;
    const body = parsed.data;

    const appointmentId = body._id;

    if (user.role === "Doctor") {
      const doctor = await DoctorModel.findOne({ userId: user.id }).select("_id");
      if (!doctor) {
        return errorResponse(404, "Doctor not found");
      }

      const existingAppointment = await AppointmentModel.findById(appointmentId).select("doctor");
      if (!existingAppointment) {
        return errorResponse(404, "Appointment not found");
      }

      if (existingAppointment.doctor.toString() !== doctor._id.toString()) {
        return errorResponse(403, "Forbidden");
      }
    }

    // Check for duplicate appointment if timeSlot or appointmentDate is being changed
    const currentAppointment = await AppointmentModel.findById(appointmentId);
    if (!currentAppointment) {
      return errorResponse(404, "Appointment not found");
    }

    const newAppointmentDateObj = parseDateFromServer(body.appointmentDate);
    if (!newAppointmentDateObj) {
      return errorResponse(400, "Invalid date format. Use yyyy-MM-dd");
    }

    const normalizedAppointmentDate = startOfDayIST(newAppointmentDateObj);
    const currentAppointmentDate = formatForInput(
      new Date(currentAppointment.appointmentDate),
    );

    const isDateChanged = body.appointmentDate !== currentAppointmentDate;
    const isTimeSlotChanged = body.timeSlot !== currentAppointment.timeSlot;

    if (isDateChanged || isTimeSlotChanged) {
      // Get doctor ID for the duplicate check
      const doctorForCheck = await DoctorModel.findById(currentAppointment.doctor).select("_id");
      if (!doctorForCheck) {
        return errorResponse(404, "Doctor not found");
      }

      // Check for existing appointment with the same doctor, date, and timeSlot
      const conflictingAppointment = await AppointmentModel.findOne({
        doctor: doctorForCheck._id,
        appointmentDate: {
          $gte: normalizedAppointmentDate,
          $lte: endOfDayIST(normalizedAppointmentDate),
        },
        timeSlot: body.timeSlot,
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
          appointmentDate: normalizedAppointmentDate,
          status: body.status,
          consultationType: body.consultationType,
          timeSlot: body.timeSlot,
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
