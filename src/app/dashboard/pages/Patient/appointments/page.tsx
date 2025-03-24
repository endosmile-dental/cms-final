"use client";

import React, { useMemo, useState, useEffect } from "react";
import { ArrowUpDown } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/app/redux/store/hooks";
import { selectAppointments } from "@/app/redux/slices/appointmentSlice";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import AppointmentBookingFromPatient from "@/app/components/AppointmentBookingFromPatient";
import { DialogDescription } from "@radix-ui/react-dialog";
import DashboardLayout from "@/app/dashboard/layout/DashboardLayout";
import ReusableTable, {
  ColumnDefinition,
} from "@/app/dashboard/ui/DashboardTable";
import { fetchProfile, ProfileData } from "@/app/redux/slices/profileSlice";
import { useSession } from "next-auth/react";

interface TableData {
  doctorName: string;
  patientName: string;
  appointmentDate: string;
  status: string;
}

export default function AppointmentsPage() {
  const dispatch = useAppDispatch();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("asc");
  const [searchQuery, setSearchQuery] = useState("");

  const appointments = useAppSelector(selectAppointments);
  const { data: session } = useSession();

  const profile = useAppSelector(
    (state) => state.profile.profile as ProfileData
  );

  const doctorsState = useAppSelector((state) => state.doctors);
  const doctors = useMemo(
    () => doctorsState.doctors || [],
    [doctorsState.doctors]
  );

  // Fetch profile if not available
  useEffect(() => {
    if (!profile && session?.user.id && session?.user.role) {
      dispatch(
        fetchProfile({ userId: session.user.id, role: session.user.role })
      );
    }
  }, [profile, session?.user.id, session?.user.role, dispatch]);

  // Transform appointments into table data, looking up doctor and patient names
  const tableData: TableData[] = useMemo(() => {
    return appointments.map((appointment) => {
      const doctor = doctors.find((doc) => doc._id === appointment.doctor);
      return {
        doctorName: doctor ? doctor.fullName : "N/A",
        patientName:
          appointment.patient === profile?._id
            ? profile?.fullName || "N/A"
            : "N/A",
        appointmentDate: appointment.appointmentDate,
        status: appointment.status,
      };
    });
  }, [appointments, doctors, profile]);

  // Apply filter, search, and sorting
  const filteredData = useMemo(() => {
    return tableData
      .filter((data) =>
        statusFilter !== "all"
          ? data.status.toLowerCase() === statusFilter
          : true
      )
      .filter((data) => {
        if (!searchQuery.trim()) return true;
        const formattedDate = new Date(
          data.appointmentDate
        ).toLocaleDateString();
        const query = searchQuery.toLowerCase();
        return (
          data.doctorName.toLowerCase().includes(query) ||
          data.patientName.toLowerCase().includes(query) ||
          formattedDate.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        const aTime = new Date(a.appointmentDate).getTime();
        const bTime = new Date(b.appointmentDate).getTime();
        return sortOrder === "asc" ? aTime - bTime : bTime - aTime;
      });
  }, [tableData, statusFilter, sortOrder, searchQuery]);

  if (!profile) {
    return <div>Loading profile...</div>;
  }

  const columns: ColumnDefinition<TableData>[] = [
    { header: "Doctor", accessor: (row) => row.doctorName },
    { header: "Patient", accessor: (row) => row.patientName },
    {
      header: "Date",
      accessor: (row) => new Date(row.appointmentDate).toLocaleDateString(),
    },
    {
      header: "Status",
      accessor: (row) => (
        <span className={`badge ${row.status.toLowerCase()}`}>
          {row.status}
        </span>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <header className="flex flex-col sm:flex-row justify-between items-center">
          <h1 className="text-2xl font-bold">Appointments</h1>
          <div className="flex flex-wrap gap-4 items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search appointments..."
              className="p-2 border rounded"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="all">All</option>
              <option value="scheduled">Scheduled</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
            <button
              className="p-2 border rounded bg-gray-200 hover:bg-gray-300"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              <ArrowUpDown size={18} />
            </button>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600"
              onClick={() => setIsDialogOpen(true)}
            >
              Book Now
            </button>
          </div>
        </header>

        <ReusableTable<TableData>
          title="Appointments List"
          columns={columns}
          data={filteredData}
        />

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogTitle>Book an Appointment</DialogTitle>
            <DialogDescription>
              Select a doctor and a date for your appointment.
            </DialogDescription>
            <AppointmentBookingFromPatient
              onClose={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
