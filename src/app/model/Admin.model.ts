import mongoose, { Schema, Document, model } from "mongoose";

// Main Admin Interface extending mongoose.Document
interface IAdmin extends Document {
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
    userId: {
      type: Schema.Types.ObjectId, // Reference to the User model
      ref: "UserModel", // Model name to reference
      required: true, // Make this field mandatory
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
