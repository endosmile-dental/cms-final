"use client";

import React, { useState } from "react";
import DashboardLayout from "@/app/dashboard/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { BookPlus, Edit, Trash } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useAppSelector } from "@/app/redux/store/hooks";
import {
  Appointment,
  selectAppointments,
} from "@/app/redux/slices/appointmentSlice";
import { selectPatients } from "@/app/redux/slices/patientSlice";
import ReusableTable, {
  ColumnDefinition,
} from "@/app/dashboard/ui/DashboardTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TransformedAppointment {
  patientId: string;
  patientName: string;
  date: string;
  contactNumber: string;
  consultationType: "New" | "Follow-up";
  status: "Scheduled" | "Completed" | "Cancelled";
}

export default function DoctorAppointments() {
  const appointments = useAppSelector(selectAppointments);
  const patients = useAppSelector(selectPatients);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);

  const getPatientInfo = (patientId: string) => {
    return patients.find((p) => p._id === patientId) || null;
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const patientInfo = getPatientInfo(appointment.patient);
    const patientName = patientInfo ? patientInfo.fullName.toLowerCase() : "";

    const matchesSearch =
      patientName.includes(search.toLowerCase()) ||
      appointment._id.includes(search) ||
      appointment.consultationType
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      appointment.status.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = filterStatus
      ? appointment.status === filterStatus
      : true;
    const matchesType = filterType
      ? appointment.consultationType === filterType
      : true;

    return matchesSearch && matchesStatus && matchesType;
  });

  const today = new Date();
  const upcomingAppointments = filteredAppointments.filter(
    (appointment) => new Date(appointment.appointmentDate) >= today
  );
  const pastAppointments = filteredAppointments.filter(
    (appointment) => new Date(appointment.appointmentDate) < today
  );

  const transformData = (
    appointments: Appointment[]
  ): TransformedAppointment[] => {
    return appointments.map((appointment) => {
      const patientInfo = getPatientInfo(appointment.patient);
      return {
        patientId: patientInfo?.PatientId || "NA",
        patientName: patientInfo?.fullName || "NA",
        date: format(new Date(appointment.appointmentDate), "yyyy-MM-dd"),
        contactNumber: patientInfo?.contactNumber || "NA",
        consultationType: appointment.consultationType,
        status: appointment.status,
      };
    });
  };

  const columns: ColumnDefinition<TransformedAppointment>[] = [
    { header: "ID", accessor: (row) => row.patientId },
    { header: "Patient", accessor: (row) => row.patientName },
    { header: "Date", accessor: (row) => row.date },
    { header: "Contact", accessor: (row) => row.contactNumber },
    { header: "Type", accessor: (row) => row.consultationType },
    { header: "Status", accessor: (row) => row.status },
    {
      header: "Actions",
      accessor: () => (
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm">
            <Edit size={16} />
          </Button>
          <Button variant="ghost" size="sm">
            <Trash size={16} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <h1 className="text-3xl font-bold">Appointments</h1>

          {/* Filters & Search */}
          <div className="flex flex-1 flex-wrap items-center gap-2 justify-center md:justify-end mt-4 md:mt-0">
            <Link href="/dashboard/pages/Doctor/appointments/bookAppointment">
              <Button variant="default" className="w-full sm:w-auto">
                <BookPlus size={16} className="mr-2" />
                Add New
              </Button>
            </Link>

            <Input
              type="text"
              placeholder="Search appointments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64"
            />

            <Select
              onValueChange={(value) =>
                setFilterStatus(value !== "all" ? value : null)
              }
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Scheduled">Scheduled</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select
              onValueChange={(value) =>
                setFilterType(value !== "all" ? value : null)
              }
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Follow-up">Follow-up</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Upcoming Appointments */}
        <ReusableTable
          title="Upcoming Appointments"
          data={transformData(upcomingAppointments)}
          columns={columns}
          emptyMessage="No upcoming appointments found."
        />

        {/* Past Appointments */}
        <ReusableTable
          title="Past Appointments"
          data={transformData(pastAppointments)}
          columns={columns}
          emptyMessage="No past appointments found."
        />
      </div>
    </DashboardLayout>
  );
}
