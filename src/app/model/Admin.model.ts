import mongoose, { Schema, Document, model } from "mongoose";
import { nanoid } from "nanoid";

// Main Admin Interface extending mongoose.Document
interface IAdmin extends Document {
  permissions: Map<string, boolean>;

  adminId: string;
  fullName: string;
  contactNumber: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const adminSchema: Schema<IAdmin> = new Schema(
  {
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

    adminId: {
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
      street: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
    },
  },
  { timestamps: true }
);

export default mongoose.models.Admin || model<IAdmin>("Admin", adminSchema);
