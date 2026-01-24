"use client";

import { Patient, updatePatientAsync } from "@/app/redux/slices/patientSlice";
import { useAppDispatch } from "@/app/redux/store/hooks";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

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
    formState: { errors },
  } = useForm<Patient & { password?: string }>({
    resolver: zodResolver(editPatientSchema),
    defaultValues: patient || {},
  });

  // Reset form when patient changes
  useEffect(() => {
    if (patient) {
      reset({ ...(patient as Patient & { password?: string }), password: "" });
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
      className="fixed z-20 inset-0 flex items-center justify-center bg-black bg-opacity-50"
    >
      <div className="relative bg-white rounded-lg p-6 shadow-lg w-96 max-h-[80vh] overflow-y-auto no-scrollbar">
        {/* Cross Button positioned outside the modal content */}
        <button
          onClick={onClose}
          className="absolute -top-6 right-0 text-2xl text-white hover:text-gray-200"
        >
          ✖
        </button>

        <h2 id="edit-patient-title" className="text-xl font-semibold mb-4">
          Edit Patient
        </h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <label className="block mb-2">Full Name</label>
          <input
            {...register("fullName")}
            className="w-full p-2 border rounded mb-2"
          />
          {errors.fullName && (
            <p className="text-red-500 text-sm">{errors.fullName.message}</p>
          )}

          <label className="block mb-2">Contact Number</label>
          <input
            {...register("contactNumber")}
            className="w-full p-2 border rounded mb-2"
          />
          {errors.contactNumber && (
            <p className="text-red-500 text-sm">
              {errors.contactNumber.message}
            </p>
          )}

          <label className="block mb-2">Gender</label>
          <select
            {...register("gender")}
            className="w-full p-2 border rounded mb-2"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          {errors.gender && (
            <p className="text-red-500 text-sm">{errors.gender.message}</p>
          )}

          <label className="block mb-2">Age</label>
          <input
            {...register("age")}
            className="w-full p-2 border rounded mb-2"
          />
          {errors.age && (
            <p className="text-red-500 text-sm">{errors.age.message}</p>
          )}

          <label className="block mb-2">Date of Birth</label>
          <input
            type="date"
            {...register("dateOfBirth")}
            className="w-full p-2 border rounded mb-2"
          />
          {errors.dateOfBirth && (
            <p className="text-red-500 text-sm">{errors.dateOfBirth.message}</p>
          )}

          <label className="block mb-2">
            New Password{" "}
            <span className="text-gray-500 text-xs">
              (Leave empty to keep current password)
            </span>
          </label>
          <input
            type="password"
            {...register("password")}
            className="w-full p-2 border rounded mb-2"
            placeholder="Enter new password"
          />
          {errors.password && (
            <p className="text-red-500 text-sm">{errors.password.message}</p>
          )}

          <h3 className="text-lg font-semibold mt-4 mb-2">Address</h3>
          <input
            type="text"
            placeholder="Street"
            {...register("address.street")}
            className="w-full p-2 border rounded mb-2"
          />
          <input
            type="text"
            placeholder="City"
            {...register("address.city")}
            className="w-full p-2 border rounded mb-2"
          />
          <input
            type="text"
            placeholder="State"
            {...register("address.state")}
            className="w-full p-2 border rounded mb-2"
          />
          <input
            type="text"
            placeholder="Postal Code"
            {...register("address.postalCode")}
            className="w-full p-2 border rounded mb-4"
          />

          <h3 className="text-lg font-semibold mt-4 mb-2">Emergency Contact</h3>
          <input
            type="text"
            placeholder="Full Name"
            {...register("emergencyContact.fullName")}
            className="w-full p-2 border rounded mb-2"
          />
          <input
            type="text"
            placeholder="Phone"
            {...register("emergencyContact.contactNumber")}
            className="w-full p-2 border rounded mb-2"
          />
          <input
            type="text"
            placeholder="Relationship"
            {...register("emergencyContact.relationship")}
            className="w-full p-2 border rounded mb-4"
          />

          <div className="flex justify-end gap-4 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-400 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPatientModal;
