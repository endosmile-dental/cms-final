"use client";

import React, { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/app/dashboard/layout/DashboardLayout";
import DashboardCards, { Stat } from "@/app/dashboard/ui/DashboardCards";
import DashboardChart from "@/app/dashboard/ui/DashboardChart";
import DashboardPieChart from "@/app/dashboard/ui/DashboardPieChart";
import DashboardCalendar, {
  AppointmentDateDetailed,
} from "@/app/dashboard/ui/DashboardCalendar";
import { ColumnDefinition } from "@/app/dashboard/ui/DashboardTable";
import {
  Syringe,
  User,
  AlertTriangle,
  ReceiptIndianRupee,
  UserRoundPlus,
  ClipboardPlus,
} from "lucide-react";
import { useAppSelector } from "@/app/redux/store/hooks";
import { selectPatients } from "@/app/redux/slices/patientSlice";
import { selectAppointments } from "@/app/redux/slices/appointmentSlice";
import { selectBillings } from "@/app/redux/slices/billingSlice";
import { format } from "date-fns";
import { DashboardBarChart } from "../../ui/DashboardBarChart";
import { ChartConfig } from "@/components/ui/chart";
import { ProfileData } from "@/app/redux/slices/profileSlice";
import { useSession } from "next-auth/react";
import Image from "next/image";
import ReusableTable from "@/app/dashboard/ui/DashboardTable";
import IconButtonWithTooltip from "@/app/components/IconButtonWithTooltip";

// Define a type for a treatment
interface BillingTreatment {
  treatment: string;
  quantity?: number;
}

export interface PatientData {
  patient: string;
  contact: string;
  gender: "Male" | "Female" | "Other";
  registeredAt: string;
}

const patientColumns: ColumnDefinition<PatientData>[] = [
  {
    header: "Patient",
    accessor: (row) => row.patient,
  },
  {
    header: "Contact",
    accessor: (row) => row.contact,
  },
  {
    header: "Gender",
    accessor: (row) => row.gender,
  },
  {
    header: "Registration",
    accessor: (row) => row.registeredAt,
  },
];

export default function DoctorDashboard() {
  const patients = useAppSelector(selectPatients);
  const appointments = useAppSelector(selectAppointments);
  const billings = useAppSelector(selectBillings);
  const profile = useAppSelector((state) => {
    return state?.profile?.profile as ProfileData;
  });
  const { data: session } = useSession();

  const [tableData, setTableData] = useState<
    {
      patient: string;
      contact: string;
      gender: "Male" | "Female" | "Other";
      dob: string;
      registeredAt: string;
    }[]
  >([]);

  // Prepare table data from patients
  useEffect(() => {
    if (patients) {
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
      };

      const patientsTableData = [...patients]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .map((patient) => ({
          patient: patient.fullName,
          contact: patient.contactNumber,
          gender: patient.gender,
          dob: new Date(patient.dateOfBirth).toLocaleDateString(
            "en-US",
            options
          ),
          registeredAt: new Date(patient.createdAt).toLocaleDateString(
            "en-US",
            options
          ),
        }));
      setTableData(patientsTableData);
    }
  }, [patients]);

  const totalRevenue = useMemo(() => {
    return (
      billings?.reduce(
        (sum, billing) => sum + (billing.amountReceived || 0),
        0
      ) || 0
    );
  }, [billings]);

  // Combine multiple appointment calculations into one aggregated pass
  const aggregatedAppointments = useMemo(() => {
    const result = {
      followUps: 0,
      pending: 0,
      upcoming: 0, // NEW
      monthly: {} as Record<string, { completed: number; scheduled: number }>,
      weekly: {} as Record<string, { completed: number; scheduled: number }>,
      yearly: {} as Record<string, { completed: number; scheduled: number }>,
      uniqueDates: new Set<string>(),
    };

    if (!appointments || appointments.length === 0) return result;

    const today = new Date();

    appointments.forEach((appointment) => {
      const appointmentDate = new Date(appointment.appointmentDate);

      // Count consultation types
      if (appointment.consultationType === "Follow-up") {
        result.followUps += 1;
      } else if (appointment.consultationType === "New") {
        result.pending += 1;
      }

      // Check for upcoming appointments
      if (
        appointmentDate >= today &&
        !["Completed", "Cancelled"].includes(appointment.status)
      ) {
        result.upcoming += 1;
      }

      // Aggregate date-based stats
      const month = format(appointmentDate, "MMM");
      const week = format(appointmentDate, "wo");
      const year = format(appointmentDate, "yyyy");
      result.uniqueDates.add(format(appointmentDate, "yyyy-MM-dd"));

      if (!result.monthly[month])
        result.monthly[month] = { completed: 0, scheduled: 0 };
      if (!result.weekly[week])
        result.weekly[week] = { completed: 0, scheduled: 0 };
      if (!result.yearly[year])
        result.yearly[year] = { completed: 0, scheduled: 0 };

      if (appointment.status === "Completed") {
        result.monthly[month].completed += 1;
        result.weekly[week].completed += 1;
        result.yearly[year].completed += 1;
      } else if (appointment.status === "Scheduled") {
        result.monthly[month].scheduled += 1;
        result.weekly[week].scheduled += 1;
        result.yearly[year].scheduled += 1;
      }
    });

    return result;
  }, [appointments]);

  const stats: Stat[] = [
    {
      title: "Total Patients",
      value: patients?.length?.toString() || "N/A",
      icon: <User size={24} color="white" />,
      color: "bg-green-500",
      LinkURL: "/dashboard/pages/Doctor/patientRecords",
    },
    {
      title: "Total Appointments",
      value: appointments?.length?.toString() || "N/A",
      icon: <Syringe size={24} color="white" />,
      color: "bg-blue-500",
      LinkURL: "/dashboard/pages/Doctor/appointments",
    },
    {
      title: "Total Revenue",
      value: `${totalRevenue.toLocaleString()}`, // Format currency properly
      icon: <ReceiptIndianRupee size={24} color="white" />,
      color: "bg-orange-500",
      LinkURL: "/dashboard/pages/Doctor/revenue",
    },
    {
      title: "Pending Consultations",
      value: aggregatedAppointments.upcoming.toString(),
      icon: <AlertTriangle size={24} color="white" />,
      color: "bg-red-500",
      LinkURL: "",
    },
  ];

  const barChartConfig = {
    completed: {
      label: "Completed",
      color: "#2563eb",
    },
    cancelled: {
      label: "Scheduled",
      color: "#60a5fa",
    },
  } satisfies ChartConfig;

  // Prepare appointment stats data for the bar chart
  const appointmentStats = useMemo(() => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return {
      monthly: months.map((month) => ({
        month,
        completed: aggregatedAppointments.monthly[month]?.completed || 0,
        cancelled: aggregatedAppointments.monthly[month]?.scheduled || 0,
      })),
      weekly: Object.keys(aggregatedAppointments.weekly).map((week) => ({
        week,
        completed: aggregatedAppointments.weekly[week].completed,
        cancelled: aggregatedAppointments.weekly[week].scheduled,
      })),
      yearly: Object.keys(aggregatedAppointments.yearly).map((year) => ({
        year,
        completed: aggregatedAppointments.yearly[year].completed,
        cancelled: aggregatedAppointments.yearly[year].scheduled,
      })),
    };
  }, [aggregatedAppointments]);

  // Compute unique appointment dates for the calendar component
  const appointmentDatesDetailed = useMemo<AppointmentDateDetailed[]>(() => {
    if (
      !appointments ||
      appointments.length === 0 ||
      !patients ||
      patients.length === 0
    )
      return [];

    const dateMap: Record<
      string,
      {
        count: number;
        appointments: {
          patientName: string;
          timeSlot: string;
          treatments: string[];
          teeth: string[];
        }[];
      }
    > = {};

    appointments.forEach((appointment) => {
      const dateStr = format(
        new Date(appointment.appointmentDate),
        "yyyy-MM-dd"
      );

      const matchedPatient = patients.find(
        (p) => p._id === appointment.patient
      );
      const patientName = matchedPatient ? matchedPatient.fullName : "Unknown";

      const timeSlot = appointment.timeSlot || "09:00 AM";
      const teeth = appointment.teeth || [];
      const treatments = appointment.treatments || [];

      if (!dateMap[dateStr]) {
        dateMap[dateStr] = {
          count: 0,
          appointments: [],
        };
      }

      dateMap[dateStr].count += 1;
      dateMap[dateStr].appointments.push({
        patientName,
        timeSlot,
        teeth,
        treatments,
      });
    });

    return Object.entries(dateMap).map(([date, { count, appointments }]) => ({
      date,
      count,
      appointments,
    }));
  }, [appointments, patients]);

  // Compute pie chart data from billings by aggregating treatment counts
  const pieData = useMemo(() => {

    if (!billings || billings.length === 0) return [];
    const treatmentCounts: Record<string, number> = {};
    billings.forEach((billing) => {
      if (billing.treatments && Array.isArray(billing.treatments)) {
        billing.treatments.forEach((treatment: BillingTreatment) => {
          treatmentCounts[treatment.treatment] =
            (treatmentCounts[treatment.treatment] || 0) +
            (treatment.quantity || 1);
        });
      }
    });
    return Object.entries(treatmentCounts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [billings]);

  // Compute monthly patient registration data for the line chart
  const registrationChartData = useMemo(() => {
    if (!patients || patients.length === 0) return [];
    const monthlyData = patients.reduce((acc, patient) => {
      const date = new Date(patient.createdAt);
      const month = format(date, "MMM");
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return months.map((month) => ({
      month,
      users: monthlyData[month] || 0,
    }));
  }, [patients]);

  return (
    <DashboardLayout>
      <div className="px-1 space-y-3">
        {session && profile && (
          <div className="w-full flex justify-between items-end">
            <h1 className="text-base md:text-2xl font-semibold tracking-wide font-sans">
              {(() => {
                const hour = new Date().getHours();
                let greeting = "";
                if (hour < 12) {
                  greeting = "Good morning";
                } else if (hour < 18) {
                  greeting = "Good afternoon";
                } else {
                  greeting = "Good evening";
                }
                return `${greeting}, ${profile.fullName.split(" ")[0]}`;
              })()}
            </h1>
            <div className="flex pr-5 gap-x-5">
              <div className="hidden md:flex gap-x-3 items-end">
                <IconButtonWithTooltip
                  href="/dashboard/pages/Doctor/appointments/bookAppointment"
                  tooltip="Book Appointment"
                  icon={
                    <ClipboardPlus
                      size={18}
                      className="text-teal-600 group-hover:text-white"
                    />
                  }
                  hoverBgColor="teal"
                />
                <IconButtonWithTooltip
                  href="/dashboard/pages/Doctor/patientRecords/patientRegistrationForm"
                  tooltip="Add New Patient"
                  icon={
                    <UserRoundPlus
                      size={18}
                      className="text-green-600 group-hover:text-white"
                    />
                  }
                  hoverBgColor="green"
                />
              </div>
              <div>
                <Image
                  src="/logo1.png"
                  alt="Clinic Logo"
                  width={50}
                  height={50}
                  className="rounded-full"
                />
              </div>
            </div>
          </div>
        )}

        <DashboardCards stats={stats} />

        <div className="w-full flex flex-col md:flex-row gap-y-4 md:gap-x-4">
          <DashboardCalendar
            title="Appointments"
            appointmentDetails={appointmentDatesDetailed}
          />
          <div className="w-full">
            <DashboardBarChart
              data={appointmentStats}
              config={barChartConfig}
              className="min-h-[200px]"
              barRadius={8}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DashboardChart
            title="Patient Monthly Registration"
            data={registrationChartData}
          />
          <DashboardPieChart title="Treatments Taken" data={pieData} />
        </div>

        <div>
          <ReusableTable<PatientData>
            title="Recent Patient Registrations"
            data={tableData}
            columns={patientColumns}
            emptyMessage="No patient data available."
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
