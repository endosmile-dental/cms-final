"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/app/dashboard/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Import shadcn/ui Card components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Import shadcn/ui Table components
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Calendar, Edit, Trash } from "lucide-react";

export type Appointment = {
  id: string;
  patientName: string;
  appointmentDate: string; // ISO date string, e.g. "2025-02-10"
  time: string; // e.g. "10:00 AM"
  type: string; // e.g. "Consultation", "Follow-up", etc.
  status: "Pending" | "Completed" | "Cancelled";
};

export default function DoctorAppointments() {
  // State for appointments (replace with real API calls in production)
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  // State for search input
  const [search, setSearch] = useState("");

  // Simulate fetching appointments on mount.
  // For demonstration, we include both upcoming and past appointments.
  useEffect(() => {
    const dummyAppointments: Appointment[] = [
      {
        id: "1",
        patientName: "John Doe",
        appointmentDate: "2025-02-10", // upcoming
        time: "10:00 AM",
        type: "Consultation",
        status: "Pending",
      },
      {
        id: "2",
        patientName: "Jane Smith",
        appointmentDate: "2025-02-11", // upcoming
        time: "11:30 AM",
        type: "Follow-up",
        status: "Completed",
      },
      {
        id: "3",
        patientName: "Bob Johnson",
        appointmentDate: "2023-10-05", // past
        time: "02:00 PM",
        type: "Check-up",
        status: "Cancelled",
      },
      {
        id: "4",
        patientName: "Alice Brown",
        appointmentDate: "2023-09-30", // past
        time: "09:00 AM",
        type: "Consultation",
        status: "Completed",
      },
    ];
    setAppointments(dummyAppointments);
  }, []);

  // Filter appointments based on search (by patient name or appointment ID)
  const filteredAppointments = appointments.filter(
    (appointment) =>
      appointment.patientName.toLowerCase().includes(search.toLowerCase()) ||
      appointment.id.includes(search)
  );

  // Get today's date (using local date)
  const today = new Date();

  // Split filtered appointments into upcoming and past appointments.
  const upcomingAppointments = filteredAppointments.filter((appointment) => {
    // Create a Date object from the appointment date.
    const appointmentDate = new Date(appointment.appointmentDate);
    // Include appointments that are today or in the future.
    return appointmentDate >= today;
  });

  const pastAppointments = filteredAppointments.filter((appointment) => {
    const appointmentDate = new Date(appointment.appointmentDate);
    // Include appointments that are before today.
    return appointmentDate < today;
  });

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Top Section: Page Title and Search/Filter Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center">
          <h1 className="text-3xl font-bold">Appointments</h1>
          <div className="flex items-center space-x-2 mt-4 md:mt-0">
            <Input
              type="text"
              placeholder="Search appointments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-64"
            />
            <Button variant="outline">
              <Calendar size={16} className="mr-2" />
              Filter
            </Button>
          </div>
        </div>

        <Separator />

        {/* Upcoming Appointments Card */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/12">ID</TableHead>
                    <TableHead className="w-3/12">Patient Name</TableHead>
                    <TableHead className="w-2/12">Date</TableHead>
                    <TableHead className="w-2/12">Time</TableHead>
                    <TableHead className="w-2/12">Type</TableHead>
                    <TableHead className="w-1/12">Status</TableHead>
                    <TableHead className="w-1/12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingAppointments.length > 0 ? (
                    upcomingAppointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>{appointment.id}</TableCell>
                        <TableCell>{appointment.patientName}</TableCell>
                        <TableCell>{appointment.appointmentDate}</TableCell>
                        <TableCell>{appointment.time}</TableCell>
                        <TableCell>{appointment.type}</TableCell>
                        <TableCell>{appointment.status}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">
                              <Edit size={16} />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        No upcoming appointments found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                <TableCaption>
                  {upcomingAppointments.length} upcoming appointment
                  {upcomingAppointments.length !== 1 && "s"} found.
                </TableCaption>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Previous (Past) Appointments Card */}
        <Card>
          <CardHeader>
            <CardTitle>Past Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/12">ID</TableHead>
                    <TableHead className="w-3/12">Patient Name</TableHead>
                    <TableHead className="w-2/12">Date</TableHead>
                    <TableHead className="w-2/12">Time</TableHead>
                    <TableHead className="w-2/12">Type</TableHead>
                    <TableHead className="w-1/12">Status</TableHead>
                    <TableHead className="w-1/12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pastAppointments.length > 0 ? (
                    pastAppointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>{appointment.id}</TableCell>
                        <TableCell>{appointment.patientName}</TableCell>
                        <TableCell>{appointment.appointmentDate}</TableCell>
                        <TableCell>{appointment.time}</TableCell>
                        <TableCell>{appointment.type}</TableCell>
                        <TableCell>{appointment.status}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">
                              <Edit size={16} />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        No past appointments found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                <TableCaption>
                  {pastAppointments.length} past appointment
                  {pastAppointments.length !== 1 && "s"} found.
                </TableCaption>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
