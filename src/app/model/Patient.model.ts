import mongoose, { Schema, Document, model } from "mongoose";

// ================== Patient Model ==================

interface IPatient extends Document {
  userId: mongoose.Types.ObjectId; // Reference to the User model
  DoctorId: mongoose.Types.ObjectId; // Reference to the User model
  ClinicId: mongoose.Types.ObjectId; // Reference to the User model
  PatientId: string;
  permissions: Map<string, boolean>;
  fullName: string;
  email: string;
  contactNumber: string;
  gender: "Male" | "Female" | "Other";
  age: string;  
  dateOfBirth: Date;
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  medicalHistory?: string[];
  currentMedications?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

const PatientSchema: Schema<IPatient> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId, // Reference to the User model
      ref: "UserModel", // Model name to reference
      required: true, // Make this field mandatory
    },
    DoctorId: {
      type: Schema.Types.ObjectId, // Reference to the User model
      ref: "DoctorModel", // Model name to reference
      required: true, // Make this field mandatory
    },
    ClinicId: {
      type: Schema.Types.ObjectId, // Reference to the User model
      ref: "ClinicModel", // Model name to reference
      required: true, // Make this field mandatory
    },
    PatientId: {
      type: String,
      required: true,
    },
    fullName: { type: String, required: true },
    contactNumber: { type: String, required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    age: { type: String },
    dateOfBirth: { type: Date },
    email: { type: String },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
    },
    medicalHistory: [{ type: String }],
    currentMedications: [{ type: String }],
    emergencyContact: {
      fullName: { type: String },
      contactNumber: { type: String },
      relationship: { type: String },
    },
    permissions: {
      type: Map,
      of: Boolean,
      default: new Map([
        ["canAddClinic", false],
        ["canEditClinic", false],
        ["canDeleteClinic", false],
        ["canAddDoctor", false],
        ["canEditDoctor", false],
        ["canDeleteDoctor", false],
        ["canManagePayments", false],
        ["canViewReports", false],
      ]),
    },
  },
  { timestamps: true }
);

export default mongoose.models.Patient ||
  model<IPatient>("Patient", PatientSchema);
