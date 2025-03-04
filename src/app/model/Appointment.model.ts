import mongoose, { Schema, Document, model } from "mongoose";

interface IAppointment extends Document {
  doctor: mongoose.Types.ObjectId;
  patient: mongoose.Types.ObjectId;
  clinic: mongoose.Types.ObjectId;
  appointmentDate: Date;
  status: "Scheduled" | "Completed" | "Cancelled";
  consultationType: "New" | "Follow-up";
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  rescheduledAt?: Date;
  cancelledAt?: Date;
  paymentStatus?: "Pending" | "Paid" | "Refunded";
  amount?: number;
}

const AppointmentSchema: Schema<IAppointment> = new Schema(
  {
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    clinic: { type: Schema.Types.ObjectId, ref: "Clinic", required: true },
    appointmentDate: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ["Scheduled", "Completed", "Cancelled"],
      default: "Scheduled",
    },
    consultationType: {
      type: String,
      enum: ["New", "Follow-up"],
      required: true,
    },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rescheduledAt: { type: Date },
    cancelledAt: { type: Date },
    paymentStatus: { type: String, enum: ["Pending", "Paid", "Refunded"], default: "Pending" },
    amount: { type: Number, required: false },
  },
  { timestamps: true }
);


// Prevent past appointments from being created
AppointmentSchema.pre("save", function (next) {
  if (this.isNew && this.appointmentDate < new Date()) {
    return next(new Error("Appointment date must be in the future"));
  }
  next();
});

export default mongoose.models.Appointment || model<IAppointment>("Appointment", AppointmentSchema);
