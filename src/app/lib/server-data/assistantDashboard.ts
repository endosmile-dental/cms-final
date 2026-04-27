import dbConnect from "@/app/utils/dbConnect";
import AssistantModel from "@/app/model/Assistant.model";
import AppointmentModel from "@/app/model/Appointment.model";
import PatientModel from "@/app/model/Patient.model";
import DoctorModel from "@/app/model/Doctor.model";
import { format } from "date-fns";
import { getLocalDate, formatForInput, startOfDayIST } from "@/app/utils/dateUtils";
import { AssistantDashboardDTO } from "@/app/types/dashboard/assistant/assistantDashboard";

const ASSISTANT_DASHBOARD_CACHE_TTL_MS = 30 * 1000; // 30 seconds
const assistantDashboardCache = new Map<
  string,
  { createdAt: number; data: AssistantDashboardDTO }
>();

type AppointmentStatusCount = {
  _id: string;
  count: number;
};

type AppointmentTrendPoint = {
  date: string;
  scheduled: number;
  completed: number;
  cancelled: number;
};

type DoctorAppointmentCount = {
  _id: string;
  doctorName: string;
  appointmentCount: number;
};

type AppointmentTrendAggregate = {
  _id: {
    date: string;
    status: "Scheduled" | "Completed" | "Cancelled";
  };
  count: number;
};

type DashboardAppointmentStatus =
  AssistantDashboardDTO["todayAppointments"][number]["status"];

type PopulatedPatientSummary = {
  fullName?: string;
  contactNumber?: string;
};

type PopulatedDoctorSummary = {
  fullName?: string;
};

type DashboardAppointmentRecord = {
  _id?: { toString(): string };
  patient?: PopulatedPatientSummary | null;
  doctor?: PopulatedDoctorSummary | null;
  appointmentDate: Date;
  status: DashboardAppointmentStatus;
};

const getPatientSummary = (
  patient: DashboardAppointmentRecord["patient"],
): PopulatedPatientSummary => patient ?? {};

const getDoctorSummary = (
  doctor: DashboardAppointmentRecord["doctor"],
): PopulatedDoctorSummary => doctor ?? {};

/* =========================================================
   SERVICE FUNCTION
========================================================= */

export async function getAssistantDashboardData(
  AssistantUserId: string,
): Promise<AssistantDashboardDTO> {
  const now = Date.now();
  const cached = assistantDashboardCache.get(AssistantUserId);
  if (cached && now - cached.createdAt < ASSISTANT_DASHBOARD_CACHE_TTL_MS) {
    return cached.data;
  }

  await dbConnect();

  const Assistant = await AssistantModel.findOne({
    userId: AssistantUserId,
  }).select("_id fullName clinicId");

  if (!Assistant || !Assistant._id) {
    throw new Error("Assistant not found");
  }

  /* ===================== STATS ===================== */

  const todayStart = getLocalDate();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date(todayStart);
  todayEnd.setHours(23, 59, 59, 999);

  const [
    totalAppointmentsToday,
    upcomingAppointments,
    totalPatients,
    availableDoctors,
  ] = await Promise.all([
    AppointmentModel.countDocuments({
      appointmentDate: { $gte: todayStart, $lte: todayEnd },
    }),

    AppointmentModel.countDocuments({
      appointmentDate: { $gt: new Date() },
      status: { $nin: ["Completed", "Cancelled"] },
    }),

    PatientModel.countDocuments({}),

    DoctorModel.countDocuments({ clinicId: Assistant.clinicId }),
  ]);

  /* ===================== APPOINTMENTS BY STATUS ===================== */

  const appointmentsByStatusRaw =
    await AppointmentModel.aggregate<AppointmentStatusCount>([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

  const appointmentsByStatus = appointmentsByStatusRaw.map((item) => ({
    name: item._id,
    value: item.count,
  }));

  /* ===================== APPOINTMENTS TREND (Last 7 Days) ===================== */

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const appointmentsTrendRaw = await AppointmentModel.aggregate<AppointmentTrendAggregate>([
    {
      $match: {
        appointmentDate: { $gte: sevenDaysAgo },
      },
    },
    {
      $group: {
        _id: {
          date: {
            $dateToString: { format: "%Y-%m-%d", date: "$appointmentDate" },
          },
          status: "$status",
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.date": 1 } },
  ]);

  // Build trend map
  const trendMap: Record<string, AppointmentTrendPoint> = {};
  for (let i = 0; i < 7; i++) {
    const date = new Date(sevenDaysAgo);
    date.setDate(date.getDate() + i);
    const dateStr = format(date, "yyyy-MM-dd");
    trendMap[dateStr] = {
      date: dateStr,
      scheduled: 0,
      completed: 0,
      cancelled: 0,
    };
  }

  appointmentsTrendRaw.forEach((item) => {
    const dateStr = item._id.date;
    if (trendMap[dateStr]) {
      if (item._id.status === "Scheduled") {
        trendMap[dateStr].scheduled = item.count;
      } else if (item._id.status === "Completed") {
        trendMap[dateStr].completed = item.count;
      } else if (item._id.status === "Cancelled") {
        trendMap[dateStr].cancelled = item.count;
      }
    }
  });

  const appointmentsTrend = Object.values(trendMap);

  /* ===================== DOCTORS' APPOINTMENTS COUNT ===================== */

  const doctorsAppointmentsRaw = await AppointmentModel.aggregate<DoctorAppointmentCount>([
    {
      $lookup: {
        from: "doctors",
        localField: "doctor",
        foreignField: "_id",
        as: "doctorData",
      },
    },
    {
      $unwind: {
        path: "$doctorData",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: "$doctor",
        doctorName: { $first: "$doctorData.fullName" },
        appointmentCount: { $sum: 1 },
      },
    },
    {
      $sort: { appointmentCount: -1 },
    },
    {
      $limit: 10,
    },
  ]);

  const doctorsAppointments = doctorsAppointmentsRaw.map((item) => ({
    doctorName: item.doctorName || "Unknown",
    appointmentCount: item.appointmentCount,
  }));

  /* ===================== TODAY'S APPOINTMENTS ===================== */

  const todayAppointmentsData = await AppointmentModel.find({
    appointmentDate: { $gte: todayStart, $lte: todayEnd },
  })
    .populate("patient", "fullName contactNumber")
    .populate("doctor", "fullName")
    .sort({ appointmentDate: 1 })
    .limit(10)
    .lean();

  const todayAppointments = (
    todayAppointmentsData
  ).map((apt) => {
    const patient = getPatientSummary(apt.patient);
    const doctor = getDoctorSummary(apt.doctor);

    return {
      _id: apt._id?.toString() || "",
      patientName: patient.fullName || "Unknown Patient",
      doctorName: doctor.fullName || "Unknown Doctor",
      timeSlot: apt.timeSlot || "N/A",
      status: apt.status,
      contactNumber: patient.contactNumber,
    };
  });

  /* ===================== WEEK'S APPOINTMENTS (Monday to Sunday) ===================== */

  // Calculate current week (Monday to Sunday)
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay; // Calculate days to subtract to get Monday
  
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() + daysToMonday);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6); // Add 6 days to get Sunday
  weekEnd.setHours(23, 59, 59, 999);

  const weekAppointmentsData = await AppointmentModel.find({
    appointmentDate: { $gte: weekStart, $lte: weekEnd },
  })
    .populate("patient", "fullName contactNumber")
    .populate("doctor", "fullName")
    .sort({ appointmentDate: 1, timeSlot: 1 })
    .lean();

  const weekAppointments = (
    weekAppointmentsData
  ).map((apt) => {
    const patient = getPatientSummary(apt.patient);
    const doctor = getDoctorSummary(apt.doctor);

    return {
      _id: apt._id?.toString() || "",
      patientName: patient.fullName || "Unknown Patient",
      doctorName: doctor.fullName || "Unknown Doctor",
      appointmentDate: format(apt.appointmentDate, "yyyy-MM-dd"),
      timeSlot: apt.timeSlot || "N/A",
      status: apt.status,
      contactNumber: patient.contactNumber,
    };
  });

  /* ===================== UPCOMING APPOINTMENTS (Next 10) ===================== */

  const upcomingAppointmentsData = await AppointmentModel.find({
    appointmentDate: { $gt: todayEnd },
    status: { $nin: ["Completed", "Cancelled"] },
  })
    .populate("patient", "fullName contactNumber")
    .populate("doctor", "fullName")
    .sort({ appointmentDate: 1 })
    .limit(10)
    .lean();

  const upcomingAppointmentsList = (
    upcomingAppointmentsData
  ).map((apt) => {
    const patient = getPatientSummary(apt.patient);
    const doctor = getDoctorSummary(apt.doctor);

    return {
      _id: apt._id?.toString() || "",
      patientName: patient.fullName || "Unknown Patient",
      doctorName: doctor.fullName || "Unknown Doctor",
      appointmentDate: format(apt.appointmentDate, "yyyy-MM-dd"),
      timeSlot: apt.timeSlot || "N/A",
      status: apt.status,
      contactNumber: patient.contactNumber,
    };
  });

  /* ===================== PAST APPOINTMENTS (Last 10) ===================== */

  const pastAppointmentsData = await AppointmentModel.find({
    appointmentDate: { $lt: todayStart },
  })
    .populate("patient", "fullName contactNumber")
    .populate("doctor", "fullName")
    .sort({ appointmentDate: -1 })
    .limit(10)
    .lean();

  const pastAppointmentsList = (
    pastAppointmentsData
  ).map((apt) => {
    const patient = getPatientSummary(apt.patient);
    const doctor = getDoctorSummary(apt.doctor);

    return {
      _id: apt._id?.toString() || "",
      patientName: patient.fullName || "Unknown Patient",
      doctorName: doctor.fullName || "Unknown Doctor",
      appointmentDate: format(apt.appointmentDate, "yyyy-MM-dd"),
      timeSlot: apt.timeSlot || "N/A",
      status: apt.status,
      contactNumber: patient.contactNumber,
    };
  });

  /* ===================== RECENT PATIENTS ===================== */

  const recentPatientsData = await PatientModel.find({})
    .sort({ createdAt: -1 })
    .limit(10)
    .select("fullName contactNumber email createdAt")
    .lean();

  const recentPatients = recentPatientsData.map((patient) => ({
    _id: patient._id?.toString() || "",
    fullName: patient.fullName,
    contactNumber: patient.contactNumber,
    email: patient.email,
    registeredAt: format(patient.createdAt as Date, "yyyy-MM-dd"),
  }));

  /* ===================== CALENDAR ===================== */

  // Fetch appointments with patient and doctor population for calendar
  // Show all non-cancelled appointments from today onwards
  const appointmentsForCalendar = await AppointmentModel.find({
    status: { $ne: "Cancelled" },
    appointmentDate: { $gte: startOfDayIST(new Date()) },
  })
    .populate("patient", "fullName contactNumber")
    .populate("doctor", "fullName")
    .sort({ appointmentDate: 1, timeSlot: 1 });

  // Group appointments by date for calendar
  const calendarMap = new Map<
    string,
    {
      date: string;
      count: number;
      appointments: {
        patientName: string;
        doctorName: string;
        contactNumber?: string;
        timeSlot: string;
        treatments: string[];
        teeth: string[];
        consultationType: string;
      }[];
    }
  >();

  appointmentsForCalendar.forEach((appointment) => {
    // Parse the appointment date - ensure consistent date handling across environments
    const appointmentDate = new Date(appointment.appointmentDate);
    // Use formatForInput to group by date only (yyyy-MM-dd), not time
    const dateStr = formatForInput(appointmentDate);

    if (!calendarMap.has(dateStr)) {
      calendarMap.set(dateStr, {
        date: dateStr,
        count: 0,
        appointments: [],
      });
    }

    const calendarEntry = calendarMap.get(dateStr)!;
    calendarEntry.count++;

    const patientSummary = getPatientSummary(appointment.patient);
    const doctorSummary = getDoctorSummary(appointment.doctor);

    calendarEntry.appointments.push({
      patientName: patientSummary.fullName || "Unknown Patient",
      doctorName: doctorSummary.fullName || "Unknown Doctor",
      contactNumber: patientSummary.contactNumber,
      timeSlot: appointment.timeSlot || "N/A",
      treatments: appointment.treatments || [],
      teeth: appointment.teeth || [],
      consultationType: appointment.consultationType || "New",
    });
  });

  const calendar = Array.from(calendarMap.values());

  const result: AssistantDashboardDTO = {
    stats: {
      totalAppointmentsToday,
      upcomingAppointments,
      totalPatients,
      availableDoctors,
    },
    charts: {
      appointmentsByStatus,
      appointmentsTrend,
      doctorsAppointments,
    },
    calendar,
    weekAppointments,
    todayAppointments,
    upcomingAppointments: upcomingAppointmentsList,
    pastAppointments: pastAppointmentsList,
    recentPatients,
    profile: {
      fullName: Assistant.fullName,
    },
  };

  assistantDashboardCache.set(AssistantUserId, {
    createdAt: Date.now(),
    data: result,
  });

  return result;
}
