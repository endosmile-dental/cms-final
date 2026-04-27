"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/app/dashboard/layout/DashboardLayout";
import Loading from "@/app/components/loading/Loading";
import DataTable from "@/app/components/DataTable";
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  Filter,
  Search,
  AlertCircle,
  Loader,
  Clock,
  MessageCircle,
  Stethoscope,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar as DateCalendar } from "@/components/ui/calendar";
import { MultiSelect } from "@/components/ui/multi-select";
import { Badge } from "@/components/ui/badge";
import {
  fetchAvailability,
  selectBookedSlots,
} from "@/app/redux/slices/appointmentSlice";
import { useAppDispatch, useAppSelector } from "@/app/redux/store/hooks";
import { selectActiveTreatments } from "@/app/redux/slices/treatmentSlice";
import {
  formatForInput,
  getLocalDate,
  parseDateFromServer,
  startOfDayIST,
} from "@/app/utils/dateUtils";
import {
  timeSlots,
  teethOptions,
} from "@/app/components/doctor/CreateAppointmentModalForm";

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
  paymentStatus?: "Pending" | "Paid" | "Partial" | "Refunded";
  amount?: number;
  createdAt: string;
}

interface IDoctor {
  _id: string;
  fullName: string;
  specialization?: string;
}

interface TransformedAppointment {
  _id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  date: string;
  timeSlot: string;
  consultationType: "New" | "Follow-up";
  status: "Scheduled" | "Completed" | "Cancelled";
  treatments: string[];
  teeth: string[];
}

type AppointmentStatus = IAppointment["status"];
type ConsultationType = IAppointment["consultationType"];

const convertTo24Hour = (time12h: string): string => {
  const [time, modifier] = time12h.split(" ");
  const [hours, minutes] = time.split(":");

  let h = parseInt(hours, 10);
  if (modifier === "PM" && h !== 12) h += 12;
  if (modifier === "AM" && h === 12) h = 0;

  return `${String(h).padStart(2, "0")}:${minutes}`;
};

const parseTimeSlot = (timeSlotValue: string): number => {
  const [startTime] = timeSlotValue.split(" - ");
  const date = new Date(`1970-01-01T${convertTo24Hour(startTime)}:00`);
  return date.getTime();
};

export default function AppointmentsPageClient() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [appointments, setAppointments] = useState<IAppointment[]>([]);
  const [doctors, setDoctors] = useState<IDoctor[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<
    IAppointment[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [editingAppointment, setEditingAppointment] =
    useState<IAppointment | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [consultationFilter, setConsultationFilter] = useState<string>("all");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [editErrorMessage, setEditErrorMessage] = useState<string | null>(null);
  const [editSelectedDate, setEditSelectedDate] = useState<Date | undefined>(
    undefined
  );
  const bookedSlots = useAppSelector(selectBookedSlots);
  const activeTreatments = useAppSelector(selectActiveTreatments);

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    doctor: "",
    appointmentDate: "",
    status: "Scheduled" as AppointmentStatus,
    consultationType: "New" as ConsultationType,
    timeSlot: "",
    notes: "",
    treatments: [] as string[],
    teeth: [] as string[],
  });

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

  // Fetch appointments
  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/doctor/appointments/fetchAppointments");
      if (!response.ok) throw new Error("Failed to fetch appointments");

      const data = await response.json();
      setAppointments(data.appointments || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to fetch appointments");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const response = await fetch("/api/doctor/fetchDoctors");
        if (!response.ok) throw new Error("Failed to fetch doctors");

        const data = await response.json();
        setDoctors(data.doctors || []);
      } catch (error) {
        console.error("Error loading doctors:", error);
        toast.error("Failed to load doctors");
      }
    };

    loadDoctors();
  }, []);

  useEffect(() => {
    if (showEditModal) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showEditModal]);

  type ColumnDef<T> = {
    header: string;
    accessorKey: string;
    sortable?: boolean;
    render?: (value: unknown, row: T) => React.ReactNode;
  };

  // Filter appointments based on search and filters
  useEffect(() => {
    let filtered = appointments;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (apt) =>
          apt.patient.fullName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          apt.patient.contactNumber.includes(searchTerm) ||
          apt.patient.PatientId.includes(searchTerm) ||
          apt.doctor?.fullName
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((apt) => apt.status === statusFilter);
    }

    // Consultation type filter
    if (consultationFilter !== "all") {
      filtered = filtered.filter(
        (apt) => apt.consultationType === consultationFilter
      );
    }

    setFilteredAppointments(filtered);
  }, [appointments, searchTerm, statusFilter, consultationFilter]);

  // Delete appointment
  const handleDelete = async (appointmentId: string) => {
    try {
      const response = await fetch(
        `/api/doctor/appointments/delete/${appointmentId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Failed to delete appointment");

      setAppointments(appointments.filter((apt) => apt._id !== appointmentId));
      setDeleteConfirmId(null);
      toast.success("Appointment deleted successfully");
    } catch (error) {
      console.error("Error deleting appointment:", error);
      toast.error("Failed to delete appointment");
    }
  };

  // Handle edit appointment
  const handleEditOpen = (appointment: IAppointment) => {
    const normalizedAppointmentDate = parseDateFromServer(
      appointment.appointmentDate
    );

    setEditingAppointment(appointment);
    setEditFormData({
      doctor: appointment.doctor._id,
      appointmentDate: formatForInput(normalizedAppointmentDate),
      status: appointment.status,
      consultationType: appointment.consultationType,
      timeSlot: appointment.timeSlot,
      notes: appointment.notes || "",
      treatments: Array.isArray(appointment.treatments)
        ? appointment.treatments
        : [],
      teeth: Array.isArray(appointment.teeth) ? appointment.teeth : [],
    });
    setEditSelectedDate(normalizedAppointmentDate);
    setEditErrorMessage(null);
    setShowEditModal(true);
  };

  const handleEditClose = () => {
    setShowEditModal(false);
    setEditingAppointment(null);
    setEditSelectedDate(undefined);
    setEditErrorMessage(null);
  };

  useEffect(() => {
    if (!showEditModal || !editFormData.doctor || !editFormData.appointmentDate) {
      return;
    }

    setAvailabilityLoading(true);
    setEditErrorMessage(null);

    dispatch(
      fetchAvailability({
        doctorId: editFormData.doctor,
        date: editFormData.appointmentDate,
      })
    )
      .unwrap()
      .catch(() => {
        setEditErrorMessage("Failed to load available slots. Please try again.");
      })
      .finally(() => {
        setAvailabilityLoading(false);
      });
  }, [
    dispatch,
    editFormData.doctor,
    editFormData.appointmentDate,
    showEditModal,
  ]);

  const availableSlots = useMemo(() => {
    const slots = Array.isArray(bookedSlots) ? bookedSlots : [];
    const originalDate =
      editingAppointment?.appointmentDate &&
      formatForInput(parseDateFromServer(editingAppointment.appointmentDate));
    const isOriginalDate = originalDate === editFormData.appointmentDate;
    const isOriginalDoctor = editingAppointment?.doctor?._id === editFormData.doctor;

    return timeSlots.map((slot) => ({
      time: slot,
      booked:
        slots.includes(slot) &&
        !(isOriginalDate && isOriginalDoctor && editingAppointment?.timeSlot === slot),
      popular: ["10:00 AM", "02:00 PM", "04:00 PM"].includes(slot),
    }));
  }, [bookedSlots, editFormData.appointmentDate, editFormData.doctor, editingAppointment]);

  const handleUpdateAppointment = async () => {
    if (!editingAppointment) return;
    if (!editFormData.doctor) {
      toast.error("Please select a doctor");
      return;
    }
    if (!editFormData.timeSlot) {
      toast.error("Please select a time slot");
      return;
    }

    const selectedSlot = availableSlots.find(
      (slot) => slot.time === editFormData.timeSlot
    );
    if (selectedSlot?.booked) {
      toast.error("Please select an available time slot");
      return;
    }

    try {
      setEditLoading(true);

      const payload = {
        _id: editingAppointment._id,
        doctor: editFormData.doctor,
        appointmentDate: editFormData.appointmentDate,
        status: editFormData.status,
        consultationType: editFormData.consultationType,
        timeSlot: editFormData.timeSlot,
        notes: editFormData.notes,
        treatments: editFormData.treatments,
        teeth: editFormData.teeth,
        paymentStatus: editingAppointment.paymentStatus,
        amount: editingAppointment.amount,
      };

      const response = await fetch("/api/doctor/appointments/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update appointment");
      }

      await fetchAppointments();
      handleEditClose();
      toast.success("Appointment updated successfully");
    } catch (error) {
      console.error("Error updating appointment:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update appointment"
      );
    } finally {
      setEditLoading(false);
    }
  };

  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const { upcomingAppointments, pastAppointments } = useMemo(() => {
    const upcoming = filteredAppointments
      .filter((appointment) => new Date(appointment.appointmentDate) >= today)
      .sort((a, b) => {
        const dateA = new Date(a.appointmentDate).getTime();
        const dateB = new Date(b.appointmentDate).getTime();

        if (dateA !== dateB) return dateA - dateB;
        return parseTimeSlot(a.timeSlot) - parseTimeSlot(b.timeSlot);
      });

    const past = filteredAppointments
      .filter((appointment) => new Date(appointment.appointmentDate) < today)
      .sort((a, b) => {
        const dateA = new Date(a.appointmentDate).getTime();
        const dateB = new Date(b.appointmentDate).getTime();

        if (dateA !== dateB) return dateB - dateA;
        return parseTimeSlot(b.timeSlot) - parseTimeSlot(a.timeSlot);
      });

    return {
      upcomingAppointments: upcoming,
      pastAppointments: past,
    };
  }, [filteredAppointments, today]);

  const transformData = (
    appointmentList: IAppointment[]
  ): TransformedAppointment[] => {
    return appointmentList.map((appointment) => {
      const appointmentDate = new Date(appointment.appointmentDate);
      const utcDate = new Date(
        Date.UTC(
          appointmentDate.getFullYear(),
          appointmentDate.getMonth(),
          appointmentDate.getDate()
        )
      );

      return {
        _id: appointment._id,
        patientId: appointment.patient?.PatientId ?? "NA",
        patientName: appointment.patient?.fullName ?? "NA",
        doctorName: appointment.doctor?.fullName ?? "NA",
        date: utcDate.toLocaleDateString("en-GB"),
        timeSlot: appointment.timeSlot ?? "NA",
        consultationType: appointment.consultationType,
        status: appointment.status,
        treatments: appointment.treatments ?? [],
        teeth: appointment.teeth ?? [],
      };
    });
  };

  const transformedUpcoming = useMemo(
    () => transformData(upcomingAppointments),
    [upcomingAppointments]
  );

  const transformedPast = useMemo(
    () => transformData(pastAppointments),
    [pastAppointments]
  );

  const columns = useMemo(
    () =>
      [
        {
          header: "ID",
          accessorKey: "patientId",
          sortable: true,
        },
        {
          header: "Patient",
          accessorKey: "patientName",
          sortable: true,
        },
        {
          header: "Doctor",
          accessorKey: "doctorName",
          sortable: true,
        },
        {
          header: "Date",
          accessorKey: "date",
          sortable: true,
          render: (_value: unknown, row: TransformedAppointment) => (
            <div>
              <p className="font-medium">{row.date}</p>
              <p className="text-xs text-gray-500">{row.timeSlot}</p>
            </div>
          ),
        },
        {
          header: "Treatments",
          accessorKey: "treatments",
          sortable: true,
          render: (value: unknown) => {
            const treatmentsValue = Array.isArray(value) ? value : [];
            return treatmentsValue.length > 0 ? treatmentsValue.join(", ") : "N/A";
          },
        },
        {
          header: "Teeth",
          accessorKey: "teeth",
          sortable: true,
          render: (value: unknown) => {
            const teethValue = Array.isArray(value) ? value : [];
            return teethValue.length > 0 ? teethValue.join(", ") : "N/A";
          },
        },
        {
          header: "Status",
          accessorKey: "status",
          sortable: true,
          render: (value: unknown) => (
            <span
              className={`px-2 py-1 rounded text-xs font-semibold ${
                value === "Scheduled"
                  ? "bg-blue-100 text-blue-800"
                  : value === "Completed"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
              }`}
            >
              {String(value)}
            </span>
          ),
        },
        {
          header: "Actions",
          accessorKey: "_id",
          sortable: false,
          render: (_value: unknown, row: TransformedAppointment) => (
            <div
              className="flex gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const appointment = appointments.find(
                    (item) => item._id === row._id
                  );
                  if (appointment) {
                    handleEditOpen(appointment);
                  }
                }}
              >
                <Edit size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteConfirmId(row._id)}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          ),
        },
      ] as ColumnDef<TransformedAppointment>[],
    [appointments]
  );

  if (loading) {
    return (
      <DashboardLayout>
        <Loading />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Calendar size={32} />
              Appointments Management
            </h1>
            <p className="text-gray-600 mt-1">
              Total: {filteredAppointments.length} appointments
            </p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/pages/Assistant/appointments/bookAppointment")}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus size={20} className="mr-2" />
            New Appointment
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-3 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search patient, doctor, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            {/* Consultation Type Filter */}
            <select
              value={consultationFilter}
              onChange={(e) => setConsultationFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="New">New</option>
              <option value="Follow-up">Follow-up</option>
            </select>

            {/* Reset Filters */}
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setConsultationFilter("all");
              }}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium"
            >
              <Filter size={18} className="inline mr-2" />
              Reset
            </button>
          </div>
        </div>

        {/* Appointments Table */}
        {transformedUpcoming.length === 0 && transformedPast.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">
              {appointments.length === 0
                ? "No appointments found"
                : "No appointments match your filters"}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <DataTable
              title="Upcoming Appointments"
              columns={columns}
              data={transformedUpcoming}
              searchFields={[
                "patientName",
                "patientId",
                "doctorName",
                "status",
                "date",
                "treatments",
              ]}
              itemsPerPage={5}
              enableDateFilter
              dateField="date"
              showSearch={false}
            />

            <DataTable
              title="Past Appointments"
              columns={columns}
              data={transformedPast}
              searchFields={[
                "patientName",
                "patientId",
                "doctorName",
                "consultationType",
                "status",
                "date",
              ]}
              itemsPerPage={5}
              enableDateFilter
              dateField="date"
              showSearch={false}
            />
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editingAppointment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-xl border bg-white shadow-2xl">
              <div className="border-b bg-gradient-to-r from-blue-500/10 to-transparent p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">
                      Edit Appointment
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Update doctor, date, slot, and treatment details
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleEditClose}
                    className="rounded-full p-2 transition-colors duration-200 hover:bg-muted"
                    aria-label="Close modal"
                  >
                    <X className="h-5 w-5 text-foreground" />
                  </button>
                </div>
              </div>

              <div key={editingAppointment._id} className="max-h-[60vh] space-y-6 overflow-y-auto p-6">
                <div className="space-y-2">
                  <Label>Doctor</Label>
                  <Select
                    value={editFormData.doctor}
                    onValueChange={(val) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        doctor: val,
                        timeSlot:
                          val === editingAppointment.doctor._id
                            ? prev.timeSlot
                            : "",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor._id} value={doctor._id}>
                          {doctor.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar size={16} />
                      Appointment Date
                    </Label>
                    <DateCalendar
                      mode="single"
                      selected={editSelectedDate}
                      defaultMonth={editSelectedDate}
                      onSelect={(date) => {
                        if (!date) return;

                        const normalizedDate = startOfDayIST(date);
                        setEditFormData((prev) => ({
                          ...prev,
                          appointmentDate: formatForInput(normalizedDate),
                        }));
                        setEditSelectedDate(normalizedDate);
                      }}
                      disabled={{ before: startOfDayIST(getLocalDate()) }}
                      className="rounded-md border p-3"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Clock size={16} />
                      Time Slot
                    </Label>
                    {availabilityLoading && (
                      <div className="flex items-center justify-center py-2 text-sm text-gray-500">
                        <Loader size={16} className="mr-2 animate-spin" />
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
                          variant={
                            editFormData.timeSlot === time ? "default" : "outline"
                          }
                          disabled={booked}
                          onClick={() =>
                            setEditFormData((prev) => ({
                              ...prev,
                              timeSlot: time,
                            }))
                          }
                          className={`relative h-8 text-xs ${
                            booked ? "cursor-not-allowed opacity-50" : ""
                          } ${popular && !booked ? "border-2 border-orange-200" : ""}`}
                        >
                          {time}
                          {popular && !booked && (
                            <Badge
                              variant="secondary"
                              className="absolute -top-1.5 -right-1 h-auto bg-orange-500 px-1 py-0 text-[8px]"
                            >
                              ★
                            </Badge>
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MessageCircle size={16} />
                    Consultation Type
                  </Label>
                  <Select
                    value={editFormData.consultationType}
                    onValueChange={(val: ConsultationType) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        consultationType: val,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New">New Consultation</SelectItem>
                      <SelectItem value="Follow-up">Follow-up Visit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border-t pt-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Stethoscope size={18} className="text-blue-600" />
                    <h3 className="text-lg font-semibold">Treatment Details</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Treatments</Label>
                      <MultiSelect
                        options={treatmentOptions}
                        onValueChange={(values) =>
                          setEditFormData((prev) => ({
                            ...prev,
                            treatments: values,
                          }))
                        }
                        defaultValue={editFormData.treatments}
                        placeholder="Select treatments..."
                        variant="secondary"
                        maxCount={5}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Teeth</Label>
                      <MultiSelect
                        options={teethOptionsForSelect}
                        onValueChange={(values) =>
                          setEditFormData((prev) => ({
                            ...prev,
                            teeth: values,
                          }))
                        }
                        defaultValue={editFormData.teeth}
                        placeholder="Select teeth numbers..."
                        variant="secondary"
                        maxCount={8}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={editFormData.status}
                        onValueChange={(val: AppointmentStatus) =>
                          setEditFormData((prev) => ({ ...prev, status: val }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Scheduled">Scheduled</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {editErrorMessage && (
                  <div className="flex items-center rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                    <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                    {editErrorMessage}
                  </div>
                )}

                <div className="border-t pt-6">
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <textarea
                      className="w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      value={editFormData.notes}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      placeholder="Add notes..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t bg-muted/50 p-6">
                <Button
                  variant="outline"
                  onClick={handleEditClose}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateAppointment}
                  disabled={editLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {editLoading ? (
                    <>
                      <Loader size={18} className="mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm">
              <h3 className="text-lg font-semibold mb-4">
                Delete Appointment?
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this appointment? This action
                cannot be undone.
              </p>
              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirmId)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
