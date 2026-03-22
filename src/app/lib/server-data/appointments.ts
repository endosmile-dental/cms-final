import dbConnect from "@/app/utils/dbConnect";
import AppointmentModel from "@/app/model/Appointment.model";
import DoctorModel from "@/app/model/Doctor.model";
import PatientModel from "@/app/model/Patient.model";
import { formatDateForServer, getLocalDate } from "@/app/utils/dateUtils";

/**
 * Server-side function to fetch appointments for a doctor
 * @param doctorUserId - The user ID of the doctor
 * @returns Promise<Appointment[]>
 */
export async function getDoctorAppointments(doctorUserId: string) {
  try {
    // Input validation
    if (
      !doctorUserId ||
      typeof doctorUserId !== "string" ||
      doctorUserId.trim() === ""
    ) {
      console.error("Invalid doctorUserId provided");
      return [];
    }

    await dbConnect();

    // Find the doctor document using the doctor.userId field
    const doctor = await DoctorModel.findOne({ userId: doctorUserId })
      .select("_id")
      .lean<{ _id: string } | null>();
    if (!doctor || Array.isArray(doctor) || !doctor._id) {
      console.warn(`Doctor not found for userId: ${doctorUserId}`);
      return [];
    }

    // Fetch appointments associated with the doctor's _id.
    // lean() keeps this path fast for SSR serialization.
    const appointments = await AppointmentModel.find({ doctor: doctor._id })
      .populate({
        path: "patient",
        select: "fullName contactNumber PatientId",
      })
      .sort({ appointmentDate: 1, timeSlot: 1 })
      .lean();

    const toStringId = (value: unknown): string | null => {
      if (!value) return null;
      if (typeof value === "string") return value;
      if (typeof value === "object" && "toString" in value) {
        return value.toString();
      }
      return null;
    };

    // Convert IDs to strings to keep client payload stable and serializable
    type AppointmentView = Record<string, unknown> & {
      appointmentDate?: string | Date;
      timeSlot?: string;
    };

    const getAppointmentDate = (appointment: AppointmentView): number =>
      new Date(String(appointment.appointmentDate ?? "")).getTime();

    const getTimeSlotOrder = (appointment: AppointmentView): number =>
      parseTimeSlot(String(appointment.timeSlot ?? ""));

    const plainAppointments = appointments.map((appointment: Record<string, unknown>) => {
      const plainObj: Record<string, unknown> = { ...appointment };

      const appointmentId = toStringId(plainObj._id);
      if (appointmentId) plainObj._id = appointmentId;

      const doctorId = toStringId(plainObj.doctor);
      if (doctorId) plainObj.doctor = doctorId;

      const clinicId = toStringId(plainObj.clinic);
      if (clinicId) plainObj.clinic = clinicId;

      const createdById = toStringId(plainObj.createdBy);
      if (createdById) plainObj.createdBy = createdById;

      const patient = plainObj.patient as
        | { _id?: unknown; fullName?: string; contactNumber?: string; PatientId?: string }
        | undefined;

      if (patient?._id) {
        plainObj.patient = {
          _id: toStringId(patient._id),
          fullName: patient.fullName,
          contactNumber: patient.contactNumber,
          PatientId: patient.PatientId,
        };
      }

      return plainObj;
    });

    // Server-side sorting optimization: Pre-sort appointments by date and time
    const today = getLocalDate();
    today.setHours(0, 0, 0, 0);

    const timeCache = new Map<string, number>();
    const parseTimeSlot = (timeSlot: string): number => {
      const cached = timeCache.get(timeSlot);
      if (cached !== undefined) return cached;

      const [startTime] = timeSlot.split(" - ");
      const [time, modifier] = startTime.split(" ");
      const [hours, minutes] = time.split(":");

      let h = parseInt(hours, 10);
      if (modifier === "PM" && h !== 12) h += 12;
      if (modifier === "AM" && h === 12) h = 0;

      const parsed = new Date(
        `1970-01-01T${String(h).padStart(2, "0")}:${minutes}:00`,
      ).getTime();

      timeCache.set(timeSlot, parsed);
      return parsed;
    };

    // Sort upcoming appointments (future dates) by date ascending, then time ascending
    const upcomingAppointments = plainAppointments
      .filter((appointment: AppointmentView) =>
        getAppointmentDate(appointment) >= today.getTime()
      )
      .sort((a: AppointmentView, b: AppointmentView) => {
        const dateA = getAppointmentDate(a);
        const dateB = getAppointmentDate(b);

        if (dateA !== dateB) return dateA - dateB;
        return getTimeSlotOrder(a) - getTimeSlotOrder(b);
      });

    // Sort past appointments (past dates) by date descending, then time descending
    const pastAppointments = plainAppointments
      .filter((appointment: AppointmentView) =>
        getAppointmentDate(appointment) < today.getTime()
      )
      .sort((a: AppointmentView, b: AppointmentView) => {
        const dateA = getAppointmentDate(a);
        const dateB = getAppointmentDate(b);

        if (dateA !== dateB) return dateB - dateA; // latest first
        return getTimeSlotOrder(b) - getTimeSlotOrder(a);
      });

    // Return appointments with pre-sorted data structure
    return {
      allAppointments: plainAppointments,
      upcomingAppointments,
      pastAppointments,
      today,
      totalAppointments: plainAppointments.length,
      upcomingCount: upcomingAppointments.length,
      pastCount: pastAppointments.length,
    };
  } catch (error: unknown) {
    console.error("Error fetching doctor appointments:", error);
    // Don't expose internal error details to client
    return {
      allAppointments: [],
      upcomingAppointments: [],
      pastAppointments: [],
      today: new Date(),
      totalAppointments: 0,
      upcomingCount: 0,
      pastCount: 0,
    };
  }
}

/**
 * Server-side function to fetch appointments for a patient
 * @param patientUserId - The user ID of the patient
 * @returns Promise<Appointment[]>
 */
export async function getPatientAppointments(patientUserId: string) {
  try {
    await dbConnect();

    // Find the patient document using the patient.userId field
    const patient = await PatientModel.findOne({ userId: patientUserId })
      .lean<{ _id: string } | null>();
    if (!patient || Array.isArray(patient) || !patient._id) {
      throw new Error("Patient not found");
    }

    // Fetch appointments associated with the patient's _id
    const appointments = await AppointmentModel.find({ patient: patient._id })
      .populate("doctor", "fullName")
      .sort({ appointmentDate: -1, timeSlot: 1 });

    return appointments;
  } catch (error: unknown) {
    console.error("Error fetching patient appointments:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch appointments: ${error.message}`);
    }
    throw new Error("Unknown error occurred while fetching appointments");
  }
}

/**
 * Server-side function to get appointment availability for a specific date
 * @param doctorId - The ID of the doctor
 * @param date - The date to check availability for
 * @returns Promise<string[]> - Array of booked time slots
 */
export async function getAppointmentAvailability(
  doctorId: string,
  date: string,
) {
  try {
    await dbConnect();

    // Validate date format
    const appointmentDate = new Date(date);
    if (isNaN(appointmentDate.getTime())) {
      throw new Error("Invalid date format");
    }

    // Find the doctor to ensure they exist
    const doctor = await DoctorModel.findById(doctorId)
      .lean<{ _id: string } | null>();
    if (!doctor || Array.isArray(doctor) || !doctor._id) {
      throw new Error("Doctor not found");
    }

    // Find all appointments for the given date
    const appointments = await AppointmentModel.find({
      doctor: doctorId,
      appointmentDate: formatDateForServer(appointmentDate),
    });

    // Extract booked time slots
    const bookedSlots = appointments
      .map((appt) => appt.timeSlot)
      .filter(Boolean);

    return bookedSlots;
  } catch (error: unknown) {
    console.error("Error checking appointment availability:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to check availability: ${error.message}`);
    }
    throw new Error("Unknown error occurred while checking availability");
  }
}
