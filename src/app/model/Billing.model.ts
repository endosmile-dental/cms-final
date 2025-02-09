import mongoose, { Schema, Document, model } from "mongoose";
import { nanoid } from "nanoid";

// Interface for individual treatment items in the billing
export interface ITreatment {
  treatment: string;
  price: number;
  quantity: number;
}

// Interface for the Billing document
export interface IBilling extends Document {
  invoiceId: string;
  patientId: mongoose.Types.ObjectId; // Reference to Patient model
  doctorId: mongoose.Types.ObjectId; // Reference to Doctor model
  clinicId: mongoose.Types.ObjectId; // Reference to Clinic model
  date: Date;
  treatments: ITreatment[];
  discount?: number;
  advance?: number;
  amountReceived: number;
  modeOfPayment: string;
  address?: string;
  status: "Pending" | "Paid" | "Partial" | "Cancelled";
  createdAt: Date;
  updatedAt: Date;
}

// Sub-schema for treatment items (no individual _id)
const TreatmentSchema = new Schema<ITreatment>(
  {
    treatment: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
  },
  { _id: false }
);

// Main Billing schema
const BillingSchema: Schema<IBilling> = new Schema(
  {
    invoiceId: {
      type: String,
      required: true,
      unique: true,
      default: () => "INV-" + nanoid(10),
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
    },
    date: { type: Date, required: true },
    treatments: { type: [TreatmentSchema], default: [] },
    discount: { type: Number, default: 0 },
    advance: { type: Number, default: 0 },
    amountReceived: { type: Number, required: true },
    modeOfPayment: { type: String, required: true },
    address: { type: String },
    status: {
      type: String,
      enum: ["Pending", "Paid", "Partial", "Cancelled"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Billing ||
  model<IBilling>("Billing", BillingSchema);
