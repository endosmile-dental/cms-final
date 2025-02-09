"use client";

import { BarChart, Calendar, Users } from "lucide-react";
import DashboardLayout from "../../layout/DashboardLayout";
import DashboardCalendar from "../../ui/DashboardCalendar";
import DashboardCards, { Stat } from "../../ui/DashboardCards";
import DashboardChart from "../../ui/DashboardChart";
import DashboardTable from "../../ui/DashboardTable";

export default function SuperAdminDashboard() {

   // Define your stats array here
   const stats: Stat[] = [
    {
      title: "Total Users",
      value: "1,245",
      icon: <Users size={24} />,
      color: "bg-blue-500",
    },
    {
      title: "Appointments",
      value: "345",
      icon: <Calendar size={24} />,
      color: "bg-green-500",
    },
    {
      title: "Revenue",
      value: "$12,340",
      icon: <BarChart size={24} />,
      color: "bg-yellow-500",
    },
  ];

  return (
    <DashboardLayout>
      
      <div className="p-6 space-y-6">
        {/* 🔹 Top Metrics Cards */}
        <DashboardCards stats={stats}/>

        {/* 🔹 Charts & Calendar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DashboardChart />
          <DashboardCalendar />
        </div>

        {/* 🔹 Recent Activities Table */}
        <DashboardTable />
      </div>
    </DashboardLayout>
  );
}
