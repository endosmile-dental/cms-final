import AppointmentModel from "@/app/model/Appointment.model";
import DoctorModel from "@/app/model/Doctor.model";
import dbConnect from "@/app/utils/dbConnect";
import { isElevatedRole, requireAuth } from "@/app/utils/authz";
import { errorResponse, parseJson, successResponse } from "@/app/utils/api";
import { addAppointmentSchema } from "@/app/schemas/api";

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

    const appointmentDateObj = new Date(appointmentDate);
    console.log("appointmentDate", appointmentDate);
    console.log("appointmentDateObj", appointmentDateObj);
    console.log("Current date", new Date());
    const now = new Date();
    const nowStartOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const appointmentStartOfDay = new Date(
      appointmentDateObj.getFullYear(),
      appointmentDateObj.getMonth(),
      appointmentDateObj.getDate()
    );

    console.log("nowStartOfDay", nowStartOfDay);
    console.log("appointmentStartOfDay", appointmentStartOfDay);
    

    if (appointmentStartOfDay < nowStartOfDay) {
      return errorResponse(400, "Appointment date must be today or in the future");
    }

    // Fetch doctor info to extract internal ID and clinic ID
    const doctorInfo = await DoctorModel.findOne({ userId: doctor });
    if (!doctorInfo) {
      return errorResponse(404, "Doctor not found");
    }

    const appointment = new AppointmentModel({
      doctor: doctorInfo._id,
      clinic: doctorInfo.clinicId,
      patient,
      appointmentDate,
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
      error instanceof Error ? error.message : "Internal Server Error"
    );
  }
}
