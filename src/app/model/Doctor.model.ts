import mongoose, { Schema, Document, model } from "mongoose";
import { nanoid } from "nanoid";

interface IWorkingHour {
  day: string;
  startTime: string;
  endTime: string;
}

interface IDoctor extends Document {
  userId: mongoose.Types.ObjectId; // Reference to the User model
  clinicId: mongoose.Types.ObjectId; // Reference to the Clinic model
  fullName: string;
  specialization: string;
  specializationDetails?: string;
  contactNumber: string;
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  qualifications?: string[];
  experienceYears: number;
  gender?: "Male" | "Female" | "Other";
  rating?: number;
  workingHours: IWorkingHour[];
  createdAt: Date;
  updatedAt: Date;
  permissions: Map<string, boolean>;
}

const DoctorSchema: Schema<IDoctor> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId, // Reference to the User model
      ref: "UserModel", // Model name to reference
      required: true, // Make this field mandatory
    },
    clinicId: {
      type: Schema.Types.ObjectId, // Reference to the Clinic model
      ref: "ClinicModel", // Model name to reference
      required: true, // Make this field mandatory
    },
    fullName: { type: String, required: true },
    specialization: { type: String, required: true },
    specializationDetails: { type: String },
    contactNumber: { type: String, required: true, unique: true },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
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
    qualifications: [{ type: String }],
    experienceYears: { type: Number, required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    rating: { type: Number, min: 1, max: 5 },
    workingHours: [
      {
        day: { type: String },
        startTime: { type: String },
        endTime: { type: String },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Doctor || model<IDoctor>("Doctor", DoctorSchema);
