"use client";

import React, { useEffect } from "react";
import { Patient, deletePatientAsync } from "@/app/redux/slices/patientSlice";
import { useAppDispatch } from "@/app/redux/store/hooks";

interface DeletePatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  onPatientDeleted: (deletedPatientId: string) => void;
}

const DeletePatientModal: React.FC<DeletePatientModalProps> = ({
  isOpen,
  onClose,
  patient,
  onPatientDeleted,
}) => {
  const dispatch = useAppDispatch();

  // Disable background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen || !patient) return null;

  const handleDelete = async () => {
    try {
      await dispatch(deletePatientAsync(patient._id)).unwrap();
      onPatientDeleted(patient._id);
      onClose();
    } catch (error) {
      console.error("Error deleting patient:", error);
    }
  };

  return (
    <div
      role="dialog"
      aria-labelledby="delete-patient-title"
      className="fixed z-20 inset-0 flex items-center justify-center bg-black bg-opacity-50"
    >
      <div className="relative bg-white rounded-lg p-6 shadow-lg w-96">
        {/* Cross Button */}
        <button
          onClick={onClose}
          className="absolute -top-6 right-0 text-2xl text-white hover:text-gray-200"
        >
          ✖
        </button>

        <h2 id="delete-patient-title" className="text-xl font-semibold mb-4">
          Delete Patient
        </h2>
        <p className="mb-6">
          Are you sure you want to delete{" "}
          <span className="font-semibold">{patient.fullName}</span>?
        </p>

        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="bg-gray-400 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeletePatientModal;
