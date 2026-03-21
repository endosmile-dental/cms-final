"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { Trash2 } from "lucide-react";
import { Appointment } from "@/app/redux/slices/appointmentSlice";
import { useAppSelector } from "@/app/redux/store/hooks";
import { selectActiveTreatments } from "@/app/redux/slices/treatmentSlice";

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
  const [form, setForm] = useState<Appointment | null>(null);
  const [initialForm, setInitialForm] = useState<Appointment | null>(null);
  const activeTreatments = useAppSelector(selectActiveTreatments);

  useEffect(() => {
    if (appointment) {
      setForm(appointment);
      setInitialForm(appointment);
    }
  }, [appointment]);

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
    () => [
      "11", "12", "13", "14", "15", "16", "17", "18",
      "21", "22", "23", "24", "25", "26", "27", "28",
      "31", "32", "33", "34", "35", "36", "37", "38",
      "41", "42", "43", "44", "45", "46", "47", "48",
      "51", "52", "53", "54", "55",
      "61", "62", "63", "64", "65",
      "71", "72", "73", "74", "75",
      "81", "82", "83", "84", "85"
    ].map(option => ({ label: option, value: option })),
    []
  );

  const handleMultiSelectChange = (field: keyof Appointment, values: string[]) => {
    setForm((prev) => (prev ? { ...prev, [field]: values } : null));
  };

  const handleChange = <K extends keyof Appointment>(
    key: K,
    value: Appointment[K]
  ) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : null));
  };

  const getUpdatedFields = (): Appointment => {
    if (!form || !initialForm) {
      // Return a default appointment if form or initialForm is null
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
      const updatedFields = getUpdatedFields();
      // Only save if there are actual changes
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

  if (!form) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit Appointment - {form._id.slice(-5)}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-4">
          <div className="space-y-1">
            <Label>Time Slot</Label>
            <Input
              value={form.timeSlot || ""}
              onChange={(e) => handleChange("timeSlot", e.target.value)}
              placeholder="Time Slot (e.g., 10:00 AM - 10:30 AM)"
            />
          </div>

          <div className="space-y-1">
            <Label>Teeth</Label>
            <MultiSelect
              options={teethOptions}
              onValueChange={(values) => handleMultiSelectChange("teeth", values)}
              defaultValue={Array.isArray(form.teeth) ? form.teeth : []}
              placeholder="Select teeth numbers..."
              variant="secondary"
              maxCount={8}
            />
          </div>

          <div className="space-y-1">
            <Label>Consultation Type</Label>
            <Select
              value={form.consultationType || ""}
              onValueChange={(value) => handleChange("consultationType", value as Appointment["consultationType"])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select consultation type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Follow-up">Follow-up</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Treatments</Label>
            <MultiSelect
              options={treatmentOptions}
              onValueChange={(values) => handleMultiSelectChange("treatments", values)}
              defaultValue={Array.isArray(form.treatments) ? form.treatments : []}
              placeholder="Select treatments..."
              variant="secondary"
              maxCount={5}
            />
          </div>

          <div className="space-y-1">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(value) =>
                handleChange("status", value as Appointment["status"])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Scheduled">Scheduled</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Payment Status</Label>
            <Select
              value={form.paymentStatus}
              onValueChange={(value) =>
                handleChange("paymentStatus", value as Appointment["paymentStatus"])
              }
            >
              <SelectTrigger>
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

          <div className="space-y-1">
            <Label>Notes</Label>
            <Input
              value={form.notes || ""}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Additional notes"
            />
          </div>
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <div className="flex gap-2">
              <Button onClick={handleSubmit}>Save</Button>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
            <Button
              variant="destructive"
              onClick={() => {
                if (form?._id) {
                  // Trigger delete functionality
                  if (onDelete) {
                    onDelete(form._id);
                  }
                  onClose();
                }
              }}
              className="flex items-center gap-2"
            >
              <Trash2 size={16} />
              Delete
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditAppointmentDialog;