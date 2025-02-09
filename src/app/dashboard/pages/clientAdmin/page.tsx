"use client";

import { Briefcase, UserCheck, AlertTriangle } from "lucide-react";
import DashboardLayout from "../../layout/DashboardLayout";
import DashboardCalendar from "../../ui/DashboardCalendar";
import DashboardCards, { Stat } from "../../ui/DashboardCards";
import DashboardChart from "../../ui/DashboardChart";
import DashboardTable from "../../ui/DashboardTable";

export default function ClientAdminDashboard() {
  // Define your stats array with data relevant for a Client Admin
  const stats: Stat[] = [
    {
      title: "Total Clinics",
      value: "12",
      icon: <Briefcase size={24} />,
      color: "bg-purple-500",
    },
    {
      title: "Managed Doctors",
      value: "28",
      icon: <UserCheck size={24} />,
      color: "bg-teal-500",
    },
    {
      title: "Pending Approvals",
      value: "3",
      icon: <AlertTriangle size={24} />,
      color: "bg-red-500",
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Top Metrics Cards */}
        <DashboardCards stats={stats} />

        {/* Charts & Calendar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DashboardChart />
          <DashboardCalendar />
        </div>

        {/* Recent Activities Table */}
        <DashboardTable />
      </div>
    </DashboardLayout>
  );
}
