"use client";

import { Briefcase, UserCheck, AlertTriangle } from "lucide-react";
import DashboardLayout from "../../layout/DashboardLayout";
import DashboardCalendar from "../../ui/DashboardCalendar";
import DashboardCards, { Stat } from "../../ui/DashboardCards";
import DashboardChart from "../../ui/DashboardChart";
import ReusableTable, { ColumnDefinition } from "../../ui/DashboardTable";

export default function ClientAdminDashboard() {
  // Define stats for Client Admin
  const stats: Stat[] = [
    {
      title: "Total Clinics",
      value: "12",
      icon: <Briefcase size={24} />,
      color: "bg-purple-500",
      LinkURL: "/dashboard/clinics",
    },
    {
      title: "Managed Doctors",
      value: "28",
      icon: <UserCheck size={24} />,
      color: "bg-teal-500",
      LinkURL: "/dashboard/doctors",
    },
    {
      title: "Pending Approvals",
      value: "3",
      icon: <AlertTriangle size={24} />,
      color: "bg-red-500",
      LinkURL: "/dashboard/approvals",
    },
  ];

  // Define the interface for table data
  interface TableData {
    name: string;
    contact: string;
    gender: string;
    registeredAt: string;
  }

  // Define the columns for the table
  const columns: ColumnDefinition<TableData>[] = [
    { header: "Name", accessor: (row) => row.name },
    { header: "Contact", accessor: (row) => row.contact },
    { header: "Gender", accessor: (row) => row.gender },
    { header: "Registered At", accessor: (row) => row.registeredAt },
  ];

  // Sample table data
  const tableData: TableData[] = [
    {
      name: "John Doe",
      contact: "+91 9876543210",
      gender: "Male",
      registeredAt: "1990-05-15",
    },
    {
      name: "Jane Smith",
      contact: "+91 8765432109",
      gender: "Female",
      registeredAt: "1985-08-22",
    },
    {
      name: "Mike Johnson",
      contact: "+91 7654321098",
      gender: "Male",
      registeredAt: "1992-11-30",
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Top Metrics Cards */}
        <DashboardCards stats={stats} />

        {/* Charts & Calendar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DashboardChart title="Clinic Performance Overview" data={[]} />
          <DashboardCalendar
            title="Upcoming Appointments"
            appointmentDates={[]}
          />
        </div>

        {/* Recent Activities Table */}
        <ReusableTable
          title="Recently Registered Patients"
          columns={columns}
          data={tableData}
        />
      </div>
    </DashboardLayout>
  );
}
