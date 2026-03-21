"use client";

import React, { useEffect } from "react";
import { Patient, deletePatientAsync } from "@/app/redux/slices/patientSlice";
import { useAppDispatch } from "@/app/redux/store/hooks";
import { X, AlertTriangle, User } from "lucide-react";

interface DeletePatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  onPatientDeleted: (deletedPatientId: string) => void;
  userId: string; // Add userId prop
}

const DeletePatientModal: React.FC<DeletePatientModalProps> = ({
  isOpen,
  onClose,
  patient,
  onPatientDeleted,
  userId,
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
      await dispatch(deletePatientAsync({ patientId: patient._id, userId })).unwrap();
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
      className="fixed z-50 inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-all duration-300"
    >
      <div className="relative bg-card border-border rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 hover:scale-[1.01]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-destructive/10 to-transparent border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-destructive/10 rounded-full">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h2 id="delete-patient-title" className="text-2xl font-bold text-foreground">
                  Delete Patient Record
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted transition-colors duration-200"
              aria-label="Close modal"
            >
              <X className="h-6 w-6 text-foreground" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
          {/* Patient Information Preview */}
          <div className="bg-muted/50 border-border rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <User className="h-5 w-5 text-foreground" />
              <h3 className="font-semibold text-foreground">Patient Details</h3>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm text-foreground">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{patient.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Patient ID:</span>
                <span className="font-medium">{patient.PatientId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contact:</span>
                <span className="font-medium">{patient.contactNumber || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{patient.email || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Warning Section */}
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-destructive mb-2">
                  Important Warning
                </h4>
                <ul className="text-sm text-foreground space-y-1">
                  <li>• All patient data will be permanently deleted</li>
                  <li>• This action cannot be undone</li>
                  <li>• Medical records, appointments, and billing history will be lost</li>
                  <li>• Consider exporting data before deletion if needed</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Confirmation Input */}
          <div className="space-y-2">
            <p className="text-sm text-foreground">
              To confirm deletion, please type{" "}
              <span className="font-semibold text-destructive">
                &quot;{patient.fullName.toUpperCase()}&quot;
              </span>{" "}
              below:
            </p>
            <input
              type="text"
              placeholder={`Type "${patient.fullName.toUpperCase()}" to confirm`}
              className="w-full px-4 py-3 border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-destructive focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-muted/50 border-t border-border p-6">
          <div className="flex justify-between space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 text-foreground bg-muted rounded-lg hover:bg-muted/80 transition-all duration-200 font-medium"
            >
              <span>Cancel</span>
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="flex-1 px-6 py-3 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
            >
              <div className="flex items-center justify-center space-x-2">
                <AlertTriangle className="h-4 w-4" />
                <span>Delete Patient</span>
              </div>
            </button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3">
            This action requires administrative confirmation
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeletePatientModal;
