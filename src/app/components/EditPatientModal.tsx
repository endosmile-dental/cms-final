"use client";

import { Patient, updatePatientAsync } from "@/app/redux/slices/patientSlice";
import { useAppDispatch } from "@/app/redux/store/hooks";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, User, Phone, Calendar, Lock, MapPin, Shield } from "lucide-react";

interface EditPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  onPatientUpdated: (updatedPatient: Patient) => void;
}

const editPatientSchema = z.object({
  _id: z.string().min(1, "Patient ID is required"),
  fullName: z.string().min(1, "Full name is required"),
  contactNumber: z.string().min(1, "Contact number is required"),
  gender: z.enum(["Male", "Female", "Other"]),
  age: z.string().min(1, "Age is required"),
  dateOfBirth: z.string().optional(),
  password: z.string().optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
    })
    .optional(),
  emergencyContact: z
    .object({
      fullName: z.string().optional(),
      contactNumber: z.string().optional(),
      relationship: z.string().optional(),
    })
    .optional(),
});

const EditPatientModal: React.FC<EditPatientModalProps> = ({
  isOpen,
  onClose,
  patient,
  onPatientUpdated,
}) => {
  const dispatch = useAppDispatch();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<Patient & { password?: string }>({
    resolver: zodResolver(editPatientSchema),
    defaultValues: patient || {},
  });

  // Watch for password field to conditionally show password section
  const passwordValue = watch("password");

  // Reset form when patient changes
  useEffect(() => {
    if (patient) {
      // Format dateOfBirth to YYYY-MM-DD for the date input
      let formattedDateOfBirth = "";
      if (patient.dateOfBirth) {
        const date = new Date(patient.dateOfBirth);
        if (!isNaN(date.getTime())) {
          formattedDateOfBirth = date.toISOString().split("T")[0];
        }
      }
      reset({ ...(patient as Patient & { password?: string }), dateOfBirth: formattedDateOfBirth, password: "" });
    }
  }, [patient, reset]);

  // Disable background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen || !patient) return null;

  const onSubmit = async (data: Patient & { password?: string }) => {
    try {
      // If a new password is provided, update it separately
      if (data.password?.trim()) {
        await fetch("/api/patient/updatePassword", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientId: patient._id,
            newPassword: data.password,
          }),
        });
      }
      // Remove password from payload for Redux update
      const patientData = { ...data };
      delete patientData.password; // Explicitly remove password
      const updatedPatient = await dispatch(
        updatePatientAsync(patientData)
      ).unwrap();
      onPatientUpdated(updatedPatient);
      onClose();
    } catch (error) {
      console.error("Error updating patient:", error);
    }
  };

  return (
    <div
      role="dialog"
      aria-labelledby="edit-patient-title"
      className="fixed z-50 inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-all duration-300"
    >
      <div className="relative bg-card border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100 hover:scale-[1.02]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-primary/10 to-transparent border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 id="edit-patient-title" className="text-2xl font-bold text-foreground">
                  Edit Patient Profile
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Update patient information and settings
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
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-foreground">
                  <User className="h-4 w-4" />
                  <span>Full Name</span>
                </label>
                <div className="relative">
                  <input
                    {...register("fullName")}
                    className="w-full px-4 py-3 border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                    placeholder="Enter full name"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                {errors.fullName && (
                  <p className="text-destructive text-sm flex items-center space-x-1">
                    <span>•</span>
                    <span>{errors.fullName.message}</span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-foreground">
                  <Phone className="h-4 w-4" />
                  <span>Contact Number</span>
                </label>
                <div className="relative">
                  <input
                    {...register("contactNumber")}
                    className="w-full px-4 py-3 border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                    placeholder="Enter contact number"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                {errors.contactNumber && (
                  <p className="text-destructive text-sm flex items-center space-x-1">
                    <span>•</span>
                    <span>{errors.contactNumber.message}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-foreground">
                  <span>Gender</span>
                </label>
                <select
                  {...register("gender")}
                  className="w-full px-4 py-3 border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && (
                  <p className="text-destructive text-sm flex items-center space-x-1">
                    <span>•</span>
                    <span>{errors.gender.message}</span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-foreground">
                  <span>Age</span>
                </label>
                <input
                  {...register("age")}
                  className="w-full px-4 py-3 border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  placeholder="Enter age"
                />
                {errors.age && (
                  <p className="text-destructive text-sm flex items-center space-x-1">
                    <span>•</span>
                    <span>{errors.age.message}</span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Date of Birth</span>
                </label>
                <input
                  type="date"
                  {...register("dateOfBirth")}
                  className="w-full px-4 py-3 border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                />
                {errors.dateOfBirth && (
                  <p className="text-destructive text-sm flex items-center space-x-1">
                    <span>•</span>
                    <span>{errors.dateOfBirth.message}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Password Section */}
            <div className="border-t border-border pt-6">
              <div className="flex items-center space-x-3 mb-4">
                <Lock className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Security Settings</h3>
              </div>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-foreground">
                  <Lock className="h-4 w-4" />
                  <span>New Password</span>
                  <span className="text-xs text-muted-foreground">(Optional)</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    {...register("password")}
                    className="w-full px-4 py-3 border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                    placeholder="Enter new password (leave empty to keep current)"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                {errors.password && (
                  <p className="text-destructive text-sm flex items-center space-x-1">
                    <span>•</span>
                    <span>{errors.password.message}</span>
                  </p>
                )}
                {passwordValue && (
                  <p className="text-xs text-muted-foreground">
                    Password will be updated when you save the form
                  </p>
                )}
              </div>
            </div>

            {/* Address Section */}
            <div className="border-t border-border pt-6">
              <div className="flex items-center space-x-3 mb-4">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Address Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Street Address"
                  {...register("address.street")}
                  className="w-full px-4 py-3 border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                />
                <input
                  type="text"
                  placeholder="City"
                  {...register("address.city")}
                  className="w-full px-4 py-3 border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                />
                <input
                  type="text"
                  placeholder="State/Province"
                  {...register("address.state")}
                  className="w-full px-4 py-3 border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                />
                <input
                  type="text"
                  placeholder="Postal Code"
                  {...register("address.postalCode")}
                  className="w-full px-4 py-3 border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Emergency Contact Section */}
            <div className="border-t border-border pt-6">
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Emergency Contact</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  {...register("emergencyContact.fullName")}
                  className="w-full px-4 py-3 border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                />
                <input
                  type="text"
                  placeholder="Phone Number"
                  {...register("emergencyContact.contactNumber")}
                  className="w-full px-4 py-3 border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                />
                <input
                  type="text"
                  placeholder="Relationship"
                  {...register("emergencyContact.relationship")}
                  className="w-full px-4 py-3 border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="bg-muted/50 border-t border-border p-6">
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 text-foreground bg-muted rounded-lg hover:bg-muted/80 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              onClick={handleSubmit(onSubmit)}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                  <span>Updating...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span>Save Changes</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPatientModal;
