"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { useAppSelector, useAppDispatch } from "@/app/redux/store/hooks";
import { createAppointment } from "@/app/redux/slices/appointmentSlice";
import { useSession } from "next-auth/react";
import { ProfileData } from "../redux/slices/profileSlice";

interface AppointmentBookingFromPatientProps {
  onClose: () => void;
}

export default function AppointmentBookingFromPatient({
  onClose,
}: AppointmentBookingFromPatientProps) {
  const dispatch = useAppDispatch();
  const doctors = useAppSelector((state) => state.doctors.doctors || []);
  const { data: session } = useSession();
  const profile = useAppSelector(
    (state) => state.profile.profile as ProfileData
  );

  const [formData, setFormData] = useState({
    doctorId: "",
    appointmentDate: new Date(),
    notes: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) {
      alert("Please login to book an appointment.");
      return;
    }

    const appointmentData = {
      doctor: formData.doctorId, // Doctor's user ID
      patient: profile?._id, // Fetch logged-in user's ID
      appointmentDate: new Date(formData.appointmentDate).toISOString(), // Ensure it's in the correct format
      status: "Scheduled" as const, // Fix: Use 'as const' to infer the literal type
      consultationType: "New" as const, // Fix: Use 'as const' to infer the literal type
      notes: formData.notes,
      createdBy: session?.user.id,
    };

    try {
      console.log(appointmentData);

      await dispatch(createAppointment(appointmentData)).unwrap();
      console.log("Appointment successfully booked!");
      onClose(); // Close the modal after success
    } catch (error) {
      console.error("Failed to book appointment:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="doctorId">Select Doctor</Label>
        <Select
          name="doctorId"
          value={formData.doctorId}
          onValueChange={(value) =>
            setFormData({ ...formData, doctorId: value })
          }
          required
        >
          <SelectTrigger id="doctorId">
            <SelectValue placeholder="Select a doctor" />
          </SelectTrigger>
          <SelectContent>
            {doctors.length === 0 ? (
              <SelectItem value="">No doctors available</SelectItem>
            ) : (
              doctors.map((doctor) => (
                <SelectItem key={doctor.userId} value={doctor.userId}>
                  {doctor.fullName}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Appointment Date</Label>
        <Calendar
          mode="single"
          selected={formData.appointmentDate}
          onSelect={(date: Date | undefined) => {
            if (date) {
              setFormData({ ...formData, appointmentDate: date });
            }
          }}
        />
      </div>

      <div>
        <Label htmlFor="notes">Notes for Appointment</Label>
        <Input
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          required
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Book Appointment</Button>
      </div>
    </form>
  );
}
