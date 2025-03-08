"use client";

import { Calendar, Clock, FileText } from "lucide-react";
import DashboardLayout from "../../layout/DashboardLayout";
import DashboardCalendar from "../../ui/DashboardCalendar";
import DashboardCards, { Stat } from "../../ui/DashboardCards";
import DashboardChart from "../../ui/DashboardChart";
import DashboardTable, { TableData } from "../../ui/DashboardTable";

export default function PatientDashboard() {
  // Define patient-specific stats
  const stats: Stat[] = [
    {
      title: "Upcoming Appointments",
      value: "2",
      icon: <Clock size={24} color="white" />,
      color: "bg-blue-500",
      LinkURL: "/dashboard/pages/Patient/appointments",
    },
    {
      title: "Medical Records",
      value: "15",
      icon: <FileText size={24} color="white" />,
      color: "bg-green-500",
      LinkURL: "/dashboard/pages/Patient/records",
    },
    {
      title: "Next Checkup",
      value: "2025-04-20",
      icon: <Calendar size={24} color="white" />,
      color: "bg-orange-500",
      LinkURL: "/dashboard/pages/Patient/appointments",
    },
  ];

  // Sample table data (could be recent appointments, test results, etc.)
  const tableData: TableData[] = [
    {
      patient: "Dr. John Doe", // For patients, you might show the physician's name.
      contact: "+91 9876543210",
      gender: "Male",
      registeredAt: "2025-04-20",
    },
    {
      patient: "Dr. Jane Smith",
      contact: "+91 8765432109",
      gender: "Female",
      registeredAt: "2025-05-15",
    },
    {
      patient: "Dr. Mike Johnson",
      contact: "+91 7654321098",
      gender: "Male",
      registeredAt: "2025-06-10",
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Top Metrics Cards */}
        <DashboardCards stats={stats} />

        {/* Charts & Calendar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DashboardChart
            title="Recent Health Trends"
            // Pass your patient health data for charting here.
            data={[]}
          />
          <DashboardCalendar
            title="Appointment Calendar"
            appointmentDates={[]}
          />
        </div>

        {/* Recent Activities / Appointments Table */}
        <DashboardTable data={tableData} />
      </div>
    </DashboardLayout>
  );
}
