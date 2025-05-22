"use client";
import React, { useEffect, useMemo, useState } from "react";
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
import {
  createAppointment,
  fetchAvailability,
} from "@/app/redux/slices/appointmentSlice";
import { useSession } from "next-auth/react";
import { ProfileData } from "../redux/slices/profileSlice";
import { format } from "date-fns";
import { PreviewDialog } from "./PreviewDialog";
import { selectBookedSlots } from "@/app/redux/slices/appointmentSlice"; // Updated import

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

interface AppointmentBookingFromPatientProps {
  onClose: () => void;
}

export default function AppointmentBookingFromPatient({
  onClose,
}: AppointmentBookingFromPatientProps) {
  const dispatch = useAppDispatch();
  const { data: session } = useSession();

  const doctors = useAppSelector((state) => state.doctors.doctors || []);
  const profile = useAppSelector(
    (state) => state.profile.profile as ProfileData
  );
  const bookedSlots = useAppSelector(selectBookedSlots); // Updated selector

  const [formData, setFormData] = useState({
    doctorId: "",
    appointmentDate: new Date(),
    timeSlot: "",
    notes: "",
  });

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [modalError, setModalError] = useState("");
  const [localLoading, setLocalLoading] = useState(false);

  const validDoctors = useMemo(
    () => doctors.filter((doc) => doc.userId?.trim() !== ""),
    [doctors]
  );

  const selectedDoctor = useMemo(
    () => validDoctors.find((doc) => doc.userId === formData.doctorId),
    [formData.doctorId, validDoctors]
  );

  useEffect(() => {
    if (selectedDoctor?._id && formData.appointmentDate) {
      setLocalLoading(true);
      dispatch(
        fetchAvailability({
          doctorId: selectedDoctor._id,
          date: format(formData.appointmentDate, "yyyy-MM-dd"),
        })
      )
        .unwrap()
        .catch(() => setModalError("Failed to fetch availability"))
        .finally(() => setLocalLoading(false));
    }
  }, [selectedDoctor?._id, formData.appointmentDate, dispatch]); // Added toISOString()

  useEffect(() => {
    setFormData((prev) => ({ ...prev, timeSlot: "" }));
  }, [formData.doctorId, formData.appointmentDate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePreview = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");

    if (!session?.user) {
      alert("Please login to book an appointment.");
      return;
    }

    if (!formData.doctorId || !formData.timeSlot || !formData.appointmentDate) {
      alert("Please fill all required fields.");
      return;
    }

    if (!selectedDoctor) {
      setModalError("Please select a valid doctor.");
      return;
    }

    setShowPreviewModal(true);
  };

  const handleConfirm = async () => {
    if (!selectedDoctor || !profile?._id) {
      setModalError("Missing required user/doctor information.");
      return;
    }

    const payload = {
      doctor: selectedDoctor._id,
      patient: profile._id,
      appointmentDate: formData.appointmentDate.toISOString(),
      timeSlot: formData.timeSlot,
      status: "Scheduled" as const,
      consultationType: "New" as const,
      notes: formData.notes,
      createdBy: session?.user.id,
    };

    try {
      await dispatch(createAppointment(payload)).unwrap();
      setShowPreviewModal(false);
      onClose();
    } catch (err) {
      console.error("Booking Error:", err);
      setModalError("Failed to book appointment. Please try again.");
    }
  };

  return (
    <>
      <form onSubmit={handlePreview} className="space-y-4">
        {/* Doctor Selection */}
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
              <SelectValue placeholder="Choose a doctor" />
            </SelectTrigger>
            <SelectContent>
              {validDoctors.length === 0 ? (
                <SelectItem value="no-doctors" disabled>
                  No doctors available
                </SelectItem>
              ) : (
                validDoctors.map((doc) => (
                  <SelectItem key={doc.userId} value={doc.userId}>
                    {doc.fullName}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Date Selection */}
        <div>
          <Label>Appointment Date</Label>
          <Calendar
            mode="single"
            selected={formData.appointmentDate}
            month={formData.appointmentDate}
            onSelect={(date) =>
              date &&
              setFormData((prev) => ({ ...prev, appointmentDate: date }))
            }
            disabled={(date) => date < new Date()}
          />
        </div>

        {/* Time Slot Selection */}
        <div>
          <Label>Time Slot</Label>
          <Select
            value={formData.timeSlot}
            onValueChange={(value) =>
              setFormData({ ...formData, timeSlot: value })
            }
            required
            disabled={!formData.doctorId || localLoading}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  localLoading ? "Checking availability..." : "Select time slot"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {localLoading ? (
                <SelectItem value="loading" disabled>
                  Checking availability...
                </SelectItem>
              ) : timeSlots.length === 0 ? (
                <SelectItem value="no-slots" disabled>
                  No time slots available
                </SelectItem>
              ) : (
                timeSlots.map((slot) => {
                  const isBooked = bookedSlots?.includes(slot);
                  return (
                    <SelectItem
                      key={slot}
                      value={slot}
                      disabled={isBooked}
                      className={isBooked ? "text-gray-400 line-through" : ""}
                    >
                      {slot} {isBooked && "(Booked)"}
                    </SelectItem>
                  );
                })
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Notes Input */}
        <div>
          <Label htmlFor="notes">Notes for Appointment</Label>
          <Input
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Optional"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Preview Appointment</Button>
        </div>
      </form>

      {/* Preview Modal */}
      <PreviewDialog
        open={showPreviewModal}
        onOpenChange={(open) => {
          setModalError("");
          setShowPreviewModal(open);
        }}
        onConfirm={handleConfirm}
        isLoading={false}
        error={modalError}
        title="Appointment Preview"
        description="Please review and confirm the appointment details."
        confirmButtonText="Confirm Appointment"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Appointment Details</h3>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Date</dt>
                <dd>{format(formData.appointmentDate, "PPP")}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Time Slot</dt>
                <dd>{formData.timeSlot}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Consultation Type</dt>
                <dd>New</dd>
              </div>
            </dl>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Notes</h3>
            <p className="text-sm text-muted-foreground">
              {formData.notes || "No notes provided."}
            </p>
          </div>
        </div>
      </PreviewDialog>
    </>
  );
}
