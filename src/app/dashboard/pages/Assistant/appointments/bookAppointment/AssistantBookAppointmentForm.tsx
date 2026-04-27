"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
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
import { MultiSelect } from "@/components/ui/multi-select";
import DashboardLayout from "@/app/dashboard/layout/DashboardLayout";
import {
  ArrowLeft,
  AlertCircle,
  CalendarDays,
  Clock,
  Search,
  Loader,
  Stethoscope,
  UserRound,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PreviewDialog } from "@/app/components/PreviewDialog";
import { Badge } from "@/components/ui/badge";
import { useAppDispatch, useAppSelector } from "@/app/redux/store/hooks";
import {
  createAppointment,
  fetchAvailability,
  selectBookedSlots,
} from "@/app/redux/slices/appointmentSlice";
import { selectActiveTreatments } from "@/app/redux/slices/treatmentSlice";
import {
  formatForInput,
  getLocalDate,
  startOfDayIST,
} from "@/app/utils/dateUtils";
import {
  teethOptions,
  timeSlots,
} from "@/app/components/doctor/CreateAppointmentModalForm";

interface Patient {
  _id: string;
  fullName: string;
  PatientId: string;
  contactNumber?: string;
  email?: string;
  gender?: string;
}

interface Doctor {
  _id: string;
  userId: string;
  fullName: string;
  specialization: string;
}

export default function AssistantBookAppointmentForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchResults, setSearchResults] = useState<Patient[]>([]);

  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [appointmentDate, setAppointmentDate] = useState<Date | undefined>(
    new Date()
  );
  const [timeSlot, setTimeSlot] = useState("");
  const [patientQuery, setPatientQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [consultationType, setConsultationType] = useState<"New" | "Follow-up">(
    "New"
  );
  const [notes, setNotes] = useState("");
  const [treatments, setTreatments] = useState<string[]>([]);
  const [teeth, setTeeth] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const bookedSlots = useAppSelector(selectBookedSlots);
  const activeTreatments = useAppSelector(selectActiveTreatments);

  const treatmentOptions = useMemo(
    () =>
      activeTreatments.map((treatment) => ({
        label: treatment.name,
        value: treatment.name,
      })),
    [activeTreatments]
  );

  const teethOptionsForSelect = useMemo(
    () => teethOptions.map((option) => ({ label: option, value: option })),
    []
  );

  const availableSlots = useMemo(() => {
    const slots = Array.isArray(bookedSlots) ? bookedSlots : [];
    return timeSlots.map((slot) => ({
      time: slot,
      booked: slots.includes(slot),
      popular: ["10:00 AM", "02:00 PM", "04:00 PM"].includes(slot),
    }));
  }, [bookedSlots]);

  // Load doctors for assistant
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/doctor/fetchDoctors");
        if (!response.ok) throw new Error("Failed to fetch doctors");
        const data = await response.json();
        setDoctors(data.doctors || []);

        // Auto-select first doctor if there's only one
        if (data.doctors?.length === 1) {
          setSelectedDoctor(data.doctors[0]._id);
        }
      } catch (error) {
        console.error("Error loading doctors:", error);
        toast.error("Failed to load doctors");
      } finally {
        setLoading(false);
      }
    };

    loadDoctors();
  }, []);

  useEffect(() => {
    setSelectedPatient(null);
    setPatientQuery("");
    setSearchResults([]);
    setShowSearchDropdown(false);
    setTimeSlot("");
  }, [selectedDoctor]);

  useEffect(() => {
    setTimeSlot("");
  }, [appointmentDate]);

  useEffect(() => {
    if (!selectedDoctor || !appointmentDate) {
      return;
    }

    setAvailabilityLoading(true);
    setAvailabilityError(null);

    dispatch(
      fetchAvailability({
        doctorId: selectedDoctor,
        date: formatForInput(appointmentDate),
      })
    )
      .unwrap()
      .catch(() => {
        setAvailabilityError("Failed to load available slots. Please try again.");
      })
      .finally(() => {
        setAvailabilityLoading(false);
      });
  }, [appointmentDate, dispatch, selectedDoctor]);

  // Search patients
  const handlePatientSearch = async (query: string) => {
    setPatientQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    if (!selectedDoctor) {
      toast.error("Please select a doctor first");
      return;
    }

    try {
      setSearching(true);
      const response = await fetch(
        `/api/doctor/searchPatients?query=${encodeURIComponent(query)}&doctorId=${encodeURIComponent(selectedDoctor)}`
      );
      if (!response.ok) throw new Error("Failed to search patients");
      const data = await response.json();
      setSearchResults(data.patients || []);
      setShowSearchDropdown(true);
    } catch (error) {
      console.error("Error searching patients:", error);
      toast.error("Failed to search patients");
    } finally {
      setSearching(false);
    }
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientQuery(`${patient.fullName} (${patient.PatientId})`);
    setSearchResults([]);
    setShowSearchDropdown(false);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!selectedDoctor) newErrors.selectedDoctor = "Please select a doctor";
    if (!selectedPatient) newErrors.selectedPatient = "Please select a patient";
    if (!appointmentDate) newErrors.appointmentDate = "Date is required";
    if (!timeSlot) newErrors.timeSlot = "Time slot is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setModalError(null);
    setShowPreviewModal(true);
  };

  const handleConfirm = async () => {
    if (!validateForm()) {
      setModalError("Please complete the required fields before confirming.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        doctor: selectedDoctor,
        patient: selectedPatient?._id,
        appointmentDate: appointmentDate
          ? formatForInput(appointmentDate)
          : "",
        timeSlot,
        consultationType,
        status: "Scheduled" as const,
        notes,
        treatments: treatments.length > 0 ? treatments : undefined,
        teeth: teeth.length > 0 ? teeth : undefined,
        createdBy: selectedDoctor,
      };

      const result = await dispatch(createAppointment(payload)).unwrap();
      if (result) {
        toast.success("Appointment created successfully!");
        setShowPreviewModal(false);
        router.push("/dashboard/pages/Assistant/appointments");
      }
    } catch (error) {
      console.error("Error creating appointment:", error);
      const message =
        error instanceof Error ? error.message : "Failed to create appointment";
      setModalError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader className="animate-spin" size={32} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-8 p-6">
        {/* Header */}
        <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-br from-sky-50 via-white to-emerald-50 shadow-sm">
          <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div className="flex items-start gap-4">
              <Link href="/dashboard/pages/Assistant/appointments">
                <Button variant="outline" size="icon" className="mt-1 bg-white/80">
                  <ArrowLeft size={20} />
                </Button>
              </Link>
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-sky-700">
                  Assistant Desk
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                  Create Appointment
                </h1>
              </div>
            </div>

            <div className="hidden md:grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Doctor", value: selectedDoctor ? "Ready" : "Pending" },
                { label: "Patient", value: selectedPatient ? "Selected" : "Search" },
                { label: "Date", value: appointmentDate ? "Chosen" : "Pick" },
                { label: "Slot", value: timeSlot || "Select" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm"
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="overflow-hidden border-slate-200/80 shadow-sm">
            <CardHeader className="border-b bg-slate-50/70">
              <CardTitle className="flex items-center gap-3 text-slate-900">
                <div className="rounded-2xl bg-sky-100 p-2 text-sky-700">
                  <UserRound size={18} />
                </div>
                Doctor & Patient
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label>Doctor *</Label>
                  <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                    <SelectTrigger className={errors.selectedDoctor ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select a doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doc) => (
                        <SelectItem key={doc._id} value={doc._id}>
                          {doc.fullName} - {doc.specialization}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.selectedDoctor && (
                    <p className="text-sm text-red-500">{errors.selectedDoctor}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Patient *</Label>
                  <div className="relative">
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm transition focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100">
                      <Search size={18} className="text-slate-400" />
                      <Input
                        placeholder="Search by patient name, ID, or phone..."
                        value={patientQuery}
                        onChange={(e) => handlePatientSearch(e.target.value)}
                        onFocus={() =>
                          searchResults.length > 0 && setShowSearchDropdown(true)
                        }
                        className="border-0 px-0 shadow-none focus-visible:ring-0"
                      />
                      {searching && <Loader size={18} className="animate-spin text-slate-400" />}
                    </div>

                    {showSearchDropdown && searchResults.length > 0 && (
                      <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                        {searchResults.map((patient) => (
                          <button
                            key={patient._id}
                            type="button"
                            onClick={() => handleSelectPatient(patient)}
                            className="w-full rounded-xl px-4 py-3 text-left transition hover:bg-sky-50"
                          >
                            <p className="font-medium text-slate-900">{patient.fullName}</p>
                            <p className="text-sm text-slate-500">
                              {patient.PatientId} • {patient.contactNumber || "No phone"}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.selectedPatient && (
                    <p className="text-sm text-red-500">{errors.selectedPatient}</p>
                  )}
                </div>
              </div>

              {selectedPatient ? (
                <div className="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 to-emerald-50 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">
                        {selectedPatient.fullName}
                      </p>
                      <p className="text-sm text-slate-600">
                        {selectedPatient.PatientId}
                        {selectedPatient.contactNumber
                          ? ` • ${selectedPatient.contactNumber}`
                          : ""}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => {
                        setSelectedPatient(null);
                        setPatientQuery("");
                        setSearchResults([]);
                        setShowSearchDropdown(false);
                      }}
                      className="bg-white/80"
                    >
                      Change Patient
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-5 text-sm text-slate-500">
                  Select a doctor first, then search and choose the patient you want to schedule.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-slate-200/80 shadow-sm">
            <CardHeader className="border-b bg-slate-50/70">
              <CardTitle className="flex items-center gap-3 text-slate-900">
                <div className="rounded-2xl bg-emerald-100 p-2 text-emerald-700">
                  <CalendarDays size={18} />
                </div>
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 p-6 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-3">
                <Label>Appointment Date *</Label>
                <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-4">
                  <Calendar
                    mode="single"
                    selected={appointmentDate}
                    onSelect={(date) => {
                      if (!date) return;
                      setAppointmentDate(startOfDayIST(date));
                    }}
                    disabled={{ before: startOfDayIST(getLocalDate()) }}
                    className="rounded-2xl bg-white p-3 shadow-sm"
                  />
                </div>
                {errors.appointmentDate && (
                  <p className="text-sm text-red-500">{errors.appointmentDate}</p>
                )}
              </div>

              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Clock size={16} />
                  Time Slot *
                </Label>
                {availabilityLoading && (
                  <div className="flex items-center justify-center py-2 text-sm text-slate-500">
                    <Loader size={16} className="mr-2 animate-spin" />
                    Loading slots...
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {availableSlots.map(({ time, booked, popular }) => (
                    <Button
                      key={time}
                      type="button"
                      variant={timeSlot === time ? "default" : "outline"}
                      disabled={booked}
                      onClick={() => setTimeSlot(time)}
                      className={`relative h-12 text-sm ${booked ? "cursor-not-allowed opacity-50" : ""
                        } ${popular && !booked ? "border-2 border-orange-200" : ""}`}
                    >
                      {time}
                      {popular && !booked && (
                        <Badge
                          variant="secondary"
                          className="absolute -right-1 -top-1.5 h-auto bg-orange-500 px-1 py-0 text-[8px]"
                        >
                          ★
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
                {errors.timeSlot && (
                  <p className="text-sm text-red-500">{errors.timeSlot}</p>
                )}
                {availabilityError && (
                  <div className="flex items-center rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                    <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                    {availabilityError}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-slate-200/80 shadow-sm">
            <CardHeader className="border-b bg-slate-50/70">
              <CardTitle className="flex items-center gap-3 text-slate-900">
                <div className="rounded-2xl bg-violet-100 p-2 text-violet-700">
                  <Stethoscope size={18} />
                </div>
                Appointment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Consultation Type</Label>
                  <Select
                    value={consultationType}
                    onValueChange={(val: "New" | "Follow-up") =>
                      setConsultationType(val)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Follow-up">Follow-up</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Teeth</Label>
                  <MultiSelect
                    options={teethOptionsForSelect}
                    onValueChange={setTeeth}
                    defaultValue={teeth}
                    placeholder="Select teeth numbers..."
                    variant="secondary"
                    maxCount={8}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Treatments</Label>
                  <MultiSelect
                    options={treatmentOptions}
                    onValueChange={setTreatments}
                    defaultValue={treatments}
                    placeholder="Select treatments..."
                    variant="secondary"
                    maxCount={5}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <textarea
                    className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    placeholder="Add any additional notes, instructions, or patient concerns..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden border-slate-200/80 shadow-sm">
          <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-base font-semibold text-slate-900">
                Ready to review the appointment?
              </p>
              <p className="text-sm text-slate-500">
                Open a confirmation modal to preview the booking summary before creating it.
              </p>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="h-12 min-w-[220px] bg-slate-900 text-white hover:bg-slate-800"
            >
              Review & Book Appointment
            </Button>
          </CardContent>
        </Card>

        <PreviewDialog
          open={showPreviewModal}
          onOpenChange={(open) => {
            if (!open) setModalError(null);
            setShowPreviewModal(open);
          }}
          onConfirm={handleConfirm}
          isLoading={submitting}
          error={modalError}
          title="Appointment Preview"
          description="Please review all details before confirming the appointment"
          confirmButtonText="Confirm Appointment"
        >
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="flex items-center text-lg font-semibold">
                <UserRound className="mr-2 h-5 w-5 text-blue-600" />
                Doctor & Patient
              </h3>
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-3">
                <div>
                  <dt className="text-sm text-muted-foreground">Doctor</dt>
                  <dd className="font-medium">
                    {doctors.find((doc) => doc._id === selectedDoctor)?.fullName ||
                      "Not selected"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Patient</dt>
                  <dd className="font-medium">
                    {selectedPatient?.fullName || "Not selected"}
                  </dd>
                  {selectedPatient?.PatientId && (
                    <p className="text-sm text-muted-foreground">
                      {selectedPatient.PatientId}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="flex items-center text-lg font-semibold">
                <CalendarDays className="mr-2 h-5 w-5 text-blue-600" />
                Appointment Details
              </h3>
              <div className="grid grid-cols-1 gap-4 rounded-lg bg-muted/50 p-3 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted-foreground">Date</dt>
                  <dd className="font-medium">
                    {appointmentDate?.toLocaleDateString() || "Not chosen"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Time Slot</dt>
                  <dd className="font-medium">{timeSlot || "Not selected"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">
                    Consultation Type
                  </dt>
                  <dd>
                    <Badge
                      variant={
                        consultationType === "New" ? "default" : "secondary"
                      }
                    >
                      {consultationType}
                    </Badge>
                  </dd>
                </div>
              </div>
            </div>

            {treatments.length > 0 && (
              <div className="space-y-3">
                <h3 className="flex items-center text-lg font-semibold">
                  <Stethoscope className="mr-2 h-5 w-5 text-blue-600" />
                  Selected Treatments
                </h3>
                <div className="flex flex-wrap gap-2 rounded-lg bg-blue-50 p-3">
                  {treatments.map((treatment) => (
                    <Badge
                      key={treatment}
                      variant="secondary"
                      className="bg-blue-100 px-3 py-1 text-blue-800"
                    >
                      {treatment}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {teeth.length > 0 && (
              <div className="space-y-3">
                <h3 className="flex items-center text-lg font-semibold">
                  <Stethoscope className="mr-2 h-5 w-5 text-blue-600" />
                  Teeth Involved
                </h3>
                <div className="flex flex-wrap gap-2 rounded-lg bg-green-50 p-3">
                  {teeth.map((tooth) => (
                    <Badge
                      key={tooth}
                      variant="secondary"
                      className="bg-green-100 px-3 py-1 text-green-800"
                    >
                      #{tooth}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {notes && (
              <div className="space-y-3">
                <h3 className="flex items-center text-lg font-semibold">
                  <MessageCircle className="mr-2 h-5 w-5 text-blue-600" />
                  Additional Notes
                </h3>
                <p className="rounded-lg bg-muted/50 p-3 text-muted-foreground">
                  {notes}
                </p>
              </div>
            )}
          </div>
        </PreviewDialog>
      </div>
    </DashboardLayout>
  );
}
