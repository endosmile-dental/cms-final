"use client";

import React, { useEffect } from "react";
import { Calendar, Clock, FileText} from "lucide-react";
import DashboardLayout from "../../layout/DashboardLayout";
import DashboardCards, { Stat } from "../../ui/DashboardCards";
import DashboardChart from "../../ui/DashboardChart";
import DashboardCalendar from "../../ui/DashboardCalendar";
import ReusableTable, { ColumnDefinition } from "../../ui/DashboardTable";
import { useAppSelector } from "@/app/redux/store/hooks";
import { selectBillings } from "@/app/redux/slices/billingSlice";
import { selectAppointments } from "@/app/redux/slices/appointmentSlice";
import { ProfileData } from "@/app/redux/slices/profileSlice";

// You might have enterprise-level data fetching and error handling here.
export default function PatientDashboard() {
  const billings = useAppSelector(selectBillings);
  const appointments = useAppSelector(selectAppointments);
  const profile = useAppSelector((state) => {
    return state?.profile?.profile as ProfileData;
  });

  // Define interface for table data
  interface TableData {
    physician: string;
    contact: string;
    gender: string;
    appointmentDate: string;
  }

  // Define the column structure for the table
  const columns: ColumnDefinition<TableData>[] = [
    { header: "Physician", accessor: (row) => row.physician },
    { header: "Contact", accessor: (row) => row.contact },
    { header: "Gender", accessor: (row) => row.gender },
    { header: "Appointment Date", accessor: (row) => row.appointmentDate },
  ];

  // Define patient-specific stats (replace sample values with real-time data)
  const stats: Stat[] = [
    {
      title: "Upcoming Appointments",
      value: "2",
      icon: <Clock size={24} color="white" />,
      color: "bg-blue-600",
      LinkURL: "/dashboard/pages/Patient/appointments",
    },
    {
      title: "Medical Records",
      value: "15",
      icon: <FileText size={24} color="white" />,
      color: "bg-green-600",
      LinkURL: "/dashboard/pages/Patient/records",
    },
    {
      title: "Next Checkup",
      value: "2025-04-20",
      icon: <Calendar size={24} color="white" />,
      color: "bg-orange-600",
      LinkURL: "/dashboard/pages/Patient/appointments",
    },
  ];

  // Define sample table data (this should come from your backend)
  const tableData: TableData[] = [
    {
      physician: "Dr. John Doe",
      contact: "+91 9876543210",
      gender: "Male",
      appointmentDate: "2025-04-20",
    },
    {
      physician: "Dr. Jane Smith",
      contact: "+91 8765432109",
      gender: "Female",
      appointmentDate: "2025-05-15",
    },
    {
      physician: "Dr. Mike Johnson",
      contact: "+91 7654321098",
      gender: "Male",
      appointmentDate: "2025-06-10",
    },
  ];

  useEffect(() => {
    console.log("billings", billings);
    console.log("appointments", appointments);
    console.log("profile", profile);
  }, [billings, appointments, profile]);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-8">
        {/* Enterprise Dashboard Header */}
        <header className="flex flex-col sm:flex-row justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Patient Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome back! Here is an overview of your recent health metrics.
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            {/* Optional: Additional action buttons like “Book Appointment” */}
            <button className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">
              Book Appointment
            </button>
          </div>
        </header>

        {/* KPI Cards Section */}
        <section>
          <DashboardCards stats={stats} />
        </section>

        {/* Charts and Calendar Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DashboardChart
            title="Recent Health Trends"
            // Replace with actual health data for patients
            data={[]}
          />
          <DashboardCalendar
            title="Appointment Calendar"
            // Replace with actual appointment dates data
            appointmentDates={[]}
          />
        </section>

        {/* Detailed Table Section */}
        <section>
          <ReusableTable<TableData>
            title="Recent Appointments"
            columns={columns}
            data={tableData}
          />
        </section>

        {/* Optional: Additional sections for Medical History, Prescriptions, etc. */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Allergies & Reactions</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Penicillin - Hives, Anaphylaxis</li>
              <li>Shellfish - Swelling, Difficulty breathing</li>
              <li>Ibuprofen - Stomach irritation</li>
            </ul>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Recent Test Results</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Cholesterol (LDL):</span>
                <span className="font-medium">110 mg/dL (Normal)</span>
              </div>
              <div className="flex justify-between items-center">
                <span>HbA1c:</span>
                <span className="font-medium">5.8% (Prediabetic)</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Vitamin D:</span>
                <span className="font-medium">22 ng/mL (Low)</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
