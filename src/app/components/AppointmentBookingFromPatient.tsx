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
import { format } from "date-fns";
import { PreviewDialog } from "./PreviewDialog";

interface AppointmentBookingFromPatientProps {
  onClose: () => void;
}

export const timeSlots = [
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "06:00 PM",
  "06:30 PM",
  "07:00 PM",
  "07:30 PM",
  "08:00 PM",
  "08:30 PM",
];

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
    timeSlot: "",
    notes: "",
  });

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [modalError, setModalError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePreview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) {
      alert("Please login to book an appointment.");
      return;
    }
    if (!formData.doctorId || !formData.timeSlot || !formData.appointmentDate) {
      alert("Please fill all required fields.");
      return;
    }
    setShowPreviewModal(true);
  };

  const handleConfirm = async () => {
    const appointmentData = {
      doctor: formData.doctorId,
      patient: profile?._id,
      appointmentDate: new Date(formData.appointmentDate).toISOString(),
      timeSlot: formData.timeSlot,
      status: "Scheduled" as const,
      consultationType: "New" as const,
      notes: formData.notes,
      createdBy: session?.user.id,
    };

    try {
      await dispatch(createAppointment(appointmentData)).unwrap();
      console.log("Appointment successfully booked!");
      setShowPreviewModal(false);
      onClose();
    } catch (error) {
      console.error("Failed to book appointment:", error);
      setModalError("Booking failed. Please try again.");
    }
  };

  return (
    <>
      <form onSubmit={handlePreview} className="space-y-4">
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
          <Label>Time Slot</Label>
          <Select
            value={formData.timeSlot}
            onValueChange={(value) =>
              setFormData({ ...formData, timeSlot: value })
            }
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a time slot" />
            </SelectTrigger>
            <SelectContent>
              {timeSlots.map((slot) => (
                <SelectItem key={slot} value={slot}>
                  {slot}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="notes">Notes for Appointment</Label>
          <Input
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Preview Appointment</Button>
        </div>
      </form>

      <PreviewDialog
        open={showPreviewModal}
        onOpenChange={(open) => {
          if (!open) setModalError("");
          setShowPreviewModal(open);
        }}
        onConfirm={handleConfirm}
        isLoading={false}
        error={modalError}
        title="Appointment Preview"
        description="Please review the appointment details before confirming"
        confirmButtonText="Confirm Appointment"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Appointment Details</h3>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-muted-foreground">Date</dt>
                <dd>
                  {formData?.appointmentDate &&
                    format(formData.appointmentDate, "PPP")}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Time Slot</dt>
                <dd>{formData.timeSlot || "-"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">
                  Consultation Type
                </dt>
                <dd>New</dd>
              </div>
            </dl>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Notes</h3>
            <p className="text-muted-foreground text-sm">
              {formData.notes || "None"}
            </p>
          </div>
        </div>
      </PreviewDialog>
    </>
  );
}
