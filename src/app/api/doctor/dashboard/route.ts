import dbConnect from "@/app/utils/dbConnect";

import PatientModel from "@/app/model/Patient.model";
import AppointmentModel from "@/app/model/Appointment.model";
import LabWorkModel from "@/app/model/LabWork.model";
import BillingModel from "@/app/model/Billing.model";
import DoctorModel from "@/app/model/Doctor.model";

import { format } from "date-fns";
import { DoctorDashboardDTO } from "@/app/types/dashboard/doctor/doctorDashboard";
import { requireAuth } from "@/app/utils/authz";
import { successResponse } from "@/app/utils/api";

type AppointmentAggregateRow = {
  _id: { year: number; month: number; week: number; status: string };
  count: number;
};

type AppointmentMonthlyPoint = { month: string; completed: number; scheduled: number };
type AppointmentWeeklyPoint = { week: string; completed: number; scheduled: number };
type AppointmentYearlyPoint = { year: string; completed: number; scheduled: number };

type TreatmentItem = { treatment: string; quantity?: number };
type BillingLite = { date: Date; treatments?: TreatmentItem[] };

/* =========================================================
   SERVICE FUNCTION
========================================================= */

export async function getDoctorDashboardData(
  doctorId: string,
): Promise<DoctorDashboardDTO> {
  await dbConnect();

  const doctor = await DoctorModel.findOne({
    userId: doctorId, // assuming your Doctor schema has: userId: ObjectId
  }).select("_id");

  if (!doctor) {
    throw new Error("Doctor not found");
  }

  const doctorObjectId = doctor._id;

  console.log("doctorObjectId", doctorObjectId);

  /* ===================== STATS ===================== */

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [
    totalPatients,
    pendingLabWorks,
    todayAppointments,
    upcomingAppointments,
  ] = await Promise.all([
    PatientModel.countDocuments({ DoctorId: doctorObjectId }),

    LabWorkModel.countDocuments({
      doctorId: doctorObjectId,
      status: "Pending",
    }),

    AppointmentModel.countDocuments({
      doctor: doctorObjectId,
      appointmentDate: { $gte: todayStart, $lte: todayEnd },
    }),

    AppointmentModel.countDocuments({
      doctor: doctorObjectId,
      appointmentDate: { $gt: new Date() },
      status: { $nin: ["Completed", "Cancelled"] },
    }),
  ]);

  /* ===================== PATIENT REGISTRATIONS ===================== */

  const registrationsRaw = await PatientModel.aggregate([
    { $match: { DoctorId: doctorObjectId } },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  const patientRegistrations = registrationsRaw.map((r) => ({
    month: format(new Date(r._id.year, r._id.month - 1), "MMM yyyy"),
    count: r.count,
  }));

  /* ===================== APPOINTMENTS (Monthly / Weekly / Yearly) ===================== */

  const appointmentsRaw = await AppointmentModel.aggregate<AppointmentAggregateRow>([
    { $match: { doctor: doctorObjectId } },
    {
      $group: {
        _id: {
          year: { $year: "$appointmentDate" },
          month: { $month: "$appointmentDate" },
          week: { $week: "$appointmentDate" },
          status: "$status",
        },
        count: { $sum: 1 },
      },
    },
  ]);

  // Generate past 12 months labels
  const currentDate = new Date();
  const monthlyMap: Record<string, AppointmentMonthlyPoint> = {};
  
  // Initialize past 12 months with zero data
  for (let i = 11; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthLabel = format(date, "MMM yyyy");
    monthlyMap[monthLabel] = {
      month: monthLabel,
      completed: 0,
      scheduled: 0,
    };
  }

  const weeklyMap: Record<string, AppointmentWeeklyPoint> = {};
  const yearlyMap: Record<string, AppointmentYearlyPoint> = {};

  appointmentsRaw.forEach((r) => {
    const year = r._id.year;
    const monthLabel = format(
      new Date(r._id.year, r._id.month - 1),
      "MMM yyyy",
    );
    const weekLabel = `${year}-W${r._id.week}`;
    const yearLabel = year.toString();

    // Only process monthly data if the month exists in our 12-month range
    if (monthlyMap[monthLabel]) {
      const isCompleted = r._id.status === "Completed";
      const isScheduled =
        r._id.status !== "Completed" && r._id.status !== "Cancelled";

      if (isCompleted) {
        monthlyMap[monthLabel].completed += r.count;
      }

      if (isScheduled) {
        monthlyMap[monthLabel].scheduled += r.count;
      }
    }

    // Weekly data (existing logic)
    if (!weeklyMap[weekLabel]) {
      weeklyMap[weekLabel] = {
        week: weekLabel,
        completed: 0,
        scheduled: 0,
      };
    }

    // Yearly data (existing logic)
    if (!yearlyMap[yearLabel]) {
      yearlyMap[yearLabel] = {
        year: yearLabel,
        completed: 0,
        scheduled: 0,
      };
    }

    const isCompleted = r._id.status === "Completed";
    const isScheduled =
      r._id.status !== "Completed" && r._id.status !== "Cancelled";

    if (isCompleted) {
      weeklyMap[weekLabel].completed += r.count;
      yearlyMap[yearLabel].completed += r.count;
    }

    if (isScheduled) {
      weeklyMap[weekLabel].scheduled += r.count;
      yearlyMap[yearLabel].scheduled += r.count;
    }
  });

  const appointments = {
    monthly: Object.values(monthlyMap),
    weekly: Object.values(weeklyMap),
    yearly: Object.values(yearlyMap),
  };

  /* ===================== TREATMENTS (Weekly / Monthly / Yearly) ===================== */

  const billings = (await BillingModel.find({
    doctorId: doctorId,
  }).select("date treatments")) as BillingLite[];

  const billingDate = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(billingDate.getDate() - 7);

  const treatmentCounter = (
    filterFn: (b: BillingLite) => boolean,
  ): { name: string; value: number }[] => {
    const map: Record<string, number> = {};

    billings.filter(filterFn).forEach((b) => {
      b.treatments?.forEach((t) => {
        map[t.treatment] = (map[t.treatment] || 0) + (t.quantity || 1);
      });
    });

    return Object.entries(map).map(([name, value]) => ({ name, value }));
  };

  const treatmentsTaken = {
    weekly: treatmentCounter(
      (b) => new Date(b.date) >= sevenDaysAgo && new Date(b.date) <= billingDate,
    ),
    monthly: treatmentCounter(
      (b) =>
        new Date(b.date).getMonth() === billingDate.getMonth() &&
        new Date(b.date).getFullYear() === billingDate.getFullYear(),
    ),
    yearly: treatmentCounter(
      (b) => new Date(b.date).getFullYear() === billingDate.getFullYear(),
    ),
  };

  /* ===================== CALENDAR ===================== */

  // Fetch appointments with patient population for calendar
  const appointmentsForCalendar = await AppointmentModel.find({
    doctor: doctorObjectId,
    status: { $ne: "Cancelled" },
  })
    .populate("patient", "fullName contactNumber")
    .sort({ appointmentDate: 1, timeSlot: 1 });

  // Group appointments by date
  const calendarMap = new Map<string, {
    date: string;
    count: number;
    appointments: {
      patientName: string;
      contactNumber?: string;
      timeSlot: string;
      treatments: string[];
      teeth: string[];
    }[];
  }>();

  appointmentsForCalendar.forEach((appointment) => {
    const dateStr = format(new Date(appointment.appointmentDate), "yyyy-MM-dd");
    
    if (!calendarMap.has(dateStr)) {
      calendarMap.set(dateStr, {
        date: dateStr,
        count: 0,
        appointments: []
      });
    }

    const calendarEntry = calendarMap.get(dateStr)!;
    calendarEntry.count++;
    calendarEntry.appointments.push({
      patientName: appointment.patient?.fullName || "Unknown Patient",
      contactNumber: appointment.patient?.contactNumber,
      timeSlot: appointment.timeSlot || "N/A",
      treatments: appointment.treatments || [],
      teeth: appointment.teeth || []
    });
  });

  const calendar = Array.from(calendarMap.values());

  /* ===================== RECENT PATIENTS ===================== */

  const recentPatientsRaw = await PatientModel.find({
    DoctorId: doctorObjectId,
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .select("fullName contactNumber age createdAt");

  const recentPatients = recentPatientsRaw.map((p) => ({
    _id: p._id.toString(),
    fullName: p.fullName,
    contactNumber: p.contactNumber,
    age: p.age,
    registeredAt: format(p.createdAt, "dd/MM/yyyy"),
  }));

  /* ===================== DOCTOR PROFILE ===================== */

  const doctorProfile = await DoctorModel.findOne({
    userId: doctorId,
  }).select("fullName");

  /* ===================== RETURN ===================== */

  return {
    stats: {
      totalPatients,
      upcomingAppointments,
      todayAppointments,
      pendingLabWorks,
    },
    charts: {
      appointments,
      patientRegistrations,
      treatmentsTaken,
    },
    calendar,
    recentPatients,
    profile: {
      fullName: doctorProfile?.fullName || "Doctor",
    },
  };
}

/* =========================================================
   API HANDLER
========================================================= */

export async function GET() {
  const authResult = await requireAuth(["Doctor", "Admin", "SuperAdmin"]);
  if ("error" in authResult) return authResult.error;

  const data = await getDoctorDashboardData(authResult.user.id);

  return successResponse(data);
}
