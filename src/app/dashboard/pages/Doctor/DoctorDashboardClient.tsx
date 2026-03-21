"use client";

import DashboardLayout from "@/app/dashboard/layout/DashboardLayout";
import DashboardCards, { Stat } from "@/app/dashboard/ui/DashboardCards";
import DashboardChart from "@/app/dashboard/ui/DashboardChart";
import { DashboardBarChart } from "@/app/dashboard/ui/DashboardBarChart";
import DashboardPieChart from "@/app/dashboard/ui/DashboardPieChart";
import DashboardCalendar from "@/app/dashboard/ui/DashboardCalendar";
import {
  CalendarCheck,
  LucideFlaskConical,
  Syringe,
  User,
  Smile,
  ClipboardList,
  UserPlus,
} from "lucide-react";
import Loading from "@/app/components/loading/Loading";
import Image from "next/image";
import DataTable from "@/app/components/DataTable";
import IconButtonWithTooltip from "@/app/components/IconButtonWithTooltip";
import { useRouter } from "next/navigation";
import { DoctorDashboardDTO } from "@/app/types/dashboard/doctor/doctorDashboard";

export default function DoctorDashboardClient({
  data,
}: {
  data: DoctorDashboardDTO | null;
}) {
  const router = useRouter();


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
      title: "Total Patients",
      value: data.stats.totalPatients.toString(),
      icon: <User size={24} color="white" />,
      color: "bg-green-500",
      LinkURL: "/dashboard/pages/Doctor/patientRecords",
    },
    {
      title: "Upcoming Appointments",
      value: data.stats.upcomingAppointments.toString(),
      icon: <Syringe size={24} color="white" />,
      color: "bg-blue-500",
      LinkURL: "/dashboard/pages/Doctor/appointments",
    },
    {
      title: "Pending LabWorks",
      value: data.stats.pendingLabWorks.toString(),
      icon: <LucideFlaskConical size={24} color="white" />,
      color: "bg-orange-500",
      LinkURL: "/dashboard/pages/Doctor/labWork",
    },
    {
      title: "Today's Appointments",
      value: data.stats.todayAppointments.toString(),
      icon: <CalendarCheck size={24} color="white" />,
      color: "bg-red-500",
      LinkURL: "/dashboard/pages/Doctor/appointments",
    },
  ];


  /* -------------------- UI -------------------- */

  return (
    <DashboardLayout>
      <div className="p-2 md:p-0 space-y-4">
        {/* Greeting Header */}
        <div className="flex md:flex-row items-start md:items-center justify-between w-full">
          {/* Greeting + Subtitle */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Smile className="text-indigo-600" size={24} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">
                {(() => {
                  const hour = new Date().getHours();
                  return `Good ${hour < 12
                    ? "morning"
                    : hour < 18
                      ? "afternoon"
                      : "evening"
                    }, ${data.profile.fullName.split(" ")[0]}`;
                })()}
              </h1>
              <p className="text-muted-foreground text-sm w-72 md:w-full">
                Manage appointments, lab work, and patient records from one
                place
              </p>
            </div>
          </div>

          {/* Action Buttons + Logo */}
          <div className="flex items-center gap-x-4 mt-4 md:mt-0">
            <div className="hidden md:flex gap-x-3">
              <IconButtonWithTooltip
                href="/dashboard/pages/Doctor/labWork"
                tooltip="Add Lab Work"
                icon={
                  <LucideFlaskConical
                    size={18}
                    className="text-red-600 group-hover:text-white"
                  />
                }
                hoverBgColor="#dc2626" // red-600
              />
              <IconButtonWithTooltip
                href="/dashboard/pages/Doctor/appointments/bookAppointment"
                tooltip="Book Appointment"
                icon={
                  <ClipboardList
                    size={18}
                    className="text-blue-600 group-hover:text-white"
                  />
                }
                hoverBgColor="#2563eb" // blue-600
              />
              <IconButtonWithTooltip
                href="/dashboard/pages/Doctor/patientRecords/patientRegistrationForm"
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

        {/* Cards */}
        <DashboardCards stats={stats} />

        {/* Calendar + Appointments Chart */}
        <div className="flex flex-col md:flex-row gap-4">
          <DashboardCalendar
            title="Appointments"
            appointmentDetails={data.calendar}
          />

          {/* Appointments Chart with timeframe switch */}
          <DashboardBarChart
            data={{
              monthly: data.charts.appointments.monthly,
              weekly: data.charts.appointments.weekly,
              yearly: data.charts.appointments.yearly,
            }}
            config={{
              completed: { label: "Completed", color: "hsl(var(--chart-1))" },
              scheduled: { label: "Scheduled", color: "hsl(var(--chart-2))" },
            }}
            className="min-h-[160px] md:min-h-[200px] lg:min-h-[240px] xl:min-h-[280px] w-full bg-card dark:bg-card dark:border-border p-4 rounded-xl border border-border shadow-sm"
            barRadius={8}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DashboardChart
            title="Patient Registrations"
            data={data.charts.patientRegistrations}
            xKey="month"
            lines={[{ dataKey: "count", stroke: "#6366f1" }]}
          />

          <DashboardPieChart
            title="Treatments Taken"
            data={data.charts.treatmentsTaken}
            enableTimeFrameSort
          />
        </div>

        {/* Recent Patients */}
          <DataTable
            title="Recent Patient Registrations"
            data={data.recentPatients}
            itemsPerPage={10}
            showSearch
            onRowClick={(row) =>
              router.push(
                `/dashboard/pages/Doctor/patientRecords?patientId=${row._id}`
              )
            }
            columns={[
              { header: "Full Name", accessorKey: "fullName" },
              { header: "Contact", accessorKey: "contactNumber" },
              { header: "Age", accessorKey: "age" },
              { header: "Registered At", accessorKey: "registeredAt" },
            ]}
          />
      </div>
    </DashboardLayout>
  );
}
