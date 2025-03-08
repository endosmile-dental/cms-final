"use client";

import { Calendar, Clock, FileText } from "lucide-react";
import DashboardLayout from "../../layout/DashboardLayout";
import DashboardCalendar from "../../ui/DashboardCalendar";
import DashboardCards, { Stat } from "../../ui/DashboardCards";
import DashboardChart from "../../ui/DashboardChart";
import ReusableTable, { ColumnDefinition } from "../../ui/DashboardTable";

export default function PatientDashboard() {
  // Define the interface for table data
  interface TableData {
    patient: string;
    contact: string;
    gender: string;
    registeredAt: string;
  }

  // Define the column structure for the table
  const columns: ColumnDefinition<TableData>[] = [
    { header: "Doctor Name", accessor: (row) => row.patient },
    { header: "Contact", accessor: (row) => row.contact },
    { header: "Gender", accessor: (row) => row.gender },
    { header: "Appointment Date", accessor: (row) => row.registeredAt },
  ];

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
        <ReusableTable
          title="Recent Appointments"
          columns={columns}
          data={tableData}
        />
      </div>
    </DashboardLayout>
  );
}
