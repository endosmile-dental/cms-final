"use client";

import { BarChart, Calendar, Users } from "lucide-react";
import DashboardLayout from "../../layout/DashboardLayout";
import DashboardCalendar from "../../ui/DashboardCalendar";
import DashboardCards, { Stat } from "../../ui/DashboardCards";
import DashboardChart from "../../ui/DashboardChart";
import ReusableTable, { ColumnDefinition } from "../../ui/DashboardTable";

export default function SuperAdminDashboard() {
  // Define stats for SuperAdmin
  const stats: Stat[] = [
    {
      title: "Total Users",
      value: "1,245",
      icon: <Users size={24} />,
      color: "bg-blue-500",
      LinkURL: "/dashboard/users",
    },
    {
      title: "Appointments",
      value: "345",
      icon: <Calendar size={24} />,
      color: "bg-green-500",
      LinkURL: "/dashboard/appointments",
    },
    {
      title: "Revenue",
      value: "$12,340",
      icon: <BarChart size={24} />,
      color: "bg-yellow-500",
      LinkURL: "/dashboard/revenue",
    },
  ];

  // Define the interface for table data
  interface TableData {
    name: string;
    role: string;
    contact: string;
    registeredAt: string;
  }

  // Define the columns for the table
  const columns: ColumnDefinition<TableData>[] = [
    { header: "Name", accessor: (row) => row.name },
    { header: "Role", accessor: (row) => row.role },
    { header: "Contact", accessor: (row) => row.contact },
    { header: "Registered At", accessor: (row) => row.registeredAt },
  ];

  // Sample user data
  const tableData: TableData[] = [
    {
      name: "John Doe",
      role: "Admin",
      contact: "+91 9876543210",
      registeredAt: "2024-01-15",
    },
    {
      name: "Jane Smith",
      role: "Teacher",
      contact: "+91 8765432109",
      registeredAt: "2024-02-20",
    },
    {
      name: "Mike Johnson",
      role: "Student",
      contact: "+91 7654321098",
      registeredAt: "2024-03-10",
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* 🔹 Top Metrics Cards */}
        <DashboardCards stats={stats} />

        {/* 🔹 Charts & Calendar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DashboardChart title="System Performance Overview" data={[]} />
          <DashboardCalendar title="Upcoming Events" appointmentDates={[]} />
        </div>

        {/* 🔹 Recent Activities Table */}
        <ReusableTable
          title="Recent User Registrations"
          columns={columns}
          data={tableData}
        />
      </div>
    </DashboardLayout>
  );
}
