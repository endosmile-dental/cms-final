"use client";

import React, { useMemo, useState } from "react";
import DashboardLayout from "@/app/dashboard/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { BookPlus, CalendarDays, Edit, FileClock, Trash } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useAppSelector, useAppDispatch } from "@/app/redux/store/hooks";
import {
  Appointment,
  selectAppointments,
  editAppointment,
  removeAppointment,
} from "@/app/redux/slices/appointmentSlice";
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
  treatmentOptions,
} from "@/app/components/BookAppointmentForm";
import { MultiSelect } from "@/components/ui/multi-select";
import DataTable from "@/app/components/DataTable";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white p-6 rounded shadow-lg w-11/12 max-w-md">
        {children}
      </div>
    </div>
  );
};

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

export default function DoctorAppointments() {
  const dispatch = useAppDispatch();
  const appointments = useAppSelector(selectAppointments);
  const patients = useAppSelector(selectPatients);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
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

  const [openAppointmentDialog, setOpenAppointmentDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<TransformedAppointment | null>(null);

  const getPatientInfo = (patientId: string) => {
    return patients.find((p) => p._id === patientId) || null;
  };

  type ColumnDef<T> = {
    header: string;
    accessorKey: keyof T;
    sortable?: boolean;
    render?: (value: unknown, row: T) => React.ReactNode;
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const patientInfo = appointment.patient
      ? getPatientInfo(appointment.patient)
      : null;
    const patientName = patientInfo ? patientInfo.fullName.toLowerCase() : "";

    const matchesSearch =
      patientName.includes(search.toLowerCase()) ||
      appointment._id.includes(search) ||
      appointment.consultationType
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      appointment.status.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = filterStatus
      ? appointment.status === filterStatus
      : true;
    const matchesType = filterType
      ? appointment.consultationType === filterType
      : true;

    return matchesSearch && matchesStatus && matchesType;
  });

  const today = new Date();
  const upcomingAppointments = filteredAppointments.filter(
    (appointment) => new Date(appointment.appointmentDate) >= today
  );
  const pastAppointments = filteredAppointments.filter(
    (appointment) => new Date(appointment.appointmentDate) < today
  );

  const transformData = (
    appointments: Appointment[]
  ): TransformedAppointment[] => {
    return appointments.map((appointment) => {
      const patientInfo = appointment.patient
        ? getPatientInfo(appointment.patient)
        : null;

      return {
        _id: appointment._id,
        patientId: patientInfo?.PatientId || "NA",
        patientName: patientInfo?.fullName || "NA",
        date: format(new Date(appointment.appointmentDate), "yyyy-MM-dd"),
        timeSlot: appointment.timeSlot || "NA",
        contactNumber: patientInfo?.contactNumber || "NA",
        consultationType: appointment.consultationType,
        status: appointment.status,
        treatments: appointment.treatments || [],
        teeth: appointment.teeth || [],
        notes: appointment.notes || "",
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt,
      };
    });
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
          header: "Contact",
          accessorKey: "contactNumber",
          sortable: true,
        },
        {
          header: "Type",
          accessorKey: "consultationType",
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
            <div className="flex space-x-2">
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
    []
  );

  // Open modal with appointment data to edit
  const handleEditAppointment = (appointmentId: string) => {
    const appointmentToEdit = appointments.find(
      (appointment) => appointment._id === appointmentId
    );
    if (appointmentToEdit) {
      console.log("appointmentToEdit", appointmentToEdit);

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
  };

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
  const handleEditSubmit = () => {
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

        dispatch(editAppointment(updatedAppointment));

        setIsEditModalOpen(false);
      }
    }
  };

  // Open delete confirmation modal
  const handleDeleteAppointment = (appointmentId: string) => {
    setDeleteId(appointmentId);
    setIsDeleteModalOpen(true);
  };

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

  const handleMultiSelectChange = (field: string, values: string[]) => {
    if (editForm) {
      setEditForm({
        ...editForm,
        [field]: values,
      });
    }
  };

  const treatmentOptionsForSelect = useMemo(
    () => treatmentOptions.map((option) => ({ label: option, value: option })),
    []
  );
  const teethOptionsForSelect = useMemo(
    () => teethOptions.map((option) => ({ label: option, value: option })),
    []
  );

  // Rest of the code (handleEditAppointment, handleDeleteAppointment, modals, etc.) remains the same

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <h1 className="text-3xl font-bold">Appointments</h1>
          <div className="flex flex-1 flex-wrap items-center gap-2 justify-center md:justify-end mt-4 md:mt-0">
            <Link href="/dashboard/pages/Doctor/appointments/bookAppointment">
              <Button variant="default" className="w-full sm:w-auto">
                <BookPlus size={16} className="mr-2" />
                Add New
              </Button>
            </Link>
          </div>
        </div>
        <Separator />

        <DataTable
          title="Upcoming Appointments"
          data={transformData(upcomingAppointments)}
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
        />

        <DataTable
          title="Past Appointments"
          data={transformData(pastAppointments)}
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
        />

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
              <label className="block mb-1 text-sm font-medium">
                Time Slot
              </label>
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
              <label className="block mb-1 text-sm font-medium">
                Treatments
              </label>
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
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
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
        <DialogContent className="max-w-2xl animate-fade-in">
          <DialogTitle className="text-2xl font-bold mb-4">
            <CalendarDays className="inline-block mr-2 h-6 w-6" />
            Appointment Details
          </DialogTitle>

          {selectedAppointment ? (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="col-span-2">
                <p className="text-muted-foreground">Appointment ID</p>
                <p className="font-medium">
                  {selectedAppointment._id.slice(-5)}
                </p>
              </div>

              <div>
                <p className="text-muted-foreground">Date</p>
                <p className="font-medium">
                  {new Date(selectedAppointment.date).toLocaleDateString()}
                </p>
              </div>

              <div>
                <p className="text-muted-foreground">Time Slot</p>
                <p className="font-medium">
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
                <Badge
                  variant={
                    selectedAppointment.status === "Scheduled"
                      ? "secondary"
                      : "default"
                  }
                  className="capitalize"
                >
                  {selectedAppointment.status}
                </Badge>
              </div>

              <div className="col-span-2">
                <p className="text-muted-foreground">Treatments</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedAppointment.treatments?.length > 0 ? (
                    selectedAppointment.treatments.map((t) => (
                      <Badge key={t} variant="outline">
                        {t}
                      </Badge>
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
                      <Badge key={tooth} variant="outline">
                        {tooth}
                      </Badge>
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

              <div className="flex items-start gap-2">
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
              <div className="flex items-start gap-2">
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
