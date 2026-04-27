"use client";

import { useState, useEffect } from "react";
import { X, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

interface IAppointment {
  _id: string;
  patient: {
    _id: string;
    fullName: string;
    contactNumber: string;
    PatientId: string;
  };
  doctor: {
    _id: string;
    fullName: string;
  };
  appointmentDate: string;
  timeSlot: string;
  consultationType: "New" | "Follow-up";
  status: "Scheduled" | "Completed" | "Cancelled";
  notes?: string;
  treatments?: string[];
  teeth?: string[];
}

interface IPatient {
  _id: string;
  fullName: string;
  PatientId: string;
  contactNumber: string;
}

interface IDoctor {
  _id: string;
  userId: string;
  fullName: string;
}

interface AppointmentFormModalProps {
  appointment?: IAppointment | null;
  onClose: () => void;
  onSuccess: () => void;
}

type ConsultationType = IAppointment["consultationType"];
type AppointmentStatus = IAppointment["status"];

type AppointmentFormData = {
  doctor: string;
  patient: string;
  appointmentDate: string;
  timeSlot: string;
  consultationType: ConsultationType;
  status: AppointmentStatus;
  notes: string;
  treatments: string;
  teeth: string;
};

const TIME_SLOTS = [
  "09:00 AM",
  "09:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "02:00 PM",
  "02:30 PM",
  "03:00 PM",
  "03:30 PM",
  "04:00 PM",
  "04:30 PM",
];

export default function AppointmentFormModal({
  appointment,
  onClose,
  onSuccess,
}: AppointmentFormModalProps) {
  const [formData, setFormData] = useState<AppointmentFormData>({
    doctor: "",
    patient: "",
    appointmentDate: "",
    timeSlot: "",
    consultationType: "New",
    status: "Scheduled",
    notes: "",
    treatments: "",
    teeth: "",
  });

  const [patients, setPatients] = useState<IPatient[]>([]);
  const [doctors, setDoctors] = useState<IDoctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load patients and doctors
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [patientsRes, doctorsRes] = await Promise.all([
          fetch("/api/doctor/fetchPatients"),
          fetch("/api/doctor/fetchDoctors"),
        ]);

        if (patientsRes.ok) {
          const pData = await patientsRes.json();
          setPatients(pData.patients || []);
        }
        if (doctorsRes.ok) {
          const dData = await doctorsRes.json();
          setDoctors(dData.doctors || []);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load patients and doctors");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Pre-fill form if editing
  useEffect(() => {
    if (appointment) {
      setFormData({
        doctor: appointment.doctor._id,
        patient: appointment.patient._id,
        appointmentDate: appointment.appointmentDate.split("T")[0],
        timeSlot: appointment.timeSlot,
        consultationType: appointment.consultationType,
        status: appointment.status,
        notes: appointment.notes || "",
        treatments: appointment.treatments?.join(", ") || "",
        teeth: appointment.teeth?.join(", ") || "",
      });
    }
  }, [appointment]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.doctor) newErrors.doctor = "Doctor is required";
    if (!formData.patient) newErrors.patient = "Patient is required";
    if (!formData.appointmentDate)
      newErrors.appointmentDate = "Appointment date is required";
    if (!formData.timeSlot) newErrors.timeSlot = "Time slot is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const payload = {
        doctor: formData.doctor,
        patient: formData.patient,
        appointmentDate: formData.appointmentDate,
        timeSlot: formData.timeSlot,
        consultationType: formData.consultationType,
        status: formData.status,
        notes: formData.notes || undefined,
        treatments: formData.treatments
          ? formData.treatments.split(",").map((t) => t.trim())
          : undefined,
        teeth: formData.teeth
          ? formData.teeth.split(",").map((t) => t.trim())
          : undefined,
        createdBy: "",
      };

      let endpoint = "/api/doctor/appointments/add";
      let method = "POST";

      if (appointment) {
        endpoint = "/api/doctor/appointments/update";
        method = "PUT";
        payload.createdBy = appointment._id;
      }

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message || `Failed to ${appointment ? "update" : "create"} appointment`
        );
      }

      toast.success(
        `Appointment ${appointment ? "updated" : "created"} successfully`
      );
      onSuccess();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit form"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 flex items-center gap-3">
          <Loader size={20} className="animate-spin" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex justify-between items-center p-6 border-b bg-white">
          <h2 className="text-2xl font-bold">
            {appointment ? "Edit Appointment" : "New Appointment"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Doctor */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Doctor *
              </label>
              <select
                value={formData.doctor}
                onChange={(e) =>
                  setFormData({ ...formData, doctor: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.doctor ? "border-red-500" : ""
                }`}
              >
                <option value="">Select Doctor</option>
                {doctors.map((doc) => (
                  <option key={doc._id} value={doc._id}>
                    {doc.fullName}
                  </option>
                ))}
              </select>
              {errors.doctor && (
                <p className="text-red-500 text-sm mt-1">{errors.doctor}</p>
              )}
            </div>

            {/* Patient */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Patient *
              </label>
              <select
                value={formData.patient}
                onChange={(e) =>
                  setFormData({ ...formData, patient: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.patient ? "border-red-500" : ""
                }`}
              >
                <option value="">Select Patient</option>
                {patients.map((pat) => (
                  <option key={pat._id} value={pat._id}>
                    {pat.fullName} ({pat.PatientId})
                  </option>
                ))}
              </select>
              {errors.patient && (
                <p className="text-red-500 text-sm mt-1">{errors.patient}</p>
              )}
            </div>

            {/* Appointment Date */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Appointment Date *
              </label>
              <input
                type="date"
                value={formData.appointmentDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    appointmentDate: e.target.value,
                  })
                }
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.appointmentDate ? "border-red-500" : ""
                }`}
              />
              {errors.appointmentDate && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.appointmentDate}
                </p>
              )}
            </div>

            {/* Time Slot */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Time Slot *
              </label>
              <select
                value={formData.timeSlot}
                onChange={(e) =>
                  setFormData({ ...formData, timeSlot: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.timeSlot ? "border-red-500" : ""
                }`}
              >
                <option value="">Select Time Slot</option>
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
              {errors.timeSlot && (
                <p className="text-red-500 text-sm mt-1">{errors.timeSlot}</p>
              )}
            </div>

            {/* Consultation Type */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Consultation Type
              </label>
              <select
                value={formData.consultationType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    consultationType: e.target.value as "New" | "Follow-up",
                  })
                }
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="New">New</option>
                <option value="Follow-up">Follow-up</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as
                      | "Scheduled"
                      | "Completed"
                      | "Cancelled",
                  })
                }
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

          </div>

          {/* Teeth */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Teeth (comma-separated)
            </label>
            <input
              type="text"
              value={formData.teeth}
              onChange={(e) =>
                setFormData({ ...formData, teeth: e.target.value })
              }
              placeholder="e.g., 11, 21, 31"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Treatments */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Treatments (comma-separated)
            </label>
            <input
              type="text"
              value={formData.treatments}
              onChange={(e) =>
                setFormData({ ...formData, treatments: e.target.value })
              }
              placeholder="e.g., Cleaning, Filling"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={4}
              placeholder="Add any additional notes..."
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex gap-4 justify-end pt-6 border-t">
            <Button
              type="button"
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-black"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {submitting ? (
                <>
                  <Loader size={18} className="mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                `${appointment ? "Update" : "Create"} Appointment`
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
