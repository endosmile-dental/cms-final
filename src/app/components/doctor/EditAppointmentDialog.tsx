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
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  X,
  Edit3,
  CalendarIcon,
  Clock,
  Loader2,
  AlertCircle,
  MessageCircle,
  Stethoscope,
} from "lucide-react";
import { Appointment } from "@/app/redux/slices/appointmentSlice";
import {
  fetchAvailability,
  selectBookedSlots,
} from "@/app/redux/slices/appointmentSlice";
import { useAppDispatch, useAppSelector } from "@/app/redux/store/hooks";
import { selectActiveTreatments } from "@/app/redux/slices/treatmentSlice";
import { selectProfile, type DoctorProfile } from "@/app/redux/slices/profileSlice";
import {
  formatForInput,
  getLocalDate,
  parseDateFromServer,
  startOfDayIST,
} from "@/app/utils/dateUtils";
import { timeSlots, teethOptions as appointmentTeethOptions } from "./CreateAppointmentModalForm";

interface EditAppointmentDialogProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSave: (updated: Partial<Appointment>) => void;
  onDelete?: (appointmentId: string) => void;
}

const EditAppointmentDialog: React.FC<EditAppointmentDialogProps> = ({
  open,
  onClose,
  appointment,
  onSave,
  onDelete,
}) => {
  const dispatch = useAppDispatch();
  const [form, setForm] = useState<Appointment | null>(null);
  const [initialForm, setInitialForm] = useState<Appointment | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const bookedSlots = useAppSelector(selectBookedSlots);
  const profile = useAppSelector(selectProfile);
  const activeTreatments = useAppSelector(selectActiveTreatments);

  useEffect(() => {
    if (appointment) {
      const normalizedAppointment = {
        ...appointment,
        appointmentDate: formatForInput(parseDateFromServer(appointment.appointmentDate)),
      };
      setForm(normalizedAppointment);
      setInitialForm(normalizedAppointment);
    }
  }, [appointment]);

  const currentDoctor = useMemo(() => {
    if (profile && typeof profile === "object" && "_id" in profile) {
      const doctorProfile = profile as DoctorProfile;
      if (doctorProfile._id) {
        return doctorProfile._id;
      }
    }

    return typeof appointment?.doctor === "string" ? appointment.doctor : null;
  }, [appointment?.doctor, profile]);

  useEffect(() => {
    if (!open || !currentDoctor || !form?.appointmentDate) {
      return;
    }

    setAvailabilityLoading(true);
    setErrorMessage(null);

    dispatch(
      fetchAvailability({
        doctorId: currentDoctor,
        date: form.appointmentDate,
      })
    )
      .unwrap()
      .catch(() => {
        setErrorMessage("Failed to load available slots. Please try again.");
      })
      .finally(() => {
        setAvailabilityLoading(false);
      });
  }, [currentDoctor, dispatch, form?.appointmentDate, open]);

  // Treatment options for MultiSelect
  const treatmentOptions = useMemo(
    () => activeTreatments.map((treatment) => ({ 
      label: treatment.name, 
      value: treatment.name 
    })),
    [activeTreatments]
  );

  // Teeth options for MultiSelect
  const teethOptions = useMemo(
    () => appointmentTeethOptions.map((option) => ({ label: option, value: option })),
    []
  );

  const getCalendarDateFromInput = (dateValue: string): Date | undefined => {
    if (!dateValue) {
      return undefined;
    }

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
    if (!match) {
      return undefined;
    }

    const [, year, month, day] = match;
    return new Date(Number(year), Number(month) - 1, Number(day), 12);
  };

  const availableSlots = useMemo(() => {
    const slots = Array.isArray(bookedSlots) ? bookedSlots : [];
    const isOriginalDate =
      initialForm?.appointmentDate && form?.appointmentDate
        ? initialForm.appointmentDate === form.appointmentDate
        : false;

    return timeSlots.map((slot) => {
      const isOriginalSlot =
        isOriginalDate && initialForm?.timeSlot === slot;

      return {
        time: slot,
        booked: slots.includes(slot) && !isOriginalSlot,
        popular: ["10:00 AM", "02:00 PM", "04:00 PM"].includes(slot),
      };
    });
  }, [bookedSlots, form?.appointmentDate, initialForm?.appointmentDate, initialForm?.timeSlot]);

  const selectedAppointmentDate = useMemo(() => {
    if (!form?.appointmentDate) {
      return undefined;
    }

    return getCalendarDateFromInput(form.appointmentDate);
  }, [form?.appointmentDate]);

  const handleMultiSelectChange = (field: keyof Appointment, values: string[]) => {
    setForm((prev) => (prev ? { ...prev, [field]: values } : null));
  };

  const handleChange = <K extends keyof Appointment>(
    key: K,
    value: Appointment[K]
  ) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : null));
  };

  const handleTimeSlotSelect = (slot: string) => {
    setErrorMessage(null);
    setForm((prev) => (prev ? { ...prev, timeSlot: slot } : null));
  };

  const getUpdatedFields = (): Appointment => {
    if (!form || !initialForm) {
      return {
        _id: "",
        doctor: "",
        patient: "",
        appointmentDate: "",
        status: "Scheduled",
        consultationType: "New",
        timeSlot: "",
        createdBy: "",
        createdAt: "",
        updatedAt: "",
      };
    }

    const updated: Appointment = { ...form };

    (Object.keys(form) as (keyof Appointment)[]).forEach((key) => {
      const oldValue = initialForm[key];
      const newValue = form[key];

      const isEqual = JSON.stringify(oldValue) === JSON.stringify(newValue);

      if (!isEqual) {
        (
          updated as Record<
            keyof Appointment,
            Appointment[keyof Appointment]
          >
        )[key] = newValue;
      }
    });

    return updated;
  };

  const handleSubmit = () => {
    if (form && initialForm) {
      if (!form.timeSlot) {
        setErrorMessage("Please select a time slot");
        return;
      }

      const updatedFields = getUpdatedFields();
      const hasChanges = Object.keys(form).some(key => {
        const k = key as keyof Appointment;
        return JSON.stringify(form[k]) !== JSON.stringify(initialForm[k]);
      });
      
      if (hasChanges) {
        onSave(updatedFields);
      }
      onClose();
    }
  };

  const handleDelete = () => {
    if (form?._id) {
      if (onDelete) {
        onDelete(form._id);
      }
      onClose();
    }
  };

  // Disable background scrolling when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  if (!open || !form) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="edit-appointment-title"
      className="fixed z-50 inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-all duration-300"
    >
      <div className="relative bg-card border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-500/10 to-transparent border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-500/10 rounded-full">
                <Edit3 className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <h2 id="edit-appointment-title" className="text-2xl font-bold text-foreground">
                  Edit Appointment
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Appointment ID: {form._id.slice(-5)}
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
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-foreground">
                <CalendarIcon className="h-4 w-4" />
                <span>Appointment Date</span>
              </label>
              <Calendar
                mode="single"
                selected={selectedAppointmentDate}
                month={selectedAppointmentDate}
                onSelect={(date) => {
                  if (!date) return;
                  handleChange(
                    "appointmentDate",
                    formatForInput(startOfDayIST(date))
                  );
                }}
                disabled={{ before: startOfDayIST(getLocalDate()) }}
                className="rounded-md border p-3"
              />
            </div>

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
                style={{ maxHeight: "300px" }}
              >
                {availableSlots.map(({ time, booked, popular }) => (
                  <Button
                    key={time}
                    type="button"
                    variant={form.timeSlot === time ? "default" : "outline"}
                    disabled={booked}
                    onClick={() => handleTimeSlotSelect(time)}
                    className={`relative h-8 text-xs ${
                      booked ? "opacity-50 cursor-not-allowed" : ""
                    } ${popular && !booked ? "border-2 border-orange-200" : ""}`}
                  >
                    {time}
                    {popular && !booked && (
                      <Badge
                        variant="secondary"
                        className="absolute -top-1.5 -right-1 text-[8px] px-1 py-0 h-auto bg-orange-500"
                      >
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
              value={form.consultationType || ""}
              onValueChange={(value) =>
                handleChange("consultationType", value as Appointment["consultationType"])
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select consultation type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="New">New Consultation</SelectItem>
                <SelectItem value="Follow-up">Follow-up Visit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Teeth & Treatments */}
          <div className="border-t border-border pt-6">
            <div className="flex items-center space-x-3 mb-4">
              <Stethoscope className="h-5 w-5 text-purple-500" />
              <h3 className="text-lg font-semibold text-foreground">Treatment Details</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-foreground">
                  <span>Teeth</span>
                </label>
                <MultiSelect
                  options={teethOptions}
                  onValueChange={(values) => handleMultiSelectChange("teeth", values)}
                  defaultValue={Array.isArray(form.teeth) ? form.teeth : []}
                  placeholder="Select teeth numbers..."
                  variant="secondary"
                  maxCount={8}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-foreground">
                  <span>Treatments</span>
                </label>
                <MultiSelect
                  options={treatmentOptions}
                  onValueChange={(values) => handleMultiSelectChange("treatments", values)}
                  defaultValue={Array.isArray(form.treatments) ? form.treatments : []}
                  placeholder="Select treatments..."
                  variant="secondary"
                  maxCount={5}
                />
              </div>
            </div>
          </div>

          {/* Status & Payment Status */}
          <div className="border-t border-border pt-6">
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-lg font-semibold text-foreground">Status</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-foreground">
                  <span>Appointment Status</span>
                </label>
                <Select
                  value={form.status}
                  onValueChange={(value) =>
                    handleChange("status", value as Appointment["status"])
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-foreground">
                  <span>Payment Status</span>
                </label>
                <Select
                  value={form.paymentStatus}
                  onValueChange={(value) =>
                    handleChange("paymentStatus", value as Appointment["paymentStatus"])
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select payment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Partial">Partial</SelectItem>
                    <SelectItem value="Refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              {errorMessage}
            </div>
          )}

          {/* Notes */}
          <div className="border-t border-border pt-6">
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-foreground">
                <span>Notes</span>
              </label>
              <textarea
                value={form.notes || ""}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Additional notes"
                className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-muted/50 border-t border-border p-6">
          <div className="flex justify-between items-center">
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="flex items-center gap-2"
            >
              <Trash2 size={16} />
              Delete
            </Button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-foreground bg-muted rounded-lg hover:bg-muted/80 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditAppointmentDialog;
