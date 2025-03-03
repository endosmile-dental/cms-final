"use client";

import React, { useState } from "react";
import DashboardLayout from "@/app/dashboard/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { BookPlus, Calendar, Edit, Trash } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useAppSelector } from "@/app/redux/store/hooks";
import { selectAppointments } from "@/app/redux/slices/appointmentSlice";
import { selectPatients } from "@/app/redux/slices/patientSlice";

export default function DoctorAppointments() {
  const appointments = useAppSelector(selectAppointments);
  const patients = useAppSelector(selectPatients);

  // Local state for search input
  const [search, setSearch] = useState("");

  // Filter appointments based on search input (by patient name or appointment ID)
  const filteredAppointments = appointments.filter((appointment) => {
    // Look up the patient from the patients store.
    const patientInfo = patients.find((p) => p._id === appointment.patient);
    // Use the patient's full name if available.
    const patientName = patientInfo ? patientInfo.fullName : "";
    return (
      patientName.toLowerCase().includes(search.toLowerCase()) ||
      appointment._id.includes(search)
    );
  });

  // Get today's date
  const today = new Date();

  // Split appointments into upcoming and past appointments based on appointmentDate.
  const upcomingAppointments = filteredAppointments.filter((appointment) => {
    const appDate = new Date(appointment.appointmentDate);
    return appDate >= today;
  });

  const pastAppointments = filteredAppointments.filter((appointment) => {
    const appDate = new Date(appointment.appointmentDate);
    return appDate < today;
  });

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Top Section: Title, Add Button, Search & Filter */}
        <div className="flex flex-col md:flex-row justify-between items-center">
          <h1 className="text-3xl font-bold">Appointments</h1>
          <div className="flex items-center space-x-2 mt-4 md:mt-0">
            <Link href="/dashboard/pages/Doctor/appointments/bookAppointment">
              <Button variant="default">
                <BookPlus size={16} className="mr-2" />
                Add New
              </Button>
            </Link>
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

        {/* Upcoming Appointments */}
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
                    <TableHead className="w-3/12">Patient</TableHead>
                    <TableHead className="w-2/12">Date</TableHead>
                    <TableHead className="w-2/12">Time</TableHead>
                    <TableHead className="w-2/12">Type</TableHead>
                    <TableHead className="w-1/12">Status</TableHead>
                    <TableHead className="w-1/12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingAppointments.length > 0 ? (
                    upcomingAppointments.map((appointment) => {
                      const appDate = new Date(appointment.appointmentDate);
                      const dateStr = format(appDate, "yyyy-MM-dd");
                      const timeStr = format(appDate, "hh:mm a");
                      const patientInfo = patients.find(
                        (p) => p._id === appointment.patient
                      );
                      const displayName = patientInfo
                        ? `${patientInfo.fullName}`
                        : "Unknown Patient";
                      const patientId = patientInfo
                        ? `${patientInfo.PatientId}`
                        : "No Patient ID";
                      return (
                        <TableRow key={appointment._id}>
                          <TableCell>{patientId}</TableCell>
                          <TableCell>{displayName}</TableCell>
                          <TableCell>{dateStr}</TableCell>
                          <TableCell>{timeStr}</TableCell>
                          <TableCell>{appointment.consultationType}</TableCell>
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
                      );
                    })
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

        {/* Past Appointments */}
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
                    <TableHead className="w-3/12">Patient</TableHead>
                    <TableHead className="w-2/12">Date</TableHead>
                    <TableHead className="w-2/12">Time</TableHead>
                    <TableHead className="w-2/12">Type</TableHead>
                    <TableHead className="w-1/12">Status</TableHead>
                    <TableHead className="w-1/12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pastAppointments.length > 0 ? (
                    pastAppointments.map((appointment) => {
                      const appDate = new Date(appointment.appointmentDate);
                      const dateStr = format(appDate, "yyyy-MM-dd");
                      const timeStr = format(appDate, "hh:mm a");
                      const patientInfo = patients.find(
                        (p) => p._id === appointment.patient
                      );
                      const displayName = patientInfo
                        ? `${patientInfo.fullName} (${patientInfo.PatientId})`
                        : "Unknown Patient";
                      const patientId = patientInfo
                        ? `${patientInfo.PatientId}`
                        : "No Patient ID";
                      return (
                        <TableRow key={appointment._id}>
                          <TableCell>{patientId}</TableCell>
                          <TableCell>{displayName}</TableCell>
                          <TableCell>{dateStr}</TableCell>
                          <TableCell>{timeStr}</TableCell>
                          <TableCell>{appointment.consultationType}</TableCell>
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
                      );
                    })
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
