"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Calendar, Clock, FileText } from "lucide-react";
import DashboardLayout from "../../layout/DashboardLayout";
import DashboardCards, { Stat } from "../../ui/DashboardCards";
import DashboardChart from "../../ui/DashboardChart";
import DashboardCalendar, {
  AppointmentDateDetailed,
} from "../../ui/DashboardCalendar";
import ReusableTable, { ColumnDefinition } from "../../ui/DashboardTable";
import { useAppSelector } from "@/app/redux/store/hooks";
import { selectBillings } from "@/app/redux/slices/billingSlice";
import { selectAppointments } from "@/app/redux/slices/appointmentSlice";
import { ProfileData } from "@/app/redux/slices/profileSlice";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import AppointmentBookingFromPatient from "@/app/components/AppointmentBookingFromPatient";
import { DialogDescription } from "@radix-ui/react-dialog";
import { format } from "date-fns";

// Update DataPoint to match DashboardChart's expected type
interface DataPoint {
  month: string;
  users: number;
}

export default function PatientDashboard() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const billings = useAppSelector(selectBillings);
  const appointments = useAppSelector(selectAppointments);
  const profile = useAppSelector(
    (state) => state.profile.profile as ProfileData
  );
  // doctors slice structure is assumed to be { doctors: Doctor[], loading, error }
  const doctorsState = useAppSelector((state) => state.doctors);
  const doctorList = useMemo(
    () => doctorsState.doctors || [],
    [doctorsState.doctors]
  );

  // Calculate KPI values from data
  const upcomingAppointmentsCount = appointments.filter(
    (a) => new Date(a.appointmentDate) >= new Date()
  ).length;

  const totalBillings = billings.reduce(
    (sum, billing) => sum + billing.totalAmount,
    0
  );

  // For "Next Checkup", we pick the soonest upcoming appointment
  const sortedAppointments = [...appointments].sort(
    (a, b) =>
      new Date(a.appointmentDate).getTime() -
      new Date(b.appointmentDate).getTime()
  );
  const nextCheckup = sortedAppointments.find(
    (a) => new Date(a.appointmentDate) >= new Date()
  );

  // Define KPI stats
  const stats: Stat[] = [
    {
      title: "Upcoming Appointments",
      value: upcomingAppointmentsCount.toString(),
      icon: <Clock size={24} color="white" />,
      color: "bg-blue-600",
      LinkURL: "/dashboard/pages/Patient/appointments",
    },
    {
      title: "Total Billings",
      value: totalBillings.toString(),
      icon: <FileText size={24} color="white" />,
      color: "bg-green-600",
      LinkURL: "/dashboard/pages/Patient/billings",
    },
    {
      title: "Next Checkup",
      value: nextCheckup
        ? new Date(nextCheckup.appointmentDate).toLocaleDateString()
        : "N/A",
      icon: <Calendar size={24} color="white" />,
      color: "bg-orange-600",
      LinkURL: "/dashboard/pages/Patient/appointments",
    },
  ];

  // Define table data for appointments
  interface TableData {
    physician: string;
    contact: string;
    gender: string;
    appointmentDate: string;
  }

  // Define columns for the appointments table
  const columns: ColumnDefinition<TableData>[] = [
    { header: "Physician", accessor: (row) => row.physician },
    { header: "Contact", accessor: (row) => row.contact },
    { header: "Gender", accessor: (row) => row.gender },
    { header: "Appointment Date", accessor: (row) => row.appointmentDate },
  ];

  const appointmentDetails = useMemo(() => {
    const groupedAppointments: Record<string, AppointmentDateDetailed> = {};

    appointments.forEach((appointment) => {
      const date = new Date(appointment.appointmentDate);
      const dateKey = format(date, "yyyy-MM-dd");
      const doctor = doctorList.find((doc) => doc._id === appointment.doctor);

      if (!groupedAppointments[dateKey]) {
        groupedAppointments[dateKey] = {
          date: dateKey,
          count: 0,
          appointments: [],
        };
      }

      groupedAppointments[dateKey].count += 1;
      groupedAppointments[dateKey].appointments.push({
        patientName: doctor?.fullName || "Unknown Doctor", // Doctor's name for patient view
        timeSlot: format(date, "HH:mm"),
        treatments: appointment.treatments || [], // Adjust based on your data structure
        teeth: appointment.teeth || [], // Adjust based on your data structure
      });
    });

    return Object.values(groupedAppointments);
  }, [appointments, doctorList]);

  // Map appointments data and lookup corresponding doctor details
  const tableData: TableData[] = appointments.map((appointment) => {
    const doctor = doctorList.find(
      (doc) => doc._id.toString() === appointment.doctor
    );

    return {
      physician: doctor?.fullName || "N/A",
      contact: doctor?.contactNumber || "N/A",
      gender: doctor?.gender || "N/A",
      appointmentDate: new Date(
        appointment.appointmentDate
      ).toLocaleDateString(),
    };
  });

  // Convert appointments to chart data (group by month and count appointments)
  const appointmentCountsByMonth = appointments.reduce((acc, appointment) => {
    const month = new Date(appointment.appointmentDate).toLocaleString(
      "default",
      {
        month: "short",
      }
    );
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData: DataPoint[] = Object.entries(appointmentCountsByMonth).map(
    ([month, count]) => ({ month, users: count })
  );

  useEffect(() => {
    console.log("Billings", billings);
    console.log("Appointments", appointments);
    console.log("Profile", profile);
    console.log("Doctors", doctorList);
  }, [billings, appointments, profile, doctorList]);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-center">
          <div>
            {profile && (
              <h1 className="text-xl md:text-3xl font-bold text-gray-900">
                Welcome, {profile.fullName}!
              </h1>
            )}
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
              onClick={() => setIsDialogOpen(true)}
            >
              Book Appointment
            </button>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogTitle>Book an Appointment</DialogTitle>
              <DialogDescription id="dialog-description">
                Select a doctor and a date for your appointment.
              </DialogDescription>
              {/* Add appointment booking form here */}
              <AppointmentBookingFromPatient
                onClose={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </header>

        {/* KPI Cards Section */}
        <section>
          <DashboardCards stats={stats} />
        </section>

        {/* Charts and Calendar Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DashboardChart
            title="Recent Appointments"
            data={chartData} // Pass the transformed chart data here
          />
          <DashboardCalendar
            title="Appointment Calendar"
            appointmentDetails={appointmentDetails} // Pass formatted data
          />
        </section>

        {/* Detailed Appointments Table */}
        <section>
          <ReusableTable<TableData>
            title="Recent Appointments"
            columns={columns}
            data={tableData}
          />
        </section>

        {/* Billing Details Section */}
        <section>
          <h2 className="text-xl font-bold mb-4">Billing Details</h2>
          <div className="space-y-4">
            {billings.map((billing) => (
              <div key={billing._id} className="p-4 border rounded shadow">
                <p>
                  <strong>Invoice ID:</strong> {billing.invoiceId}
                </p>
                <p>
                  <strong>Status:</strong> {billing.status}
                </p>
                <p>
                  <strong>Total Amount:</strong> ₹{billing.totalAmount}
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(billing.date).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
