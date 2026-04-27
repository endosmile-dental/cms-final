"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/app/dashboard/layout/DashboardLayout";
import DashboardCards, { Stat } from "@/app/dashboard/ui/DashboardCards";
import DashboardChart from "@/app/dashboard/ui/DashboardChart";
import DashboardCalendar from "@/app/dashboard/ui/DashboardCalendar";
import {
  Calendar,
  Users,
  Clock,
  Stethoscope,
  UserPlus,
  ClipboardList,
  Smile,
} from "lucide-react";
import Loading from "@/app/components/loading/Loading";
import Image from "next/image";
import DataTable from "@/app/components/DataTable";
import { AssistantDashboardDTO } from "@/app/types/dashboard/assistant/assistantDashboard";
import FrequencyCard from "@/app/components/FrequencyCard";
import IconButtonWithTooltip from "@/app/components/IconButtonWithTooltip";
import { AvailableDoctorsModal } from "./components/AvailableDoctorsModal";

export default function AssistantDashboardClient({
  data,
}: {
  data: AssistantDashboardDTO | null;
}) {
  const [timeOfDay, setTimeOfDay] = useState<string>("morning");
  const [showDoctorsModal, setShowDoctorsModal] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    setTimeOfDay(hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening");
  }, []);

  if (!data) {
    return (
      <DashboardLayout>
        <Loading />
      </DashboardLayout>
    );
  }

  /* -------------------- STATS -------------------- */

  const stats: Stat[] = [
    {
      title: "Today's Appointments",
      value: data.stats.totalAppointmentsToday.toString(),
      icon: <Calendar size={24} color="white" />,
      color: "bg-blue-500",
      LinkURL: "#week-appointments",
    },
    {
      title: "Upcoming Appointments",
      value: data.stats.upcomingAppointments.toString(),
      icon: <Clock size={24} color="white" />,
      color: "bg-purple-500",
      LinkURL: "#week-appointments",
    },
    {
      title: "Total Patients",
      value: data.stats.totalPatients.toString(),
      icon: <Users size={24} color="white" />,
      color: "bg-green-500",
      LinkURL: "#recent-patients",
    },
    {
      title: "Available Doctors",
      value: data.stats.availableDoctors.toString(),
      icon: <Stethoscope size={24} color="white" />,
      color: "bg-orange-500",
      onClickFunction: () => setShowDoctorsModal(true),
    },
  ];

  const weekAppointmentsColumns = [
    {
      header: "Date",
      accessorKey: "appointmentDate" as const,
    },
    {
      header: "Patient",
      accessorKey: "patientName" as const,
    },
    {
      header: "Doctor",
      accessorKey: "doctorName" as const,
    },
    {
      header: "Time",
      accessorKey: "timeSlot" as const,
    },
    {
      header: "Phone",
      accessorKey: "contactNumber" as const,
    },
    {
      header: "Status",
      accessorKey: "status" as const,
      render: (value: unknown) => (
        <span
          className={`px-2 py-1 rounded text-xs font-semibold ${value === "Scheduled"
            ? "bg-blue-100 text-blue-800"
            : value === "Completed"
              ? "bg-green-100 text-green-800"
              : value === "Cancelled"
                ? "bg-red-100 text-red-800"
                : "bg-gray-100 text-gray-800"
            }`}
        >
          {String(value)}
        </span>
      ),
    },
  ];

  const recentPatientsColumns = [
    {
      header: "Patient Name",
      accessorKey: "fullName" as const,
    },
    {
      header: "Phone",
      accessorKey: "contactNumber" as const,
    },
    {
      header: "Email",
      accessorKey: "email" as const,
    },
    {
      header: "Registered",
      accessorKey: "registeredAt" as const,
    },
  ];

  /* -------------------- CALCULATE PATIENT APPOINTMENT FREQUENCY -------------------- */

  // Combine all appointments and calculate frequency by patient
  const allAppointments = [
    ...data.todayAppointments,
    ...data.upcomingAppointments,
    ...data.pastAppointments,
  ];

  const patientFrequencyMap = new Map<string, number>();
  allAppointments.forEach((apt) => {
    const count = patientFrequencyMap.get(apt.patientName) || 0;
    patientFrequencyMap.set(apt.patientName, count + 1);
  });

  // Convert to array and sort by frequency (descending)
  const patientFrequencyData = Array.from(patientFrequencyMap.entries())
    .map(([name, count]) => ({ name, value: count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 15); // Limit to top 15 patients for better visualization

  const totalAppointments = allAppointments.length;

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Welcome Section */}
        <div className="flex md:flex-row items-start md:items-center justify-between w-full">
          {/* Greeting + Subtitle + Icon */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Smile className="text-indigo-600" size={24} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">
                {`Good ${timeOfDay}, ${data.profile.fullName.split(" ")[0]}`}
              </h1>
              <p className="text-muted-foreground text-sm w-72 md:w-full">
                Manage appointments and patient records from one place
              </p>
            </div>
          </div>

          {/* Action Buttons + Logo */}
          <div className="flex items-center gap-x-4 mt-4 md:mt-0">
            <div className="hidden md:flex gap-x-3">
              <IconButtonWithTooltip
                href="/dashboard/pages/Assistant/appointments"
                tooltip="Add Appointment"
                icon={
                  <ClipboardList
                    size={18}
                    className="text-blue-600 group-hover:text-white"
                  />
                }
                hoverBgColor="#2563eb" // blue-600
              />
              <IconButtonWithTooltip
                href="/dashboard/pages/Assistant/patientRecords"
                tooltip="Add New Patient"
                icon={
                  <UserPlus
                    size={18}
                    className="text-green-600 group-hover:text-white"
                  />
                }
                hoverBgColor="#16a34a" // green-600
              />
            </div>

            <a
              href="https://g.co/kgs/1FNC4r5"
              target="_blank"
              rel="noreferrer"
              className="shrink-0"
            >
              <Image
                src="/logo1.png"
                alt="Clinic Logo"
                width={48}
                height={48}
                className="rounded-full border border-border shadow-sm"
              />
            </a>
          </div>
        </div>

        {/* Stats Cards */}
        <DashboardCards stats={stats} />

        {/* Calendar Section */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <DashboardCalendar
              title="Appointments Calendar"
              appointmentDetails={data.calendar}
            />
          </div>

          {/* Patient Appointment Frequency */}
          {patientFrequencyData.length > 0 && (
            <div className="flex-1 flex flex-col rounded-lg bg-white p-6 shadow overflow-hidden">
              <div className="flex-1 overflow-y-auto">
                <FrequencyCard
                  title="Patient Appointment Frequency"
                  data={patientFrequencyData}
                  total={totalAppointments}
                />
              </div>
            </div>
          )}
        </div>

        {/* Week's Appointments Section */}
        <div id="week-appointments" className="rounded-lg bg-white p-6 shadow">
          <div className="mb-4 flex items-center">
            <Calendar className="mr-2" size={20} />
            <h2 className="text-lg font-semibold">Week&#39;s Appointments (Monday - Sunday)</h2>
          </div>
          {data.weekAppointments.length > 0 ? (
            <DataTable
              title="Week's Appointments"
              columns={weekAppointmentsColumns}
              data={data.weekAppointments}
            />
          ) : (
            <div className="py-8 text-center text-gray-500">
              <p>No appointments scheduled for this week</p>
            </div>
          )}
        </div>

        {/* Appointment Trend Section */}
        <div>
          {/* Appointment Trend */}
          {data.charts.appointmentsTrend.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow md:col-span-2 lg:col-span-1">
              <h2 className="mb-4 text-lg font-semibold">Appointments Trend</h2>
              <DashboardChart
                title="Appointment Trends"
                data={data.charts.appointmentsTrend}
                xKey="date"
                lines={[
                  { dataKey: "scheduled", stroke: "#3b82f6" },
                  { dataKey: "completed", stroke: "#10b981" },
                  { dataKey: "cancelled", stroke: "#ef4444" },
                ]}
              />
            </div>
          )}
        </div>

        {/* Recent Patients Section */}
        <div id="recent-patients" className="rounded-lg bg-white p-6 shadow">
          <div className="mb-4 flex items-center">
            <Users className="mr-2" size={20} />
            <h2 className="text-lg font-semibold">Recent Patients</h2>
          </div>
          {data.recentPatients.length > 0 ? (
            <DataTable
              title="Recent Patients"
              columns={recentPatientsColumns}
              data={data.recentPatients}
            />
          ) : (
            <div className="py-8 text-center text-gray-500">
              <p>No recent patients</p>
            </div>
          )}
        </div>
      </div>

      {/* Available Doctors Modal */}
      <AvailableDoctorsModal
        isOpen={showDoctorsModal}
        onClose={() => setShowDoctorsModal(false)}
      />
    </DashboardLayout>
  );
}
