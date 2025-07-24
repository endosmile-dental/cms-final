"use client";

import React, { useState, useCallback, useMemo } from "react";
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
import { Calendar } from "@/components/ui/calendar";
import DashboardLayout from "@/app/dashboard/layout/DashboardLayout";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Patient, selectPatients } from "@/app/redux/slices/patientSlice";
import { useAppDispatch, useAppSelector } from "@/app/redux/store/hooks";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createAppointment,
  selectAppointments,
} from "@/app/redux/slices/appointmentSlice";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { MultiSelect } from "@/components/ui/multi-select";
import type {
  ConsultationType,
  AppointmentStatus,
} from "@/app/redux/slices/appointmentSlice";
import { PreviewDialog } from "./PreviewDialog";
import { selectDoctors } from "../redux/slices/doctorSlice";

export const timeSlots = [
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "01:00 PM",
  "01:30 PM",
  "02:00 PM",
  "02:30 PM",
  "03:00 PM",
  "03:30 PM",
  "04:00 PM",
  "04:30 PM",
  "05:00 PM",
  "05:30 PM",
  "06:00 PM",
  "06:30 PM",
  "07:00 PM",
  "07:30 PM",
  "08:00 PM",
];
export const treatmentOptions = [
  "Aligners(Invisalign)",
  "Aligners(Toothsi)",
  "Ceramic Braces",
  "Composite Restoration",
  "Consultation",
  "Crown & Bridge (2 unit)",
  "Crown & Bridge (3 unit)",
  "Crown & Bridge (4 unit)",
  "Crown & Bridge (5 unit)",
  "Dental Implant(Active Novel Bio)",
  "Dental Implant(Ostem)",
  "Dental Implant(Strauman)",
  "Denture",
  "Extraction",
  "Follow-up",
  "GIC Restoration",
  "Grossly Decayed Extraction",
  "Impaction",
  "Metal Braces",
  "Multi-Visit Root Canal Treatment",
  "Oral Prophylaxis with Polishing",
  "Oral Prophylaxis with Polishing & Teeth Whitening",
  "PFM Crown(DMLS)",
  "PFM Crown(Normal)",
  "Re-Restoration(Composite)",
  "Re-Restoration(GIC)",
  "Re-Treatment / Re-RCT",
  "RPD",
  "RVG/Digital X-ray",
  "Single-Visit Root Canal Treatment",
  "Veneers Lithium Disilicate",
  "Veneers Porcelain",
  "Zirconia Crown",
];

export const teethOptions = [
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "21",
  "22",
  "23",
  "24",
  "25",
  "26",
  "27",
  "28",
  "31",
  "32",
  "33",
  "34",
  "35",
  "36",
  "37",
  "38",
  "41",
  "42",
  "43",
  "44",
  "45",
  "46",
  "47",
  "48",
  "51",
  "52",
  "53",
  "54",
  "55",
  "61",
  "62",
  "63",
  "64",
  "65",
  "71",
  "72",
  "73",
  "74",
  "75",
  "81",
  "82",
  "83",
  "84",
  "85",
];

// Strongly-typed form state
interface AppointmentFormState {
  patient: string;
  appointmentDate: Date;
  consultationType: ConsultationType;
  notes: string;
  timeSlot: string;
  treatments: string[];
  teeth: string[];
  contactNumber: string; // Optional field for contact number
}

export default function BookAppointmentForm({ onCancel = () => {} }) {
  const [appointmentData, setAppointmentData] = useState<AppointmentFormState>({
    patient: "",
    appointmentDate: new Date(),
    consultationType: "New",
    notes: "",
    timeSlot: "",
    treatments: [],
    teeth: [],
    contactNumber: "", // Initialize contact number
  });

  const [patientQuery, setPatientQuery] = useState("");
  const [verifiedPatient, setVerifiedPatient] = useState(false);
  const [showRegisterPatient, setShowRegisterPatient] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState<AppointmentFormState | null>(
    null
  );
  const [modalError, setModalError] = useState("");

  const { data: session } = useSession();
  const doctorId = session?.user?.id;
  const patients = useAppSelector(selectPatients);
  const appointments = useAppSelector(selectAppointments);
  const doctors = useAppSelector(selectDoctors);

  const router = useRouter();
  const dispatch = useAppDispatch();

  // Find the doctor document that matches the logged-in user's ID
  const currentDoctor = useMemo(
    () => doctors.find((d) => d.userId === session?.user?.id),
    [doctors, session?.user?.id]
  );

  const bookedSlots = useMemo(() => {
    if (!currentDoctor?._id || !appointmentData.appointmentDate) return [];
    const selectedDate = format(appointmentData.appointmentDate, "yyyy-MM-dd");

    return appointments
      .filter(
        (appt) =>
          appt.doctor === currentDoctor._id &&
          format(new Date(appt.appointmentDate), "yyyy-MM-dd") === selectedDate
      )
      .map((appt) => appt.timeSlot);
  }, [appointments, appointmentData.appointmentDate, currentDoctor?._id]);

  const treatmentOptionsForSelect = useMemo(
    () => treatmentOptions.map((option) => ({ label: option, value: option })),
    []
  );
  const teethOptionsForSelect = useMemo(
    () => teethOptions.map((option) => ({ label: option, value: option })),
    []
  );

  const filteredSuggestions = useMemo(
    () =>
      patientQuery
        ? patients.filter(
            (p) =>
              p.fullName.toLowerCase().includes(patientQuery.toLowerCase()) ||
              p.PatientId.toLowerCase().includes(patientQuery.toLowerCase())
          )
        : [],
    [patientQuery, patients]
  );

  const handleSelectPatient = useCallback((patient: Patient) => {
    setPatientQuery(`${patient.fullName} (${patient.PatientId})`);
    setAppointmentData((prev) => ({
      ...prev,
      patient: patient._id,
      contactNumber: patient.contactNumber || "",
    }));
    setVerifiedPatient(true);
  }, []);

  const handlePatientChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPatientQuery(e.target.value);
      setVerifiedPatient(false);
      setAppointmentData((prev) => ({ ...prev, patient: "" }));
    },
    []
  );

  const handleMultiSelectChange = (
    field: keyof AppointmentFormState,
    values: string[]
  ) => {
    setAppointmentData((prev) => ({ ...prev, [field]: values }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedPatient) {
      setErrorMessage("Patient selection invalid.");
      setShowError(true);
      setShowRegisterPatient(true);
      return;
    }
    setPreviewData(appointmentData);
    setShowPreviewModal(true);
  };

  // Confirmation handler
  const handleConfirm = async () => {
    if (!previewData) return;

    try {
      const payload = {
        doctor: doctorId,
        patient: previewData.patient,
        appointmentDate: format(
          previewData.appointmentDate,
          "yyyy-MM-dd'T'HH:mm:ssXXX"
        ),
        status: "Scheduled" as AppointmentStatus,
        consultationType: previewData.consultationType,
        timeSlot: previewData.timeSlot,
        treatments: previewData.treatments,
        teeth: previewData.teeth,
        notes: previewData.notes,
        createdBy: doctorId,
      };

      console.log("previewData", previewData);

      const result = await dispatch(createAppointment(payload));
      if (createAppointment.fulfilled.match(result)) {
        router.push("/dashboard/pages/Doctor/appointments");
        setShowPreviewModal(false);
        // Send SMS asynchronously
        try {
          const smsPayload = {
            phoneNumber: `+91${previewData.contactNumber}`, // Ensure E.164 format
            message: `Your appointment is confirmed for ${format(
              previewData.appointmentDate,
              "MMM dd, yyyy 'at' hh:mm a"
            )}. Clinic: EndoSmile Dental Care, Iteda, Greater Noida(W)`,
          };

          const response = await fetch("/api/sms/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(smsPayload),
          });
          if (response.ok && response.status === 200) {
            alert("SMS sent successfully!");
          } else {
            const errData = await response.json();
            alert(`SMS failed: ${errData.error || "Unknown error"}`);
          }
        } catch (smsError) {
          console.error("SMS failed:", smsError);
          // Implement retry logic or logging
        }
      } else {
        setModalError("Failed to create appointment");
      }
    } catch (error) {
      setModalError("Error creating appointment.");
      console.error("Appointment creation error:", error);
    }
  };

  return (
    <DashboardLayout>
      <form
        onSubmit={handleSubmit}
        className="p-6 border rounded-md shadow-md space-y-4"
      >
        <div className="flex items-center">
          <Link href="/dashboard/pages/Doctor/appointments">
            <Button variant="outline" onClick={onCancel} className="mr-2">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <h2 className="text-2xl font-bold">Book New Appointment</h2>
        </div>

        <div className="relative">
          <Label>Patient</Label>
          <Input
            value={patientQuery}
            onChange={handlePatientChange}
            placeholder="Search by Patient ID or Name"
          />
          {filteredSuggestions.length > 0 && (
            <ul className="absolute bg-white z-10 w-full border rounded mt-2 max-h-40 overflow-y-auto">
              {filteredSuggestions.map((p) => (
                <li
                  key={p._id}
                  className="p-2 cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSelectPatient(p)}
                >
                  {p.fullName} ({p.PatientId})
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <Label>Appointment Date</Label>
          <Calendar
            mode="single"
            selected={appointmentData.appointmentDate}
            onSelect={(date) =>
              date &&
              setAppointmentData((prev) => ({ ...prev, appointmentDate: date }))
            }
            defaultMonth={new Date()}
            disabled={{ before: new Date() }}
          />
        </div>

        <div>
          <Label>Consultation Type</Label>
          <Select
            onValueChange={(value: ConsultationType) =>
              setAppointmentData((prev) => ({
                ...prev,
                consultationType: value,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="New">New</SelectItem>
              <SelectItem value="Follow-up">Follow-up</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Time Slot</Label>
          <Select
            onValueChange={(value) =>
              setAppointmentData((prev) => ({ ...prev, timeSlot: value }))
            }
          >
            <SelectTrigger className="w-full border px-4 py-2 shadow-sm">
              <SelectValue placeholder="Select Time Slot" />
            </SelectTrigger>
            <SelectContent className="max-h-52 overflow-y-auto border shadow-md">
              {timeSlots.map((slot) => {
                const isBooked = bookedSlots.includes(slot);
                return (
                  <SelectItem
                    key={slot}
                    value={slot}
                    disabled={isBooked}
                    className={`cursor-pointer px-4 py-2 ${
                      isBooked
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    {slot} {isBooked && "(Booked)"}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Treatments</Label>
          <MultiSelect
            options={treatmentOptionsForSelect}
            onValueChange={(values) =>
              handleMultiSelectChange("treatments", values)
            }
            defaultValue={appointmentData.treatments}
            placeholder="Select treatments"
            variant="secondary"
            maxCount={2}
          />
        </div>

        <div>
          <Label>Teeth Involved</Label>
          <MultiSelect
            options={teethOptionsForSelect}
            onValueChange={(values) => handleMultiSelectChange("teeth", values)}
            defaultValue={appointmentData.teeth}
            placeholder="Select teeth numbers"
            variant="secondary"
            maxCount={3}
          />
        </div>

        <div>
          <Label>Notes</Label>
          <Input
            name="notes"
            value={appointmentData.notes}
            onChange={(e) =>
              setAppointmentData((prev) => ({ ...prev, notes: e.target.value }))
            }
            placeholder="Additional Notes"
          />
        </div>

        <div className="flex justify-center space-x-2">
          <Link href="/dashboard/pages/Doctor/appointments">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </Link>
          <Button type="submit">Book Appointment</Button>
        </div>
      </form>

      {showError && (
        <Dialog open={true} onOpenChange={() => setShowError(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Error</DialogTitle>
              <DialogDescription>{errorMessage}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <div className="space-x-2">
                {showRegisterPatient && (
                  <Link href="/dashboard/pages/Doctor/patientRecords/patientRegistrationForm">
                    <Button>Register Patient</Button>
                  </Link>
                )}
                <Button
                  onClick={() => {
                    setShowError(false);
                  }}
                >
                  OK
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <PreviewDialog
        open={showPreviewModal}
        onOpenChange={(open) => {
          if (!open) setModalError("");
          setShowPreviewModal(open);
        }}
        onConfirm={handleConfirm}
        isLoading={false} // Add loading state if needed
        error={modalError}
        title="Appointment Preview"
        description="Please review the appointment details before confirming"
        confirmButtonText="Confirm Appointment"
      >
        <div className="space-y-4">
          {/* Patient Information */}
          {/* <div className="space-y-2">
            <h3 className="font-semibold">Patient Information</h3>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-muted-foreground">Patient ID</dt>
                <dd>{previewData?.patient}</dd>
              </div>
            </dl>
          </div> */}

          {/* Appointment Details */}
          <div className="space-y-2">
            <h3 className="font-semibold">Appointment Details</h3>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-muted-foreground">Date</dt>
                <dd>
                  {previewData?.appointmentDate &&
                    format(previewData.appointmentDate, "PPP")}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Time Slot</dt>
                <dd>{previewData?.timeSlot || "-"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">
                  Consultation Type
                </dt>
                <dd>{previewData?.consultationType || "-"}</dd>
              </div>
            </dl>
          </div>

          {/* Treatments */}
          <div className="space-y-2">
            <h3 className="font-semibold">Treatments</h3>
            <div className="flex flex-wrap gap-2">
              {previewData?.treatments?.map((treatment) => (
                <span
                  key={treatment}
                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded"
                >
                  {treatment}
                </span>
              ))}
              {!previewData?.treatments?.length && (
                <span className="text-muted-foreground">None</span>
              )}
            </div>
          </div>

          {/* Teeth Involved */}
          <div className="space-y-2">
            <h3 className="font-semibold">Teeth Involved</h3>
            <div className="flex flex-wrap gap-2">
              {previewData?.teeth?.map((tooth) => (
                <span
                  key={tooth}
                  className="bg-green-100 text-green-800 px-2 py-1 rounded"
                >
                  {tooth}
                </span>
              ))}
              {!previewData?.teeth?.length && (
                <span className="text-muted-foreground">None</span>
              )}
            </div>
          </div>

          {/* Notes */}
          {previewData?.notes && (
            <div className="space-y-2">
              <h3 className="font-semibold">Notes</h3>
              <p className="text-muted-foreground text-sm">
                {previewData.notes}
              </p>
            </div>
          )}
        </div>
      </PreviewDialog>
    </DashboardLayout>
  );
}
