"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMemoizedCalculations, useFilteredData } from "@/app/hooks/useMemoizedCalculations";
import { useDebounce } from "@/app/hooks/useOptimizedRender";
import { useAppDispatch, useAppSelector } from "@/app/redux/store/hooks";
import { hydrateAppointments } from "@/app/redux/slices/appointmentSlice";
import { hydratePatients } from "@/app/redux/slices/patientSlice";
import { hydrateStore } from "@/app/redux/slices/hydrationSlice";
import DashboardLayout from "@/app/dashboard/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  BookPlus,
  Calendar,
  CalendarDays,
  Edit,
  FileClock,
  Trash,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import {
  selectAppointments,
  editAppointment,
  removeAppointment,
} from "@/app/redux/slices/appointmentSlice";
import type { Appointment } from "@/app/redux/slices/appointmentSlice";
import { selectPatients } from "@/app/redux/slices/patientSlice";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  teethOptions,
  timeSlots,
} from "@/app/components/BookAppointmentForm";
import {
  selectActiveTreatments,
} from "@/app/redux/slices/treatmentSlice";
import { MultiSelect } from "@/components/ui/multi-select";
import DataTable from "@/app/components/DataTable";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import DashboardPieChart from "@/app/dashboard/ui/DashboardPieChart";
import FrequencyCard from "@/app/components/FrequencyCard";
import { DialogFooterActions } from "@/app/components/DialogFooterActions";
import Modal from "@/app/components/Modal";

interface TransformedAppointment {
  _id: string;
  patientId: string;
  patientName: string;
  date: string;
  timeSlot: string;
  contactNumber: string;
  consultationType: "New" | "Follow-up";
  status: "Scheduled" | "Completed" | "Cancelled";
  treatments: string[];
  teeth: string[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function DoctorAppointmentsClient({
  initialAppointments
}: {
  initialAppointments?: Appointment[]
}) {
  const dispatch = useAppDispatch();
  const appointments = useAppSelector(selectAppointments);
  const patients = useAppSelector(selectPatients);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<{
    _id: string;
    appointmentDate: string;
    status: "Scheduled" | "Completed" | "Cancelled";
    consultationType: "New" | "Follow-up";
    timeSlot: string;
    treatments: string[];
    teeth: string[];
  } | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Scheduled" | "Completed" | "Cancelled">("All");
  const [typeFilter, setTypeFilter] = useState<"All" | "New" | "Follow-up">("All");

  const dialogRef = useRef<HTMLDivElement>(null);

  const debouncedSetSearch = useDebounce((value: string) => {
    setSearchQuery(value);
  }, 250);

  const [openAppointmentDialog, setOpenAppointmentDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<TransformedAppointment | null>(null);
  const activeTreatments = useAppSelector(selectActiveTreatments);

  const getPatientInfo = (patientId: string) => {
    return patients.find((p) => p._id === patientId) || null;
  };

  // Use Redux data as primary source, with SSR data as initial fallback
  const displayAppointments: Appointment[] = appointments.length > 0
    ? appointments
    : (initialAppointments || []);

  const filteredAppointments = useFilteredData<Appointment>(
    displayAppointments,
    {
      status: statusFilter === "All" ? "" : statusFilter,
      consultationType: typeFilter === "All" ? "" : typeFilter,
    },
    searchQuery
  );

  // Appoointment statistics for charts
  const appointmentStats = useMemoizedCalculations(
    [filteredAppointments],
    () => {
    const statusCounts = {
      Scheduled: 0,
      Completed: 0,
      Cancelled: 0,
    };

    // NEW: Time-based status counters
    const now = new Date();
    const weeklyCounts = { Scheduled: 0, Completed: 0, Cancelled: 0 };
    const monthlyCounts = { Scheduled: 0, Completed: 0, Cancelled: 0 };
    const yearlyCounts = { Scheduled: 0, Completed: 0, Cancelled: 0 };

    const treatmentCounts: Record<string, number> = {};
    const timeSlotCounts: Record<string, number> = {};

    // Process appointment data for charts
    filteredAppointments.forEach((appointment) => {
      const appDate = new Date(appointment.appointmentDate);

      // Update overall status counts
      statusCounts[appointment.status] =
        (statusCounts[appointment.status] || 0) + 1;

      // NEW: Update time-based status counts
      // Weekly (last 7 days)
      if (appDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)) {
        weeklyCounts[appointment.status]++;
      }

      // Monthly (last 30 days)
      if (appDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)) {
        monthlyCounts[appointment.status]++;
      }

      // Yearly (current year)
      if (appDate.getFullYear() === now.getFullYear()) {
        yearlyCounts[appointment.status]++;
      }

      // Count treatments
      appointment.treatments?.forEach((treatment) => {
        treatmentCounts[treatment] = (treatmentCounts[treatment] || 0) + 1;
      });

      // Count time slots
      if (appointment.timeSlot) {
        timeSlotCounts[appointment.timeSlot] =
          (timeSlotCounts[appointment.timeSlot] || 0) + 1;
      }
    });

    // Format data for pie chart (status distribution)
    const statusData = Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value,
    }));

    // NEW: Format time-based status data
    const statusByTime = {
      weekly: Object.entries(weeklyCounts).map(([name, value]) => ({
        name,
        value,
      })),
      monthly: Object.entries(monthlyCounts).map(([name, value]) => ({
        name,
        value,
      })),
      yearly: Object.entries(yearlyCounts).map(([name, value]) => ({
        name,
        value,
      })),
    };

    // Format data for bar chart (treatment popularity)
    const treatmentData = Object.entries(treatmentCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({
        name,
        value,
      }));

    // Format data for time slot heatmap
    const timeSlotData = Object.entries(timeSlotCounts)
      .map(([name, value]) => ({
        time: name,
        appointments: value,
      }))
      .sort((a, b) => timeSlots.indexOf(a.time) - timeSlots.indexOf(b.time));

    return {
      statusData, // Overall status data
      statusByTime, // NEW: Time-based status data
      treatmentData,
      timeSlotData,
    };
    }
  );

  // Define the type for column definitions

  type ColumnDef<T> = {
    header: string;
    accessorKey: keyof T;
    sortable?: boolean;
    render?: (value: unknown, row: T) => React.ReactNode;
  };



  const parseTimeSlot = (timeSlot: string): number => {
    // Extract start time (e.g. "10:00 AM" from "10:00 AM - 10:30 AM")
    const [startTime] = timeSlot.split(" - ");
    const date = new Date(`1970-01-01T${convertTo24Hour(startTime)}:00`);
    return date.getTime();
  };

  const convertTo24Hour = (time12h: string): string => {
    // Convert "3:30 PM" → "15:30"
    const [time, modifier] = time12h.split(" ");
    const [hours, minutes] = time.split(":");

    let h = parseInt(hours, 10);
    if (modifier === "PM" && h !== 12) h += 12;
    if (modifier === "AM" && h === 12) h = 0;

    return `${String(h).padStart(2, "0")}:${minutes}`;
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { upcomingAppointments, pastAppointments } = useMemoizedCalculations(
    [filteredAppointments],
    () => {
      const upcomingAppointments = filteredAppointments
        .filter((appointment) => new Date(appointment.appointmentDate) >= today)
        .sort((a, b) => {
          const dateA = new Date(a.appointmentDate).getTime();
          const dateB = new Date(b.appointmentDate).getTime();

          if (dateA !== dateB) return dateA - dateB;
          return parseTimeSlot(a.timeSlot) - parseTimeSlot(b.timeSlot);
        });

      const pastAppointments = filteredAppointments
        .filter((appointment) => new Date(appointment.appointmentDate) < today)
        .sort((a, b) => {
          const dateA = new Date(a.appointmentDate).getTime();
          const dateB = new Date(b.appointmentDate).getTime();

          if (dateA !== dateB) return dateB - dateA; // latest first
          return parseTimeSlot(b.timeSlot) - parseTimeSlot(a.timeSlot);
        });

      return { upcomingAppointments, pastAppointments };
    }
  );

  const normalizeDate = (value: unknown): string | undefined => {
    if (!value) return undefined;
    if (typeof value === "string") return value;
    if (value instanceof Date) return value.toISOString();
    if (typeof value === "object" && "toISOString" in value) {
      try {
        return (value as Date).toISOString();
      } catch {
        return undefined;
      }
    }
    return undefined;
  };

  const normalizedInitialAppointments = useMemo(() => {
    if (!initialAppointments) return [];
    return initialAppointments.map((appointment) => ({
      ...appointment,
      appointmentDate:
        normalizeDate(appointment.appointmentDate) ?? "",
      createdAt: normalizeDate(appointment.createdAt) ?? "",
      updatedAt: normalizeDate(appointment.updatedAt) ?? "",
      rescheduledAt:
        normalizeDate(appointment.rescheduledAt) ?? undefined,
      cancelledAt: normalizeDate(appointment.cancelledAt) ?? undefined,
    }));
  }, [initialAppointments]);

  // Hydrate Redux store with SSR data on component mount
  useEffect(() => {
    if (normalizedInitialAppointments.length > 0) {
      // Hydrate appointments
      dispatch(hydrateAppointments(normalizedInitialAppointments));
      
      // If we have patient IDs, we need to fetch patient details
      // For now, we'll hydrate with empty patients array and let the component handle patient fetching
      dispatch(hydratePatients([]));
      
      // Mark store as hydrated
      dispatch(hydrateStore());
    }
  }, [normalizedInitialAppointments, dispatch]);

  useEffect(() => {
    // Debugging appointments data
  }, [pastAppointments, upcomingAppointments, appointments, initialAppointments]);

  const transformData = (
    appointments: Appointment[]
  ): TransformedAppointment[] => {
    return appointments.map((appointment) => {
      // Handle both cases: populated patient object or patient ID
      let patientInfo = null;

      if (appointment?.patient) {
        if (typeof appointment.patient === 'string') {
          // If it's a string (patient ID), try to get from Redux store
          patientInfo = getPatientInfo(appointment.patient);
        } else {
          // If it's an object (populated patient), use it directly
          patientInfo = appointment.patient;
        }
      }

      // Parse the appointment date as UTC to ensure consistent date display
      const appointmentDate = new Date(appointment.appointmentDate);
      const utcDate = new Date(Date.UTC(
        appointmentDate.getFullYear(),
        appointmentDate.getMonth(),
        appointmentDate.getDate()
      ));
      const dateStr = utcDate.toLocaleDateString("en-GB");

      return {
        _id: appointment._id,
        patientId: patientInfo?.PatientId ?? "NA",
        patientName: patientInfo?.fullName ?? "NA",
        date: dateStr,
        timeSlot: appointment.timeSlot ?? "NA",
        contactNumber: patientInfo?.contactNumber ?? "NA",
        consultationType: appointment.consultationType,
        status: appointment.status,
        treatments: appointment.treatments ?? [],
        teeth: appointment.teeth ?? [],
        notes: appointment.notes ?? "",
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt,
      };
    });
  };

  const transformedUpcoming = useMemoizedCalculations(
    [upcomingAppointments, patients],
    () => transformData(upcomingAppointments)
  );

  const transformedPast = useMemoizedCalculations(
    [pastAppointments, patients],
    () => transformData(pastAppointments)
  );

  // Open modal with appointment data to edit
  const handleEditAppointment = useCallback(
    (appointmentId: string) => {
      const appointmentToEdit = appointments.find(
        (appointment) => appointment._id === appointmentId
      );
      if (appointmentToEdit) {
        setEditForm({
          _id: appointmentToEdit._id,
          appointmentDate: appointmentToEdit.appointmentDate,
          status: appointmentToEdit.status,
          consultationType: appointmentToEdit.consultationType,
          timeSlot: appointmentToEdit.timeSlot || "",
          treatments: appointmentToEdit.treatments || [],
          teeth: appointmentToEdit.teeth || [],
        });

        setIsEditModalOpen(true);
      }
    },
    [appointments]
  );

  // Handle form field changes in the edit modal
  const handleEditFormChange = (field: string, value: string | string[]) => {
    if (editForm) {
      setEditForm({
        ...editForm,
        [field]: value,
      });
    }
  };

  // Submit the edit form and dispatch updated data with appointmentId
  const handleEditSubmit = async () => {
    if (editForm) {
      const appointmentToEdit = appointments.find(
        (appointment) => appointment._id === editForm._id
      );
      if (appointmentToEdit) {
        const updatedAppointment: Appointment = {
          ...appointmentToEdit,
          appointmentDate: editForm.appointmentDate,
          status: editForm.status,
          consultationType: editForm.consultationType,
          timeSlot: editForm.timeSlot,
          treatments: editForm.treatments,
          teeth: editForm.teeth,
        };
        
        // Dispatch the editAppointment action to update the Redux store
        await dispatch(editAppointment(updatedAppointment));
        setIsEditModalOpen(false);
      }
    }
  };

  // Open delete confirmation modal
  const handleDeleteAppointment = useCallback((appointmentId: string) => {
    setDeleteId(appointmentId);
    setIsDeleteModalOpen(true);
  }, []);

  // Confirm deletion and dispatch delete action
  const confirmDelete = () => {
    if (deleteId) {
      dispatch(removeAppointment(deleteId));
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    }
  };

  // Cancel delete action
  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setDeleteId(null);
  };

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
          header: "Date",
          accessorKey: "date",
          sortable: true,
        },
        {
          header: "Treatments",
          accessorKey: "treatments",
          sortable: true,
        },
        {
          header: "Teeth",
          accessorKey: "teeth",
          sortable: true,
        },
        {
          header: "Status",
          accessorKey: "status",
          sortable: true,
        },
        {
          header: "Actions",
          accessorKey: "_id",
          sortable: false,
          render: (_: unknown, row: TransformedAppointment) => (
            <div
              className="flex space-x-2"
              onClick={(e) => e.stopPropagation()} // Stop row click
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditAppointment(row._id)}
              >
                <Edit size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteAppointment(row._id)}
              >
                <Trash size={16} />
              </Button>
            </div>
          ),
        },
      ] as ColumnDef<TransformedAppointment>[],
    [handleEditAppointment, handleDeleteAppointment]
  );

  const handleMultiSelectChange = (field: string, values: string[]) => {
    if (editForm) {
      setEditForm({
        ...editForm,
        [field]: values,
      });
    }
  };

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

  function interpolateColor(
    color1: string,
    color2: string,
    factor: number
  ): string {
    const hexToRgb = (hex: string) =>
      hex
        .replace(/^#/, "")
        .match(/.{2}/g)!
        .map((x) => parseInt(x, 16));

    const rgbToHex = (rgb: number[]) =>
      "#" +
      rgb
        .map((x) => x.toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase();

    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);
    const result = c1.map((c, i) => Math.round(c + (c2[i] - c) * factor));
    return rgbToHex(result);
  }

  return (
    <DashboardLayout>
      <div className="p-2 md:p-0 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border border-purple-200/50 dark:border-purple-800/30">
              <Calendar className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
              <p className="text-muted-foreground">
                Manage and schedule patient appointments efficiently
              </p>
            </div>
          </div>

          <Link href="/dashboard/pages/Doctor/appointments/bookAppointment">
            <Button className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <BookPlus size={18} />
              <span className="hidden sm:inline">Add New</span>
            </Button>
          </Link>
        </div>

        <Separator className="border-border" />

        <div className="flex flex-wrap gap-3 items-center">
          <Input
            placeholder="Search appointments..."
            value={searchInput}
            onChange={(e) => {
              const value = e.target.value;
              setSearchInput(value);
              debouncedSetSearch(value);
            }}
            className="max-w-sm"
          />
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as "All" | "Scheduled" | "Completed" | "Cancelled")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              <SelectItem value="Scheduled">Scheduled</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={typeFilter}
            onValueChange={(value) => setTypeFilter(value as "All" | "New" | "Follow-up")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Consultation Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Types</SelectItem>
              <SelectItem value="New">New</SelectItem>
              <SelectItem value="Follow-up">Follow-up</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <DashboardPieChart
            title="Appointment Status Distribution"
            data={appointmentStats.statusByTime}
            enableTimeFrameSort={true}
            innerRadius={50}
            showPercentage={true}
            showLegend={true}
          />

          {appointmentStats.treatmentData && (
            <FrequencyCard
              title="Treatment Frequency"
              data={appointmentStats.treatmentData}
              total={appointments.length}
            />
          )}
        </div>

        <DataTable
          title="Upcoming Appointments"
          data={transformedUpcoming}
          columns={columns}
          searchFields={[
            "patientName",
            "patientId",
            "status",
            "date",
            "treatments",
          ]}
          itemsPerPage={5}
          onRowClick={(row) => {
            setSelectedAppointment(row);
            setOpenAppointmentDialog(true);
          }}
          enableDateFilter
          dateField="date"
          showSearch={false}
        />

        <DataTable
          title="Past Appointments"
          data={transformedPast}
          columns={columns}
          searchFields={[
            "patientName",
            "patientId",
            "consultationType",
            "status",
            "date",
            "contactNumber",
          ]}
          itemsPerPage={5}
          onRowClick={(row) => {
            setSelectedAppointment(row);
            setOpenAppointmentDialog(true);
          }}
          enableDateFilter
          dateField="date"
          showSearch={false}
        />

        {/* Time Slot Utilization Chart   */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">Time Slot Utilization</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {timeSlots.map((slot) => {
              const count =
                appointmentStats.timeSlotData.find((t) => t.time === slot)
                  ?.appointments || 0;

              const maxCount = Math.max(
                ...appointmentStats.timeSlotData.map(
                  (t) => t.appointments || 0
                ),
                1
              );

              const greenHex = "#10B981"; // Olive Green
              const redHex = "#EF4444"; // Red
              const percentage = Math.min(100, (count / maxCount) * 100);

              const heatColor = interpolateColor(
                greenHex,
                redHex,
                percentage / 100
              );

              return (
                <div key={slot} className="bg-card border-border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="text-center font-medium text-foreground">
                    {slot} - <span className="text-blue-500 dark:text-blue-400">{count}</span>
                  </div>
                  <div className="mt-2 h-32 relative">
                    <div
                      className="absolute bottom-0 w-full rounded-t"
                      style={{
                        backgroundColor: heatColor,
                        height: `${percentage}%`,
                      }}
                    />
                    <div
                      className={`absolute bottom-0 mb-2 w-full text-center ${percentage > 0 ? "text-white" : "text-foreground"
                        }`}
                    >
                      {percentage.toFixed(0)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Edit and Delete Modals remain unchanged */}
      </div>
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <h2 className="text-xl font-bold mb-4">Edit Appointment</h2>
        {editForm && (
          <div className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium">Date</label>
              <Input
                type="date"
                value={format(new Date(editForm.appointmentDate), "yyyy-MM-dd")}
                onChange={(e) =>
                  handleEditFormChange("appointmentDate", e.target.value)
                }
                className="w-full"
              />
            </div>

            {/* Time Slot */}
            <div>
              <label className="block mb-1 text-sm font-medium">Time Slot</label>
              <Select
                onValueChange={(value) =>
                  handleEditFormChange("timeSlot", value)
                }
                value={editForm.timeSlot}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Time Slot" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Treatments */}
            <div>
              <label className="block mb-1 text-sm font-medium">Treatments</label>
              <MultiSelect
                options={treatmentOptionsForSelect}
                onValueChange={(values) =>
                  handleMultiSelectChange("treatments", values)
                }
                defaultValue={editForm?.treatments}
                placeholder="Select treatments"
                variant="secondary"
                maxCount={3}
              />
            </div>

            {/* Teeth */}
            <div>
              <label className="block mb-1 text-sm font-medium">Teeth</label>
              <MultiSelect
                options={teethOptionsForSelect}
                onValueChange={(values) =>
                  handleMultiSelectChange("teeth", values)
                }
                defaultValue={editForm?.teeth}
                placeholder="Select teeth"
                variant="secondary"
                maxCount={5}
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Status</label>
              <Select
                onValueChange={(value) => handleEditFormChange("status", value)}
                value={editForm.status}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">
                Consultation Type
              </label>
              <Select
                onValueChange={(value) =>
                  handleEditFormChange("consultationType", value)
                }
                value={editForm.consultationType}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Follow-up">Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleEditSubmit} className="mr-2">
                Save
              </Button>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={cancelDelete}>
        <div className="space-y-4">
          <h2 className="text-xl font-bold mb-2">Confirm Deletion</h2>
          <p>Are you sure you want to delete this appointment?</p>
          <div className="flex justify-end">
            <Button
              onClick={confirmDelete}
              className="mr-2 bg-red-500 hover:bg-red-600"
            >
              Delete
            </Button>
            <Button variant="outline" onClick={cancelDelete}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      <Dialog
        open={openAppointmentDialog}
        onOpenChange={setOpenAppointmentDialog}
      >
        <DialogContent ref={dialogRef} className="max-w-2xl animate-fade-in">
          <DialogTitle className="text-2xl font-bold mb-4">
            <CalendarDays className="inline-block mr-2 h-6 w-6" />
            Appointment Details
          </DialogTitle>

          {selectedAppointment ? (
            <>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="col-span-2">
                  <p className="text-muted-foreground">Appointment ID</p>
                  <p className="font-medium">
                    {selectedAppointment._id.slice(-5)}
                  </p>
                </div>

                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-bold">
                    {new Date(selectedAppointment.date).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <p className="text-muted-foreground">Time Slot</p>
                  <p className="font-bold">
                    {selectedAppointment.timeSlot || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-muted-foreground">Consultation Type</p>
                  <p className="font-medium">
                    {selectedAppointment.consultationType}
                  </p>
                </div>

                <div>
                  <p className="text-muted-foreground">Status</p>

                  <p className="font-medium">{selectedAppointment.status}</p>
                </div>

                <div className="col-span-2">
                  <p className="text-muted-foreground">Treatments</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedAppointment.treatments?.length > 0 ? (
                      selectedAppointment.treatments.map((t) => (
                        <p key={t} className="font-bold">
                          {t},
                        </p>
                      ))
                    ) : (
                      <p className="font-medium">N/A</p>
                    )}
                  </div>
                </div>

                <div className="col-span-2">
                  <p className="text-muted-foreground">Teeth</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedAppointment.teeth?.length > 0 ? (
                      selectedAppointment.teeth.map((tooth) => (
                        <p key={tooth} className="font-bold">
                          {tooth},
                        </p>
                      ))
                    ) : (
                      <p className="font-medium">N/A</p>
                    )}
                  </div>
                </div>

                <div className="col-span-2">
                  <p className="text-muted-foreground">Notes</p>
                  <p className="font-medium">
                    {selectedAppointment.notes || "N/A"}
                  </p>
                </div>

                <div className="flex items-start gap-2 no-capture">
                  <FileClock className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-muted-foreground">Created At</p>
                    <p className="font-medium">
                      {new Date(
                        selectedAppointment.createdAt || ""
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Updated At */}
                <div className="flex items-start gap-2 no-capture">
                  <FileClock className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-muted-foreground">Updated At</p>
                    <p className="font-medium">
                      {new Date(
                        selectedAppointment.updatedAt || ""
                      ).toLocaleString()}{" "}
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooterActions
                captureRef={dialogRef}
                className="no-capture"
              />
            </>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              No appointment selected.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
