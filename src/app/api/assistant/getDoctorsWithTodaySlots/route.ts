import dbConnect from "@/app/utils/dbConnect";
import DoctorModel from "@/app/model/Doctor.model";
import AssistantModel from "@/app/model/Assistant.model";
import AppointmentModel from "@/app/model/Appointment.model";
import { requireAuth } from "@/app/utils/authz";
import { errorResponse, successResponse } from "@/app/utils/api";
import { startOfDayIST } from "@/app/utils/dateUtils";

export async function GET() {
  const startedAt = Date.now();

  try {
    const authResult = await requireAuth(["Assistant"]);
    if ("error" in authResult) return authResult.error;

    const { user } = authResult;

    await dbConnect();

    // Get the assistant's clinic
    const assistant = await AssistantModel.findOne({ userId: user.id })
      .select("clinicId")
      .lean<{ clinicId: string } | null>();

    if (!assistant?.clinicId) {
      return errorResponse(404, "Assistant not found or no clinic assigned");
    }

    // Fetch all doctors in the clinic
    const doctors = await DoctorModel.find({ clinicId: assistant.clinicId })
      .select(
        "_id fullName specialization contactNumber gender qualifications experienceYears"
      )
      .lean<
        {
          _id: string;
          fullName: string;
          specialization: string;
          contactNumber: string;
          gender?: string;
          qualifications?: string[];
          experienceYears: number;
        }[]
      >();

    // Get today's date range in IST
    const today = startOfDayIST(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch appointments for all doctors today
    const todayAppointments = await AppointmentModel.find({
      doctor: { $in: doctors.map((d) => d._id) },
      appointmentDate: {
        $gte: today,
        $lt: tomorrow,
      },
      status: { $ne: "Cancelled" },
    })
      .select("doctor timeSlot status")
      .lean<
        {
          doctor: string;
          timeSlot: string;
          status: string;
        }[]
      >();

    // Group appointments by doctor with time slots
    const appointmentsByDoctor = new Map<string, { count: number; timeSlots: string[] }>();
    todayAppointments.forEach((apt) => {
      const doctorId = String(apt.doctor);
      const current = appointmentsByDoctor.get(doctorId) || { count: 0, timeSlots: [] };
      current.count += 1;
      if (apt.timeSlot) {
        current.timeSlots.push(apt.timeSlot);
      }
      appointmentsByDoctor.set(doctorId, current);
    });

    // Combine doctor data with their booked slots
    const doctorsWithSlots = doctors.map((doctor) => {
      const appointment = appointmentsByDoctor.get(String(doctor._id));
      return {
        _id: doctor._id,
        fullName: doctor.fullName,
        specialization: doctor.specialization,
        contactNumber: doctor.contactNumber,
        gender: doctor.gender,
        qualifications: doctor.qualifications || [],
        experienceYears: doctor.experienceYears,
        todayBookedSlots: appointment?.count || 0,
        todayTimeSlots: appointment?.timeSlots || [],
      };
    });

    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[perf] GET /api/assistant/getDoctorsWithTodaySlots ${
          Date.now() - startedAt
        }ms (count=${doctorsWithSlots.length})`
      );
    }

    return successResponse({ doctors: doctorsWithSlots }, 200);
  } catch (error: unknown) {
    console.error("Error fetching doctors with today slots:", error);
    return errorResponse(
      500,
      error instanceof Error ? error.message : "Unknown error occurred"
    );
  }
}
