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
import { selectPatients } from "@/app/redux/slices/patientSlice";
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
import { createAppointment } from "@/app/redux/slices/appointmentSlice";
import { useSession } from "next-auth/react";
import { format } from "date-fns";

interface BookAppointmentFormProps {
  onCancel?: () => void;
}

export default function BookAppointmentForm({
  onCancel = () => {},
}: BookAppointmentFormProps) {
  const [appointmentData, setAppointmentData] = useState({
    patient: "",
    appointmentDate: new Date(),
    consultationType: "In-Person",
    notes: "",
  });

  const [patientQuery, setPatientQuery] = useState("");
  const [verifiedPatient, setVerifiedPatient] = useState(false);
  const [showRegisterPatient, setShowRegisterPatient] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);

  const { data: session } = useSession();
  const patients = useAppSelector(selectPatients);
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Derive suggestions based on current query
  const filteredSuggestions = useMemo(() => {
    return patientQuery.length > 0
      ? patients.filter(
          (p: any) =>
            p.fullName.toLowerCase().includes(patientQuery.toLowerCase()) ||
            p.PatientId.includes(patientQuery)
        )
      : [];
  }, [patientQuery, patients]);

  const handlePatientChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setPatientQuery(query);
      setVerifiedPatient(false);
      setAppointmentData((prev) => ({ ...prev, patient: "" }));
    },
    []
  );

  const handleSelectPatient = useCallback((patient: any) => {
    setPatientQuery(`${patient.fullName} (${patient.PatientId})`);
    setAppointmentData((prev) => ({ ...prev, patient: patient._id }));
    setVerifiedPatient(true);
  }, []);

  const handleSelectChange = useCallback((name: string, value: string) => {
    setAppointmentData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setAppointmentData({
      patient: "",
      appointmentDate: new Date(),
      consultationType: "In-Person",
      notes: "",
    });
    setPatientQuery("");
    setVerifiedPatient(false);
    setShowRegisterPatient(false);
  }, []);

  const getLocalISOString = (date: Date) => {
    // This will format the date as ISO 8601 with local timezone offset
    return format(date, "yyyy-MM-dd'T'HH:mm:ssXXX");
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!verifiedPatient) {
        setErrorMessage(
          "Patient is not registered or selection has been modified."
        );
        setShowError(true);
        setShowRegisterPatient(true);
        return;
      }

      // Prepare the appointment data without the _id
      const newAppointmentData = {
        doctor: session?.user?.id, // Replace with actual doctor ID
        patient: appointmentData.patient,
        appointmentDate: getLocalISOString(appointmentData.appointmentDate),
        status: "Scheduled" as const,
        consultationType: appointmentData.consultationType as
          | "In-Person"
          | "Online",
        notes: appointmentData.notes,
        createdBy: session?.user?.id, // Replace with the actual creator's ID
      };
      try {
        const resultAction = await dispatch(
          createAppointment(newAppointmentData)
        );
        if (createAppointment.fulfilled.match(resultAction)) {
          // Appointment successfully created; navigate to the appointments page.
          router.push("/dashboard/pages/Doctor/appointments");
        } else {
          // Handle errors if needed.
          setErrorMessage("Failed to create appointment");
          setShowError(true);
        }
      } catch (error) {
        setErrorMessage("An error occurred while creating the appointment.");
        setShowError(true);
      }
    },
    [verifiedPatient, appointmentData, router, dispatch]
  );

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

        {/* Patient Suggestion Search */}
        <div className="relative">
          <Label>Patient</Label>
          <Input
            value={patientQuery}
            onChange={handlePatientChange}
            className="bg-white"
            placeholder="Search by Patient ID or Name"
          />
          {filteredSuggestions.length > 0 && (
            <ul
              className="absolute bg-white z-10 w-full border border-gray-300 rounded mt-2 max-h-40 overflow-y-auto"
              role="listbox"
              aria-label="Patient Suggestions"
            >
              {filteredSuggestions.map((p: any) => (
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

        {/* Appointment Date */}
        <div>
          <Label>Appointment Date</Label>
          <div className="bg-white w-fit p-2 rounded-lg">
            <Calendar
              mode="single" // explicitly set single date selection mode
              selected={appointmentData.appointmentDate}
              onSelect={(date) => {
                if (date) {
                  setAppointmentData((prev) => ({
                    ...prev,
                    appointmentDate: date,
                  }));
                }
              }}
            />
          </div>
        </div>

        {/* Consultation Type */}
        <div>
          <Label>Consultation Type</Label>
          <Select
            onValueChange={(value) =>
              handleSelectChange("consultationType", value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="In-Person">In-Person</SelectItem>
              <SelectItem value="Online">Online</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Notes */}
        <div>
          <Label>Notes</Label>
          <Input
            className="bg-white"
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

      {/* Error Dialog */}
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
                    resetForm();
                  }}
                >
                  OK
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}
