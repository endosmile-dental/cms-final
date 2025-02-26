import mongoose, { Schema, Document, model } from "mongoose";

// Main Admin Interface extending mongoose.Document
export interface IClientAdmin extends Document {
  userId: mongoose.Types.ObjectId; // Reference to the User model
  permissions: Map<string, boolean>;
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
