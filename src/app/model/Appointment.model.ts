import mongoose, { Schema, Document, model } from "mongoose";
import { nanoid } from "nanoid";

// ================== Appointment Model ==================
interface IAppointment extends Document {
  appointmentId: string;
  doctor: mongoose.Types.ObjectId;
  patient: mongoose.Types.ObjectId;
  appointmentDate: Date;
  status: "Scheduled" | "Completed" | "Cancelled";
  consultationType: "In-Person" | "Online";
  notes?: string;
  createdBy: mongoose.Types.ObjectId; // Admin or Doctor who created the appointment
}

const AppointmentSchema: Schema<IAppointment> = new Schema(
  {
    appointmentId: {
      type: String,
      required: true,
      unique: true,
      default: () => nanoid(),
    },
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    appointmentDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["Scheduled", "Completed", "Cancelled"],
      default: "Scheduled",
    },
    consultationType: {
      type: String,
      enum: ["In-Person", "Online"],
      required: true,
    },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Appointment ||
  model<IAppointment>("Appointment", AppointmentSchema);
