"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  CalendarIcon,
  Clock,
  MessageCircle,
  User,
  Loader2,
  AlertCircle,
  X,
  CalendarDays,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { formatForInput } from "@/app/utils/dateUtils";
import { useAppDispatch, useAppSelector } from "@/app/redux/store/hooks";
import {
  selectBookedSlots,
  fetchAvailability,
  createAppointment,
  Appointment,
} from "@/app/redux/slices/appointmentSlice";
import { selectProfile } from "@/app/redux/slices/profileSlice";
import { useSession } from "next-auth/react";
import type { ConsultationType, AppointmentStatus } from "@/app/redux/slices/appointmentSlice";
import type { DoctorProfile } from "@/app/redux/slices/profileSlice";

export const timeSlots = [
  "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
  "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM",
];

interface CreateFollowUpModalFormProps {
  patientId: string;
  patientName: string;
  patientContact?: string;
  patientAppointments: Appointment[];
  onClose: () => void;
  onSuccess: () => void;
}

interface AppointmentFormState {
  appointmentDate: Date;
  notes: string;
  timeSlot: string;
  treatments: string[];
  teeth: string[];
}

const CreateFollowUpModalForm: React.FC<CreateFollowUpModalFormProps> = ({
  patientId,
  patientName,
  patientContact,
  patientAppointments,
  onClose,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const { data: session } = useSession();
  const doctorId = session?.user?.id;

  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>("");
  const [formData, setFormData] = useState<AppointmentFormState>({
    appointmentDate: new Date(),
    notes: "",
    timeSlot: "",
    treatments: [],
    teeth: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  const bookedSlots = useAppSelector(selectBookedSlots);
  const profile = useAppSelector(selectProfile);

  const currentDoctor = useMemo(() => {
    if (profile && typeof profile === 'object' && '_id' in profile) {
      const doctorProfile = profile as DoctorProfile;
      if (doctorProfile._id && doctorProfile.fullName) {
        return {
          _id: doctorProfile._id,
          fullName: doctorProfile.fullName,
          specialization: doctorProfile.specialization,
        };
      }
    }
    if (doctorId) {
      return {
        _id: doctorId,
        fullName: '',
        specialization: '',
      };
    }
    return null;
  }, [profile, doctorId]);

  // Fetch availability when doctor or date changes
  useEffect(() => {
    if (currentDoctor?._id && formData.appointmentDate) {
      setAvailabilityLoading(true);
      const formattedDate = formatForInput(formData.appointmentDate);
      
      dispatch(fetchAvailability({
        doctorId: currentDoctor._id,
        date: formattedDate,
      })).then(() => {
        setAvailabilityLoading(false);
      }).catch(() => {
        setAvailabilityLoading(false);
      });
    }
  }, [currentDoctor?._id, formData.appointmentDate, dispatch]);

  // Sort appointments by date (most recent first)
  const sortedAppointments = useMemo(() => {
    return [...patientAppointments].sort((a, b) => {
      return new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime();
    });
  }, [patientAppointments]);

  // Format appointment label for dropdown
  const formatAppointmentLabel = (appointment: Appointment): string => {
    const dateStr = new Date(appointment.appointmentDate).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const timeStr = appointment.timeSlot || "";
    const statusStr = appointment.status || "";
    const treatmentsStr = appointment.treatments?.join(", ") || "No treatments";
    
    return `${dateStr}, ${timeStr} | ${statusStr} | ${treatmentsStr}`;
  };

  const availableSlots = useMemo(() => {
    const slots = Array.isArray(bookedSlots) ? bookedSlots : [];
    return timeSlots.map((slot) => ({
      time: slot,
      booked: slots.includes(slot),
    }));
  }, [bookedSlots]);

  // Handle appointment selection
  const handleAppointmentSelect = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
    const selected = patientAppointments.find(apt => apt._id === appointmentId);
    if (selected) {
      setFormData({
        appointmentDate: new Date(), // Reset to today for the new follow-up
        notes: selected.notes || "",
        timeSlot: selected.timeSlot || "",
        treatments: selected.treatments || [],
        teeth: selected.teeth || [],
      });
    }
  };

  const handleTimeSlotSelect = (slot: string) => {
    setFormData((prev) => ({ ...prev, timeSlot: slot }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointmentId) {
      setErrorMessage("Please select an appointment to create follow-up from");
      return;
    }
    if (!formData.timeSlot) {
      setErrorMessage("Please select a time slot");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        doctor: doctorId,
        patient: patientId,
        appointmentDate: formatForInput(formData.appointmentDate),
        status: "Scheduled" as AppointmentStatus,
        consultationType: "Follow-up" as ConsultationType,
        timeSlot: formData.timeSlot,
        treatments: formData.treatments,
        teeth: formData.teeth,
        notes: formData.notes,
        createdBy: doctorId,
      };

      const result = await dispatch(createAppointment(payload));
      if (createAppointment.fulfilled.match(result)) {
        // Send SMS asynchronously (fire and forget)
        if (patientContact) {
          try {
            const smsPayload = {
              phoneNumber: `+91${patientContact}`,
              message: `Your follow-up appointment is confirmed for ${format(
                formData.appointmentDate,
                "MMM dd, yyyy 'at' hh:mm a"
              )}. Clinic: EndoSmile Dental Care, Iteda, Greater Noida(W)`,
            };
            await fetch("/api/sms/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(smsPayload),
            });
          } catch (smsError) {
            console.error("SMS failed:", smsError);
          }
        }
        onSuccess();
        onClose();
      } else {
        setErrorMessage("Failed to create follow-up appointment. Please try again.");
      }
    } catch (error) {
      setErrorMessage("Error creating follow-up appointment. Please try again.");
      console.error("Follow-up appointment creation error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Disable background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-labelledby="create-followup-title"
      className="fixed z-50 inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-all duration-300"
    >
      <div className="relative bg-card border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-500/10 to-transparent border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-500/10 rounded-full">
                <CalendarDays className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <h2 id="create-followup-title" className="text-2xl font-bold text-foreground">
                  Create Follow-Up
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Schedule a follow-up appointment based on a previous visit
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted transition-colors duration-200"
              aria-label="Close modal"
            >
              <X className="h-6 w-6 text-foreground" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Patient Info Display */}
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg flex items-center gap-3">
              <User className="w-5 h-5 text-purple-600" />
              <div>
                <p className="font-medium text-purple-800 dark:text-purple-200">{patientName}</p>
                <p className="text-sm text-purple-600 dark:text-purple-300">ID: {patientId.slice(-6)}</p>
              </div>
            </div>

            {/* Appointment Selection */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-foreground">
                <FileText className="h-4 w-4" />
                <span>Select Previous Appointment</span>
              </label>
              <Select
                value={selectedAppointmentId}
                onValueChange={handleAppointmentSelect}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose an appointment to use as template..." />
                </SelectTrigger>
                <SelectContent>
                  {sortedAppointments.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No appointments found
                    </SelectItem>
                  ) : (
                    sortedAppointments.map((appointment) => (
                      <SelectItem key={appointment._id} value={appointment._id}>
                        {formatAppointmentLabel(appointment)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedAppointmentId && (
                <p className="text-xs text-muted-foreground mt-1">
                  Treatments, teeth, and notes will be copied from the selected appointment
                </p>
              )}
            </div>

            {/* Date & Time Selection */}
            {selectedAppointmentId && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date Selection */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-medium text-foreground">
                    <CalendarIcon className="h-4 w-4" />
                    <span>Follow-Up Date</span>
                  </label>
                  <div className="relative">
                    <Calendar
                      mode="single"
                      selected={formData.appointmentDate}
                      onSelect={(date) => {
                        if (date) setFormData((prev) => ({ ...prev, appointmentDate: date }));
                      }}
                      disabled={{ before: new Date() }}
                      className="rounded-md border p-3"
                    />
                  </div>
                </div>

                {/* Time Slot Selection */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-medium text-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Time Slot</span>
                  </label>
                  {availabilityLoading && (
                    <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Loading slots...
                    </div>
                  )}
                  <div 
                    className="grid grid-cols-3 gap-2 overflow-y-auto"
                    style={{ maxHeight: '300px' }}
                  >
                    {availableSlots.map(({ time, booked }) => (
                      <Button
                        key={time}
                        type="button"
                        variant={formData.timeSlot === time ? "default" : "outline"}
                        disabled={booked}
                        onClick={() => handleTimeSlotSelect(time)}
                        className={`h-8 text-xs ${
                          booked ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Treatments & Teeth Display (Read-only) */}
            {selectedAppointmentId && formData.treatments.length > 0 && (
              <div className="border-t border-border pt-6">
                <div className="flex items-center space-x-3 mb-4">
                  <MessageCircle className="h-5 w-5 text-purple-500" />
                  <h3 className="text-lg font-semibold text-foreground">Copied from Selected Appointment</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Treatments */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Treatments</label>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-foreground">
                        {formData.treatments.join(", ")}
                      </p>
                    </div>
                  </div>

                  {/* Teeth Selection */}
                  {formData.teeth.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Teeth</label>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm text-foreground">
                          {formData.teeth.join(", ")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedAppointmentId && (
              <div className="border-t border-border pt-6">
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-medium text-foreground">
                    <span>Notes (Editable)</span>
                  </label>
                  <textarea
                    className="w-full px-4 py-3 border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Add or modify notes for the follow-up..."
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                {errorMessage}
              </div>
            )}
          </form>
        </div>

        {/* Modal Footer */}
        <div className="bg-muted/50 border-t border-border p-6">
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 text-foreground bg-muted rounded-lg hover:bg-muted/80 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedAppointmentId}
              onClick={handleSubmit}
              className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span>Create Follow-Up</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateFollowUpModalForm;