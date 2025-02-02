import mongoose, { Schema, Document, model } from "mongoose";
import { nanoid } from "nanoid";

// Main Admin Interface extending mongoose.Document
export interface IClientAdmin extends Document {
  permissions: Map<string, boolean>;

  clientAdminId: string;
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

const clientAdminSchema: Schema<IClientAdmin> = new Schema(
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

    clientAdminId: {
      type: String,
      required: true,
      unique: true,
      default: nanoid(),
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

export default mongoose.models.clientAdmin ||
  model<IClientAdmin>("clientAdmin", clientAdminSchema);
