import mongoose, { Document, model, Schema } from "mongoose";

// Define interfaces for TypeScript type safety
interface IClinic extends Document {
  clientAdminId: mongoose.Types.ObjectId; // Reference to the User model
  name: string;
  registrationNumber: string;
  email: string;
  contactNumber: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  authorizedDoctors: mongoose.Types.ObjectId[];
  clientAdmin?: mongoose.Types.ObjectId; // Reference to a single client admin user
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
    clientAdminId: {
      type: Schema.Types.ObjectId, // Reference to the User model
      ref: "clientAdminModel", // Model name to reference
      required: true, // Make this field mandatory
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
    },

    // Authorized Doctors (References Doctor Model)
    authorizedDoctors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor",
      },
    ],

    // Client Admin (Reference to the clientAdmin model; accept one per clinic)
    clientAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "clientAdmin",
    },

    // Services Offered
    services: [
      {
        serviceName: { type: String },
        price: { type: Number },
        description: { type: String },
        isActive: { type: Boolean },
      },
    ],

    // Business Hours
    businessHours: [
      {
        day: { type: String },
        openTime: { type: String },
        closeTime: { type: String },
      },
    ],

    // Subscription Plan
    subscriptionPlan: {
      planName: { type: String },
      startDate: { type: Date },
      endDate: { type: Date },
      price: { type: Number },
      isActive: { type: Boolean },
    },

    // Appointment Policy
    appointmentPolicy: {
      maxAppointmentsPerDay: { type: Number },
      cancellationNoticeHours: { type: Number, default: 24 },
    },

    // Payment Details
    paymentDetails: {
      paymentMethod: { type: String },
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
