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

    // Parse the date and normalize to local midnight for consistent querying
    const appointmentDateObj = new Date(appointmentDate);
    // Extract year, month, day in local timezone
    const localYear = appointmentDateObj.getFullYear();
    const localMonth = appointmentDateObj.getMonth();
    const localDay = appointmentDateObj.getDate();
    
    // Create a date at local midnight (00:00:00)
    const normalizedAppointmentDate = new Date(localYear, localMonth, localDay, 0, 0, 0, 0);
    
    console.log("appointmentDate (from client)", appointmentDate);
    console.log("normalizedAppointmentDate (local midnight)", normalizedAppointmentDate);
    console.log("Current date", new Date());
    
    const now = new Date();
    const nowStartOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const appointmentStartOfDay = new Date(
      normalizedAppointmentDate.getFullYear(),
      normalizedAppointmentDate.getMonth(),
      normalizedAppointmentDate.getDate()
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

    // Check for duplicate appointment (same doctor, date, and timeSlot)
    const existingAppointment = await AppointmentModel.findOne({
      doctor: doctorInfo._id,
      appointmentDate: {
        $gte: appointmentStartOfDay,
        $lte: new Date(
          normalizedAppointmentDate.getFullYear(),
          normalizedAppointmentDate.getMonth(),
          normalizedAppointmentDate.getDate(),
          23,
          59,
          59,
          999
        ),
      },
      timeSlot: timeSlot,
      status: { $ne: "Cancelled" },
    });

    if (existingAppointment) {
      return errorResponse(409, "This time slot is already booked for the selected date");
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
      error instanceof Error ? error.message : "Internal Server Error"
    );
  }
}
