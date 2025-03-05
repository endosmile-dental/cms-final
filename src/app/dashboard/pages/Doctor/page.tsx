"use client";

import React, { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/app/dashboard/layout/DashboardLayout";
import DashboardCards, { Stat } from "@/app/dashboard/ui/DashboardCards";
import DashboardChart from "@/app/dashboard/ui/DashboardChart";
import DashboardPieChart from "@/app/dashboard/ui/DashboardPieChart";
import DashboardCalendar from "@/app/dashboard/ui/DashboardCalendar";
import DashboardTable from "@/app/dashboard/ui/DashboardTable";
import { Syringe, User, Clock, AlertTriangle } from "lucide-react";
import { useAppSelector } from "@/app/redux/store/hooks";
import { selectPatients } from "@/app/redux/slices/patientSlice";
import { selectAppointments } from "@/app/redux/slices/appointmentSlice";
import { selectBillings } from "@/app/redux/slices/billingSlice";
import { format } from "date-fns";

// Define a type for a treatment
interface BillingTreatment {
  treatment: string;
  quantity?: number;
}

export default function DoctorDashboard() {
  const patients = useAppSelector(selectPatients);
  const appointments = useAppSelector(selectAppointments);
  const billings = useAppSelector(selectBillings);
  const [tableData, setTableData] = useState<
    {
      patient: string;
      contact: string;
      gender: "Male" | "Female" | "Other";
      dob: string;
      registeredAt: string;
    }[]
  >([]);

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

  const stats: Stat[] = [
    {
      title: "Total Patients",
      value: patients?.length?.toString() || "N/A",
      icon: <User size={24} color="white" />,
      color: "bg-green-500",
    },
    {
      title: "Total Appointments",
      value: appointments?.length?.toString() || "N/A",
      icon: <Syringe size={24} color="white" />,
      color: "bg-blue-500",
    },
    {
      title: "Upcoming Follow-ups",
      value: "5",
      icon: <Clock size={24} color="white" />,
      color: "bg-orange-500",
    },
    {
      title: "Pending Consultations",
      value: "2",
      icon: <AlertTriangle size={24} color="white" />,
      color: "bg-red-500",
    },
  ];

  // Compute chart data based on patient registration by month.
  const chartData = useMemo(() => {
    if (!patients || patients.length === 0) return [];
    const monthlyData = patients.reduce((acc, patient) => {
      const date = new Date(patient.createdAt);
      const month = format(date, "MMM"); // e.g. "Jan", "Feb"
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

  // Compute a summary of appointments by date including consultation type breakdown.
  const appointmentSummary = useMemo(() => {
    if (!appointments || appointments.length === 0) return [];
    const summary: Record<
      string,
      { date: Date; count: number; new: number; followUp: number }
    > = {};
    appointments.forEach((appointment) => {
      const date = new Date(appointment.appointmentDate);
      const dateKey = format(date, "yyyy-MM-dd");
      if (!summary[dateKey]) {
        summary[dateKey] = { date, count: 0, new: 0, followUp: 0 };
      }
      summary[dateKey].count++;
      if (appointment.consultationType === "New") {
        summary[dateKey].new++;
      } else if (appointment.consultationType === "Follow-up") {
        summary[dateKey].followUp++;
      }
    });
    return Object.values(summary);
  }, [appointments]);

  // Compute pie chart data from billings by aggregating treatment counts.
  const pieData = useMemo(() => {
    if (!billings || billings.length === 0) return [];
    const treatmentCounts: Record<string, number> = {};
    billings.forEach((billing) => {
      if (billing.treatments && Array.isArray(billing.treatments)) {
        billing.treatments.forEach((treatment: BillingTreatment) => {
          const treatmentName = treatment.treatment;
          treatmentCounts[treatmentName] =
            (treatmentCounts[treatmentName] || 0) + (treatment.quantity || 1);
        });
      }
    });
    return Object.entries(treatmentCounts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [billings]);

  return (
    <DashboardLayout>
      <div className="p-3 space-y-4">
        <DashboardCards stats={stats} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DashboardChart
            title="Monthly Patient Registrations"
            data={chartData}
          />
          <DashboardPieChart title="Treatments Taken" data={pieData} />
        </div>
        <div className="w-full flex flex-col md:flex-row gap-y-4 md:gap-x-4">
          <DashboardCalendar
            title="Appointments"
            appointmentSummary={appointmentSummary}
          />
          <div className="w-full">
            <DashboardTable data={tableData} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
