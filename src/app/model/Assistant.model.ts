import mongoose, { Schema, Document, model } from "mongoose";

interface IAssistant extends Document {
  userId: mongoose.Types.ObjectId; // Reference to User model
  doctorId: mongoose.Types.ObjectId; // Reference to Doctor
  clinicId: mongoose.Types.ObjectId; // Reference to Clinic
  fullName: string;
  email: string;
  contactNumber: string;
  specialization: string;
  bio?: string;
  profileImageUrl?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  qualifications?: string[];
  experienceYears: number;
  gender?: "Male" | "Female" | "Other";
  permissions: Map<string, boolean>;
  status: "Active" | "Inactive";
  joinDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AssistantSchema: Schema<IAssistant> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "UserModel",
      required: true,
      index: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /^\S+@\S+\.\S+$/,
    },
    contactNumber: {
      type: String,
      required: true,
      unique: true,
    },
    specialization: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
      default: "",
    },
    profileImageUrl: {
      type: String,
      default: "",
    },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
    },
    qualifications: [{ type: String }],
    experienceYears: {
      type: Number,
      required: true,
      default: 0,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },
    permissions: {
      type: Map,
      of: Boolean,
      default: new Map([
        ["canAssistDoctor", true],
        ["canSearchPatients", true],
        ["canCreateAppointments", true],
        ["canUpdateAppointments", true],
        ["canDeleteAppointments", true],
        ["canEditNotes", false],
        ["canViewReports", false],
      ]),
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Assistant ||
  model<IAssistant>("Assistant", AssistantSchema);
