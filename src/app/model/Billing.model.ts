import mongoose, { Schema, Document, model } from "mongoose";
import { nanoid } from "nanoid";

/**
 * Interface for individual treatment items in the billing.
 */
export interface ITreatment {
  treatment: string;
  price: number;
  quantity: number;
}

/**
 * Interface for the Billing document.
 */
export interface IBilling extends Document {
  invoiceId: string;
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  clinicId: mongoose.Types.ObjectId;
  date: Date;
  treatments: ITreatment[];
  /** Original total before discount is applied */
  amountBeforeDiscount: number;
  /** Discount amount applied to the original total */
  discount?: number;
  /** Total after discount is applied */
  totalAmount: number;
  advance?: number;
  amountReceived: number;
  /** Remaining amount to be paid */
  amountDue: number;
  modeOfPayment: string;
  address?: string;
  status: "Pending" | "Paid" | "Partial" | "Cancelled";
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Sub-schema for treatment items (no individual _id).
 */
const TreatmentSchema = new Schema<ITreatment>(
  {
    treatment: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
  },
  { _id: false }
);

/**
 * Main Billing schema.
 */
const BillingSchema: Schema<IBilling> = new Schema(
  {
    invoiceId: {
      type: String,
      required: true,
      unique: true,
      default: () => "INV-" + nanoid(10),
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true },
    date: { type: Date, required: true },
    treatments: { type: [TreatmentSchema], default: [] },
    amountBeforeDiscount: { type: Number, required: true }, // Original total before discount
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true }, // Total after discount
    advance: { type: Number, default: 0 },
    amountReceived: { type: Number, required: true },
    amountDue: { type: Number, required: true }, // Remaining amount to be paid
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

/**
 * Pre-save middleware to calculate financial fields.
 * - Calculates the amountBeforeDiscount from the treatments array.
 * - Computes totalAmount by subtracting the discount.
 * - Computes amountDue as the remaining balance.
 */
BillingSchema.pre<IBilling>("save", function (next) {
  // Calculate original total from treatments
  this.amountBeforeDiscount = this.treatments.reduce(
    (sum, treatment) => sum + treatment.price * treatment.quantity,
    0
  );

  // Ensure the discount is not more than the original amount
  if (this.discount && this.discount > this.amountBeforeDiscount) {
    return next(
      new Error("Discount cannot exceed the total amount before discount.")
    );
  }

  // Calculate total after discount
  this.totalAmount = this.amountBeforeDiscount - (this.discount || 0);

  // Calculate amount due considering advance and amount received
  const paid = (this.advance || 0) + this.amountReceived;
  this.amountDue = this.totalAmount - paid;

  // Determine payment status
  if (this.amountDue <= 0) {
    this.status = "Paid";
    this.amountDue = 0; // Ensure no negative dues
  } else if (paid > 0 && paid < this.totalAmount) {
    this.status = "Partial";
  } else {
    this.status = "Pending";
  }

  next();
});

export default mongoose.models.Billing ||
  model<IBilling>("Billing", BillingSchema);
