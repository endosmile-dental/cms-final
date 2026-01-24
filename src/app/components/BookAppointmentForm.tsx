"use client";

import React, { useState, useCallback, useMemo, ComponentType } from "react";
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
import {
  ArrowLeft,
  Search,
  User,
  CalendarIcon,
  Clock,
  Stethoscope,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

interface AppointmentFormState {
  patient: string;
  appointmentDate: Date;
  consultationType: ConsultationType;
  notes: string;
  timeSlot: string;
  treatments: string[];
  teeth: string[];
  contactNumber: string;
}

const FormStep = ({
  currentStep,
  step,
  title,
  icon: Icon,
}: {
  currentStep: number;
  step: number;
  title: string;
  icon: ComponentType<{ className?: string }>;
}) => (
  <div className="flex items-center space-x-3">
    <div
      className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
        currentStep >= step
          ? "bg-blue-600 border-blue-600 text-white"
          : "border-gray-300 text-gray-500"
      }`}
    >
      {currentStep > step ? (
        <CheckCircle2 className="w-5 h-5" />
      ) : (
        <Icon className="w-4 h-4" />
      )}
    </div>
    <span
      className={`font-medium ${
        currentStep >= step ? "text-blue-600" : "text-gray-500"
      }`}
    >
      {title}
    </span>
  </div>
);

export default function BookAppointmentForm({ onCancel = () => {} }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [appointmentData, setAppointmentData] = useState<AppointmentFormState>({
    patient: "",
    appointmentDate: new Date(),
    consultationType: "New",
    notes: "",
    timeSlot: "",
    treatments: [],
    teeth: [],
    contactNumber: "",
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

  const availableSlots = useMemo(() => {
    return timeSlots.map((slot) => ({
      time: slot,
      booked: bookedSlots.includes(slot),
      popular: ["10:00 AM", "02:00 PM", "04:00 PM"].includes(slot),
    }));
  }, [bookedSlots]);

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
    setCurrentStep(2);
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
      setErrorMessage("Please select a valid patient before proceeding.");
      setShowError(true);
      setShowRegisterPatient(true);
      return;
    }
    setPreviewData(appointmentData);
    setShowPreviewModal(true);
  };

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

      const result = await dispatch(createAppointment(payload));
      if (createAppointment.fulfilled.match(result)) {
        router.push("/dashboard/pages/Doctor/appointments");
        setShowPreviewModal(false);

        // Send SMS asynchronously
        try {
          const smsPayload = {
            phoneNumber: `+91${previewData.contactNumber}`,
            message: `Your appointment is confirmed for ${format(
              previewData.appointmentDate,
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
      } else {
        setModalError("Failed to create appointment. Please try again.");
      }
    } catch (error) {
      setModalError(
        "Error creating appointment. Please check your connection and try again."
      );
      console.error("Appointment creation error:", error);
    }
  };

  const progressValue = useMemo(() => {
    switch (currentStep) {
      case 1:
        return 25;
      case 2:
        return 50;
      case 3:
        return 75;
      case 4:
        return 100;
      default:
        return 0;
    }
  }, [currentStep]);

  return (
    <DashboardLayout>
      <div className="mx-5 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/pages/Doctor/appointments">
              <Button variant="outline" size="icon" className="rounded-full">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Book New Appointment
              </h1>
              <p className="text-gray-600">
                Schedule a new dental appointment for your patient
              </p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <FormStep
                currentStep={currentStep}
                step={1}
                title="Patient Info"
                icon={User}
              />
              <div className="flex-1 h-1 bg-gray-200 mx-4">
                <div
                  className="h-1 bg-blue-600 transition-all duration-300"
                  style={{ width: `${Math.max(0, (currentStep - 1) * 33)}%` }}
                />
              </div>
              <FormStep
                currentStep={currentStep}
                step={2}
                title="Date & Time"
                icon={CalendarIcon}
              />
              <div className="flex-1 h-1 bg-gray-200 mx-4">
                <div
                  className="h-1 bg-blue-600 transition-all duration-300"
                  style={{ width: `${Math.max(0, (currentStep - 2) * 33)}%` }}
                />
              </div>
              <FormStep
                currentStep={currentStep}
                step={3}
                title="Treatment"
                icon={Stethoscope}
              />
              <div className="flex-1 h-1 bg-gray-200 mx-4">
                <div
                  className="h-1 bg-blue-600 transition-all duration-300"
                  style={{ width: `${Math.max(0, (currentStep - 3) * 33)}%` }}
                />
              </div>
              <FormStep
                currentStep={currentStep}
                step={4}
                title="Review"
                icon={CheckCircle2}
              />
            </div>
            <Progress value={progressValue} color="bg-green-600" className="w-full" />
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Patient Information */}
          <Card
            className={`transition-all duration-300 ${
              currentStep >= 1 ? "opacity-100" : "opacity-60"
            }`}
          >
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Label
                  htmlFor="patient-search"
                  className="flex items-center mb-2"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search Patient
                </Label>
                <div className="relative">
                  <Input
                    id="patient-search"
                    value={patientQuery}
                    onChange={handlePatientChange}
                    placeholder="Search by Patient ID or Name..."
                    className="pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  {verifiedPatient && (
                    <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600 w-5 h-5" />
                  )}
                </div>

                {filteredSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredSuggestions.map((p) => (
                      <div
                        key={p._id}
                        className="p-3 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                        onClick={() => handleSelectPatient(p)}
                      >
                        <div className="font-medium text-gray-900">
                          {p.fullName}
                        </div>
                        <div className="text-sm text-gray-600">
                          ID: {p.PatientId}
                        </div>
                        {p.contactNumber && (
                          <div className="text-sm text-gray-500">
                            📞 {p.contactNumber}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {!verifiedPatient &&
                filteredSuggestions.length === 0 &&
                patientQuery && (
                  <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center">
                    <User className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 mb-2">Patient not found</p>
                    <Button
                      type="button"
                      onClick={() => setShowRegisterPatient(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Register New Patient
                    </Button>
                  </div>
                )}

              {verifiedPatient && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="font-medium text-green-800">
                      Patient Verified
                    </div>
                    <div className="text-sm text-green-600">{patientQuery}</div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Date & Time */}
          <Card
            className={`transition-all duration-300 ${
              currentStep >= 2 ? "opacity-100" : "opacity-60"
            }`}
          >
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg">
                <CalendarIcon className="w-5 h-5 mr-2 text-blue-600" />
                Date & Time Selection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="flex items-center mb-3">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Appointment Date
                </Label>
                <Card className="border-2">
                  <Calendar
                    mode="single"
                    selected={appointmentData.appointmentDate}
                    onSelect={(date) => {
                      if (date) {
                        setAppointmentData((prev) => ({
                          ...prev,
                          appointmentDate: date,
                        }));
                        setCurrentStep(2);
                      }
                    }}
                    defaultMonth={new Date()}
                    disabled={{ before: new Date() }}
                    className="rounded-md border"
                  />
                </Card>
              </div>

              <div>
                <Label className="flex items-center mb-3">
                  <Clock className="w-4 h-4 mr-2" />
                  Available Time Slots
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {availableSlots.map(({ time, booked, popular }) => (
                    <TooltipProvider key={time}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant={
                              appointmentData.timeSlot === time
                                ? "default"
                                : "outline"
                            }
                            disabled={booked}
                            onClick={() => {
                              setAppointmentData((prev) => ({
                                ...prev,
                                timeSlot: time,
                              }));
                              setCurrentStep(3);
                            }}
                            className={`h-12 relative ${
                              appointmentData.timeSlot === time
                                ? "bg-blue-600 text-white"
                                : booked
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "hover:border-blue-600"
                            } ${
                              popular && !booked
                                ? "border-2 border-orange-200"
                                : ""
                            }`}
                          >
                            {time}
                            {popular && !booked && (
                              <Badge
                                variant="secondary"
                                className="absolute -top-2 -right-2 text-xs bg-orange-500 text-white"
                              >
                                Popular
                              </Badge>
                            )}
                            {booked && <AlertCircle className="w-4 h-4 ml-1" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {booked
                            ? "This slot is already booked"
                            : popular
                            ? "Popular time slot"
                            : "Available"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Treatment Details */}
          <Card
            className={`transition-all duration-300 ${
              currentStep >= 3 ? "opacity-100" : "opacity-60"
            }`}
          >
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg">
                <Stethoscope className="w-5 h-5 mr-2 text-blue-600" />
                Treatment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs defaultValue="consultation" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="consultation">Consultation</TabsTrigger>
                  <TabsTrigger value="treatments">Treatments</TabsTrigger>
                  <TabsTrigger value="teeth">Teeth</TabsTrigger>
                </TabsList>

                <TabsContent value="consultation" className="space-y-4 pt-4">
                  <div>
                    <Label>Consultation Type</Label>
                    <Select
                      value={appointmentData.consultationType}
                      onValueChange={(value: ConsultationType) =>
                        setAppointmentData((prev) => ({
                          ...prev,
                          consultationType: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="New" className="flex items-center">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            New Consultation
                          </div>
                        </SelectItem>
                        <SelectItem value="Follow-up">
                          <div className="flex items-center">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Follow-up Visit
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="flex items-center">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Additional Notes
                    </Label>
                    <Input
                      value={appointmentData.notes}
                      onChange={(e) =>
                        setAppointmentData((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      placeholder="Any special instructions or patient concerns..."
                    />
                  </div>
                </TabsContent>

                <TabsContent value="treatments" className="space-y-4 pt-4">
                  <div>
                    <Label>Select Treatments</Label>
                    <MultiSelect
                      options={treatmentOptionsForSelect}
                      onValueChange={(values) =>
                        handleMultiSelectChange("treatments", values)
                      }
                      defaultValue={appointmentData.treatments}
                      placeholder="Choose treatments..."
                      variant="secondary"
                      maxCount={5}
                    />
                    {appointmentData.treatments.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {appointmentData.treatments.map((treatment) => (
                          <Badge
                            key={treatment}
                            variant="secondary"
                            className="bg-blue-100 text-blue-800"
                          >
                            {treatment}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="teeth" className="space-y-4 pt-4">
                  <div>
                    <Label className="flex items-center">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Teeth Involved
                    </Label>
                    <MultiSelect
                      options={teethOptionsForSelect}
                      onValueChange={(values) =>
                        handleMultiSelectChange("teeth", values)
                      }
                      defaultValue={appointmentData.teeth}
                      placeholder="Select teeth numbers..."
                      variant="secondary"
                      maxCount={8}
                    />
                    {appointmentData.teeth.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {appointmentData.teeth.map((tooth) => (
                          <Badge
                            key={tooth}
                            variant="secondary"
                            className="bg-green-100 text-green-800"
                          >
                            #{tooth}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <div className="space-x-3">
              <Link href="/dashboard/pages/Doctor/appointments">
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              </Link>
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setCurrentStep((prev) => Math.max(1, prev - 1))
                  }
                >
                  Previous
                </Button>
              )}
            </div>

            <div className="space-x-3">
              {currentStep < 4 && (
                <Button
                  type="button"
                  onClick={() =>
                    setCurrentStep((prev) => Math.min(4, prev + 1))
                  }
                  disabled={currentStep === 1 && !verifiedPatient}
                >
                  Continue
                </Button>
              )}
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!verifiedPatient}
                onClick={() => setCurrentStep(4)}
              >
                Review & Book Appointment
              </Button>
            </div>
          </div>
        </form>

        {/* Error Dialog */}
        {showError && (
          <Dialog open={true} onOpenChange={() => setShowError(false)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center text-red-600">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Patient Selection Required
                </DialogTitle>
                <DialogDescription>{errorMessage}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <div className="flex space-x-2 w-full">
                  {showRegisterPatient && (
                    <Link
                      href="/dashboard/pages/Doctor/patientRecords/patientRegistrationForm"
                      className="flex-1"
                    >
                      <Button className="w-full">Register New Patient</Button>
                    </Link>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setShowError(false)}
                    className="flex-1"
                  >
                    Try Again
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Preview Dialog */}
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
          description="Please review all details before confirming the appointment"
          confirmButtonText="Confirm Appointment"
        >
          <div className="space-y-6">
            {/* Patient Information */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Patient Information
              </h3>
              <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                <div>
                  <dt className="text-sm text-muted-foreground">Patient</dt>
                  <dd className="font-medium">{patientQuery}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Contact</dt>
                  <dd>{previewData?.contactNumber || "Not provided"}</dd>
                </div>
              </div>
            </div>

            {/* Appointment Details */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2 text-blue-600" />
                Appointment Details
              </h3>
              <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                <div>
                  <dt className="text-sm text-muted-foreground">Date</dt>
                  <dd className="font-medium">
                    {previewData?.appointmentDate &&
                      format(previewData.appointmentDate, "PPP")}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Time Slot</dt>
                  <dd className="font-medium">{previewData?.timeSlot}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">
                    Consultation Type
                  </dt>
                  <dd>
                    <Badge
                      variant={
                        previewData?.consultationType === "New"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {previewData?.consultationType}
                    </Badge>
                  </dd>
                </div>
              </div>
            </div>

            {/* Treatments */}
            {previewData?.treatments && previewData.treatments.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center">
                  <Stethoscope className="w-5 h-5 mr-2 text-blue-600" />
                  Selected Treatments
                </h3>
                <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg">
                  {previewData.treatments.map((treatment) => (
                    <Badge
                      key={treatment}
                      variant="secondary"
                      className="bg-blue-100 text-blue-800 px-3 py-1"
                    >
                      {treatment}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Teeth Involved */}
            {previewData?.teeth && previewData.teeth.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-blue-600" />
                  Teeth Involved
                </h3>
                <div className="flex flex-wrap gap-2 p-3 bg-green-50 rounded-lg">
                  {previewData.teeth.map((tooth) => (
                    <Badge
                      key={tooth}
                      variant="secondary"
                      className="bg-green-100 text-green-800 px-3 py-1"
                    >
                      #{tooth}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {previewData?.notes && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2 text-blue-600" />
                  Additional Notes
                </h3>
                <p className="text-muted-foreground p-3 bg-gray-50 rounded-lg">
                  {previewData.notes}
                </p>
              </div>
            )}
          </div>
        </PreviewDialog>
      </div>
    </DashboardLayout>
  );
}
