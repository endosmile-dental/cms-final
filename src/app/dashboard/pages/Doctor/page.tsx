"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/app/dashboard/layout/DashboardLayout";
import DashboardCards, { Stat } from "@/app/dashboard/ui/DashboardCards";
import DashboardChart from "@/app/dashboard/ui/DashboardChart";
import DashboardCalendar from "@/app/dashboard/ui/DashboardCalendar";
import DashboardTable from "@/app/dashboard/ui/DashboardTable";
import { Syringe, User, Clock, AlertTriangle } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/redux/store/hooks";
import { fetchPatients, selectPatients } from "@/app/redux/slices/patientSlice";

// Redux hooks and patient slice

export default function DoctorDashboard() {
  const dispatch = useAppDispatch();
  const patients = useAppSelector(selectPatients);
  const [tableData, setTableData] = useState<
    {
      patient: string;
      contact: string;
      gender: "Male" | "Female" | "Other";
      dob: string;
    }[]
  >([]);
  useEffect(() => {
    // Dispatch the thunk to fetch all patients when the component mounts
    dispatch(fetchPatients());
  }, [dispatch]);

  useEffect(() => {
    if (patients) {
      console.log(patients);
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
      };

      // For demonstration, map the patients to a table data format.
      // Map patients to table data after sorting by 'createdAt' descending
      // Clone the patients array, then sort it in descending order by 'createdAt', then map it to your table data format.
      const patientsTableData = [...patients]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .map((patient) => ({
          patient: patient.fullName,
          contact: patient.contactNumber,
          gender: patient.gender,
          dob: new Date(patient.dateOfBirth).toLocaleDateString(
            "en-US",
            options
          ),
        }));
      setTableData(patientsTableData);
    }
  }, [patients]);

  // Update your statistics dynamically (example: total patients count)
  const stats: Stat[] = [
    {
      title: "Total Patients",
      value: patients?.length?.toString() || "N/A",
      icon: <User size={24} />,
      color: "bg-green-500",
    },
    {
      title: "Total Appointments",
      value: "45", // Could be dynamic if you fetch appointments too
      icon: <Syringe size={24} />,
      color: "bg-blue-500",
    },
    {
      title: "Upcoming Follow-ups",
      value: "5",
      icon: <Clock size={24} />,
      color: "bg-orange-500",
    },
    {
      title: "Pending Consultations",
      value: "2",
      icon: <AlertTriangle size={24} />,
      color: "bg-red-500",
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Medical Practice Metrics */}
        <DashboardCards stats={stats} />

        {/* Analytics & Schedule */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DashboardChart />
          <DashboardCalendar />
        </div>

        {/* Recent Appointments Table */}
        <DashboardTable data={tableData} />
      </div>
    </DashboardLayout>
  );
}
