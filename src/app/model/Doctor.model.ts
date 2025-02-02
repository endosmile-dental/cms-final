import mongoose, { Schema, Document, model } from "mongoose";
import { nanoid } from "nanoid";

interface IWorkingHour {
  day: string;
  startTime: string;
  endTime: string;
}

interface IDoctor extends Document {
  doctorId: string;
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
  appointments?: Schema.Types.ObjectId[];
  patients?: Schema.Types.ObjectId[];
  clinic: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  permissions: Map<string, boolean>;
}

const DoctorSchema: Schema<IDoctor> = new Schema(
  {
    doctorId: {
      type: String,
      required: true,
      unique: true,
      default: () => nanoid(),
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
        day: { type: String, required: true },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
      },
    ],
    appointments: [{ type: Schema.Types.ObjectId, ref: "Appointment" }],
    patients: [{ type: Schema.Types.ObjectId, ref: "Patient" }],
    clinic: { type: Schema.Types.ObjectId, ref: "Clinic", required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Doctor || model<IDoctor>("Doctor", DoctorSchema);
