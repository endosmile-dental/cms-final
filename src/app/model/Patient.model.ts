import mongoose, { Schema, Document, model } from "mongoose";
import { nanoid } from "nanoid";

// ================== Patient Model ==================

interface IPatient extends Document {
  permissions: Map<string, boolean>;

  patientId: string;
  fullName: string;
  contactNumber: string;
  gender: "Male" | "Female" | "Other";
  dateOfBirth: Date;
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  medicalHistory?: string[];
  currentMedications?: string[];
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  assignedDoctor: Schema.Types.ObjectId;
}

const PatientSchema: Schema<IPatient> = new Schema(
  {
    patientId: {
      type: String,
      required: true,
      unique: true,
      default: () => nanoid(),
    },
    fullName: { type: String, required: true },
    contactNumber: { type: String, required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    dateOfBirth: { type: Date, required: true },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
    },
    medicalHistory: [{ type: String }],
    currentMedications: [{ type: String }],
    emergencyContact: {
      fullName: { type: String, required: true },
      contactNumber: { type: String, required: true },
      relationship: { type: String, required: true },
    },
    permissions: {
      type: Map,
      of: Boolean,
      default: new Map([
        ["canAddClinic", true],
        ["canEditClinic", true],
        ["canDeleteClinic", true],
        ["canAddDoctor", true],
        ["canEditDoctor", true],
        ["canDeleteDoctor", true],
        ["canManagePayments", true],
        ["canViewReports", true],
      ]),
    },
    assignedDoctor: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Patient ||
  model<IPatient>("Patient", PatientSchema);
