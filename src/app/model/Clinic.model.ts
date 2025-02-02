import mongoose, { Document, model, Schema } from "mongoose";
import { nanoid } from "nanoid";

// Define interfaces for TypeScript type safety
interface IClinic extends Document {
  clinicId: string;
  name: string;
  registrationNumber: string;
  email: string;
  contactNumber: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  authorizedDoctors: mongoose.Types.ObjectId[];
  services: {
    serviceName: string;
    price: number;
    description: string;
    isActive: boolean;
  }[];
  businessHours: {
    day: string;
    openTime: string;
    closeTime: string;
  }[];
  subscriptionPlan: {
    planName: string;
    startDate: Date;
    endDate: Date;
    price: number;
    isActive: boolean;
  };
  appointmentPolicy: {
    maxAppointmentsPerDay: number;
    cancellationNoticeHours: number;
  };
  paymentDetails: {
    paymentMethod: string;
    totalPaid: number;
    lastPaymentDate: Date;
  };
  status: "active" | "inactive" | "pending" | "suspended";
  createdAt: Date;
  updatedAt: Date;
}

// Define the schema
const clinicSchema: Schema<IClinic> = new Schema(
  {
    clinicId: {
      type: String,
      required: true,
      unique: true,
      default: () => nanoid(),
    },
    // Basic Clinic Information
    name: {
      type: String,
      required: true,
      trim: true,
    },
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    contactNumber: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },

    // Authorized Doctors (References Doctor Model)
    authorizedDoctors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor",
      },
    ],

    // Services Offered
    services: [
      {
        serviceName: { type: String, required: true },
        price: { type: Number, required: true },
        description: { type: String },
        isActive: { type: Boolean, default: true },
      },
    ],

    // Business Hours
    businessHours: [
      {
        day: { type: String, required: true },
        openTime: { type: String, required: true },
        closeTime: { type: String, required: true },
      },
    ],

    // Subscription Plan
    subscriptionPlan: {
      planName: { type: String, required: true },
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      price: { type: Number, required: true },
      isActive: { type: Boolean, default: true },
    },

    // Appointment Policy
    appointmentPolicy: {
      maxAppointmentsPerDay: { type: Number, required: true },
      cancellationNoticeHours: { type: Number, default: 24 },
    },

    // Payment Details
    paymentDetails: {
      paymentMethod: { type: String, required: true },
      totalPaid: { type: Number, default: 0 },
      lastPaymentDate: { type: Date },
    },

    // Clinic Status
    status: {
      type: String,
      enum: ["active", "inactive", "pending", "suspended"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Pre-save hooks for audit logs
clinicSchema.methods.recordAuditLog = async function (
  action: string,
  performedBy: mongoose.Types.ObjectId,
  ip: string
) {
  this.auditLogs.push({ action, performedBy, ip });
  await this.save();
};

// Export the model
export default mongoose.models.Clinic || model<IClinic>("Clinic", clinicSchema);
