"use client";

import DashboardLayout from "../../layout/DashboardLayout";
import DashboardCalendar from "../../ui/DashboardCalendar";
import DashboardCards from "../../ui/DashboardCards";
import DashboardChart from "../../ui/DashboardChart";
import DashboardTable from "../../ui/DashboardTable";

export default function SuperAdminDashboard() {
  
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* 🔹 Top Metrics Cards */}
        <DashboardCards />

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
