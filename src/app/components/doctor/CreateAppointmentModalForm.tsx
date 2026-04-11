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
import { MultiSelect } from "@/components/ui/multi-select";
import {
  CalendarIcon,
  Clock,
  Stethoscope,
  MessageCircle,
  User,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { formatDateForServer } from "@/app/utils/dateUtils";
import { useAppDispatch, useAppSelector } from "@/app/redux/store/hooks";
import {
  selectBookedSlots,
  fetchAvailability,
  createAppointment,
} from "@/app/redux/slices/appointmentSlice";
import { selectProfile } from "@/app/redux/slices/profileSlice";
import { selectActiveTreatments } from "@/app/redux/slices/treatmentSlice";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import type { ConsultationType, AppointmentStatus } from "@/app/redux/slices/appointmentSlice";
import type { DoctorProfile } from "@/app/redux/slices/profileSlice";

export const timeSlots = [
  "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
  "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM",
];

export const teethOptions = [
  "11", "12", "13", "14", "15", "16", "17", "18",
  "21", "22", "23", "24", "25", "26", "27", "28",
  "31", "32", "33", "34", "35", "36", "37", "38",
  "41", "42", "43", "44", "45", "46", "47", "48",
  "51", "52", "53", "54", "55", "61", "62", "63", "64", "65",
  "71", "72", "73", "74", "75", "81", "82", "83", "84", "85",
];

interface CreateAppointmentModalFormProps {
  patientId: string;
  patientName: string;
  patientContact?: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface AppointmentFormState {
  appointmentDate: Date;
  consultationType: ConsultationType;
  notes: string;
  timeSlot: string;
  treatments: string[];
  teeth: string[];
}

const CreateAppointmentModalForm: React.FC<CreateAppointmentModalFormProps> = ({
  patientId,
  patientName,
  patientContact,
  onClose,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const { data: session } = useSession();
  const doctorId = session?.user?.id;

  const [formData, setFormData] = useState<AppointmentFormState>({
    appointmentDate: new Date(),
    consultationType: "New",
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
  const activeTreatments = useAppSelector(selectActiveTreatments);

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
    // Fallback: use session doctorId if profile is not loaded yet
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
      const formattedDate = formatDateForServer(formData.appointmentDate);

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

  const availableSlots = useMemo(() => {
    const slots = Array.isArray(bookedSlots) ? bookedSlots : [];
    return timeSlots.map((slot) => ({
      time: slot,
      booked: slots.includes(slot),
      popular: ["10:00 AM", "02:00 PM", "04:00 PM"].includes(slot),
    }));
  }, [bookedSlots]);

  const treatmentOptionsForSelect = useMemo(
    () => activeTreatments.map((treatment) => ({
      label: treatment.name,
      value: treatment.name
    })),
    [activeTreatments]
  );

  const teethOptionsForSelect = useMemo(
    () => teethOptions.map((option) => ({ label: option, value: option })),
    []
  );

  const handleTimeSlotSelect = (slot: string) => {
    setFormData((prev) => ({ ...prev, timeSlot: slot }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.timeSlot) {
      setErrorMessage("Please select a time slot");
      return;
    }
    if (formData.treatments.length === 0) {
      setErrorMessage("Please select at least one treatment");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        doctor: doctorId,
        patient: patientId,
        appointmentDate: formatDateForServer(formData.appointmentDate),
        status: "Scheduled" as AppointmentStatus,
        consultationType: formData.consultationType,
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
              message: `Your appointment is confirmed for ${format(
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
        setErrorMessage("Failed to create appointment. Please try again.");
      }
    } catch (error) {
      setErrorMessage("Error creating appointment. Please try again.");
      console.error("Appointment creation error:", error);
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
      aria-labelledby="create-appointment-title"
      className="fixed z-50 inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-all duration-300"
    >
      <div className="relative bg-card border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-500/10 to-transparent border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500/10 rounded-full">
                <CalendarIcon className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h2 id="create-appointment-title" className="text-2xl font-bold text-foreground">
                  Create Appointment
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Schedule a new appointment for this patient
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
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-3">
              <User className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-200">{patientName}</p>
                <p className="text-sm text-blue-600 dark:text-blue-300">ID: {patientId.slice(-6)}</p>
              </div>
            </div>

            {/* Date & Time Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date Selection */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-foreground">
                  <CalendarIcon className="h-4 w-4" />
                  <span>Appointment Date</span>
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
                  {availableSlots.map(({ time, booked, popular }) => (
                    <Button
                      key={time}
                      type="button"
                      variant={formData.timeSlot === time ? "default" : "outline"}
                      disabled={booked}
                      onClick={() => handleTimeSlotSelect(time)}
                      className={`h-8 text-xs ${booked ? "opacity-50 cursor-not-allowed" : ""
                        } ${popular && !booked ? "border-2 border-orange-200" : ""}`}
                    >
                      {time}
                      {popular && !booked && (
                        <Badge variant="secondary" className="absolute -top-1.5 -right-1 text-[8px] px-1 py-0 h-auto bg-orange-500">
                          ★
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Consultation Type */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-foreground">
                <MessageCircle className="h-4 w-4" />
                <span>Consultation Type</span>
              </label>
              <Select
                value={formData.consultationType}
                onValueChange={(value: ConsultationType) =>
                  setFormData((prev) => ({ ...prev, consultationType: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New Consultation</SelectItem>
                  <SelectItem value="Follow-up">Follow-up Visit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Treatments & Teeth Section */}
            <div className="border-t border-border pt-6">
              <div className="flex items-center space-x-3 mb-4">
                <Stethoscope className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-foreground">Treatment Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Treatments */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-medium text-foreground">
                    <span>Treatments</span>
                  </label>
                  <MultiSelect
                    options={treatmentOptionsForSelect}
                    onValueChange={(values) =>
                      setFormData((prev) => ({ ...prev, treatments: values }))
                    }
                    defaultValue={formData.treatments}
                    placeholder="Select treatments..."
                    variant="secondary"
                    maxCount={3}
                  />
                </div>

                {/* Teeth Selection */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-medium text-foreground">
                    <span>Teeth Involved (Optional)</span>
                  </label>
                  <MultiSelect
                    options={teethOptionsForSelect}
                    onValueChange={(values) =>
                      setFormData((prev) => ({ ...prev, teeth: values }))
                    }
                    defaultValue={formData.teeth}
                    placeholder="Select teeth numbers..."
                    variant="secondary"
                    maxCount={4}
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="border-t border-border pt-6">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-foreground">
                  <span>Additional Notes</span>
                </label>
                <textarea
                  className="w-full px-4 py-3 border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any special instructions or patient concerns..."
                />
              </div>
            </div>

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
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span>Create Appointment</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAppointmentModalForm;