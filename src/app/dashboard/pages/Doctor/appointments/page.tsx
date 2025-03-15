"use client";

import React, { useState } from "react";
import DashboardLayout from "@/app/dashboard/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { BookPlus, Edit, Trash } from "lucide-react";
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
import ReusableTable, {
  ColumnDefinition,
} from "@/app/dashboard/ui/DashboardTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Modal component with children in its props
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
  contactNumber: string;
  consultationType: "New" | "Follow-up";
  status: "Scheduled" | "Completed" | "Cancelled";
}

export default function DoctorAppointments() {
  const dispatch = useAppDispatch();
  const appointments = useAppSelector(selectAppointments);
  const patients = useAppSelector(selectPatients);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);

  // State for controlling the edit modal and its form fields
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<{
    _id: string;
    appointmentDate: string;
    status: "Scheduled" | "Completed" | "Cancelled";
    consultationType: "New" | "Follow-up";
  } | null>(null);

  // State for controlling the delete confirmation modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const getPatientInfo = (patientId: string) => {
    return patients.find((p) => p._id === patientId) || null;
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
        contactNumber: patientInfo?.contactNumber || "NA",
        consultationType: appointment.consultationType,
        status: appointment.status,
      };
    });
  };

  // Open modal with appointment data to edit
  const handleEditAppointment = (appointmentId: string) => {
    const appointmentToEdit = appointments.find(
      (appointment) => appointment._id === appointmentId
    );
    if (appointmentToEdit) {
      setEditForm({
        _id: appointmentToEdit._id,
        appointmentDate: appointmentToEdit.appointmentDate,
        status: appointmentToEdit.status,
        consultationType: appointmentToEdit.consultationType,
      });
      setIsEditModalOpen(true);
    }
  };

  // Handle form field changes in the edit modal
  const handleEditFormChange = (field: string, value: string) => {
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

  const columns: ColumnDefinition<TransformedAppointment>[] = [
    { header: "ID", accessor: (row) => row.patientId },
    { header: "Patient", accessor: (row) => row.patientName },
    { header: "Date", accessor: (row) => row.date },
    { header: "Contact", accessor: (row) => row.contactNumber },
    { header: "Type", accessor: (row) => row.consultationType },
    { header: "Status", accessor: (row) => row.status },
    {
      header: "Actions",
      accessor: (row) => (
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
  ];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <h1 className="text-3xl font-bold">Appointments</h1>
          {/* Filters & Search */}
          <div className="flex flex-1 flex-wrap items-center gap-2 justify-center md:justify-end mt-4 md:mt-0">
            <Link href="/dashboard/pages/Doctor/appointments/bookAppointment">
              <Button variant="default" className="w-full sm:w-auto">
                <BookPlus size={16} className="mr-2" />
                Add New
              </Button>
            </Link>
            <Input
              type="text"
              placeholder="Search appointments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64"
            />
            <Select
              onValueChange={(value) =>
                setFilterStatus(value !== "all" ? value : null)
              }
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Scheduled">Scheduled</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select
              onValueChange={(value) =>
                setFilterType(value !== "all" ? value : null)
              }
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Follow-up">Follow-up</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Separator />
        {/* Upcoming Appointments */}
        <ReusableTable
          title="Upcoming Appointments"
          data={transformData(upcomingAppointments)}
          columns={columns}
          emptyMessage="No upcoming appointments found."
        />
        {/* Past Appointments */}
        <ReusableTable
          title="Past Appointments"
          data={transformData(pastAppointments)}
          columns={columns}
          emptyMessage="No past appointments found."
        />
      </div>

      {/* Edit Appointment Modal */}
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
    </DashboardLayout>
  );
}
