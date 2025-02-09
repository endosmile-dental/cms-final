import mongoose, { Document, Schema, model } from "mongoose";
import { nanoid } from "nanoid";

// ✅ Define the Receptionist Interface
interface IReceptionist extends Document {
  userId: mongoose.Types.ObjectId; // Reference to the User model
  permissions: Map<string, boolean>;
  receptionistId: string;
  fullName: string;
  contactNumber: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  dateOfBirth: Date;
  gender: "Male" | "Female" | "Other";
  emergencyContact: {
    name: string;
    relationship: string;
    contactNumber: string;
  };
  appointmentsHandled: number;
  matchPassword: (enteredPassword: string) => Promise<boolean>;
}

// ✅ Define the Receptionist Schema
const receptionistSchema: Schema<IReceptionist> = new mongoose.Schema(
  {
    userId: {
      type: Schema.Types.ObjectId, // Reference to the User model
      ref: "UserModel", // Model name to reference
      required: true, // Make this field mandatory
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

    receptionistId: {
      type: String,
      required: true,
      unique: true,
      default: () => nanoid(),
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    contactNumber: {
      type: String,
      required: true,
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },
    emergencyContact: {
      name: { type: String, required: true },
      relationship: { type: String, required: true },
      contactNumber: { type: String, required: true },
    },
    appointmentsHandled: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Receptionist ||
  model<IReceptionist>("Receptionist", receptionistSchema);
