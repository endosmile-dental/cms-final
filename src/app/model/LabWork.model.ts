// models/labWork.model.ts
import { LabWorkInput } from "@/schemas/zobLabWorkSchema";
import mongoose, { Schema, model, Types, Document } from "mongoose";

// Define the attachment interface
export interface Attachment {
  public_id: string;
  url: string;
  format: string;
  bytes: number;
  original_filename: string;
}

// Extend LabWorkInput with Mongoose's Document
export interface ILabWork extends LabWorkInput, Document {
  _id: Types.ObjectId;
  attachments?: Attachment[];
}

// Define Attachment schema
const AttachmentSchema = new Schema({
  public_id: { type: String, required: true },
  url: { type: String, required: true },
  format: { type: String, required: true },
  bytes: { type: Number, required: true },
  original_filename: { type: String, required: true },
});

const LabWorkSchema = new Schema<ILabWork>({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true,
  },
  labName: {
    type: String,
    required: true,
  },
  orderType: {
    type: String,
    enum: [
      "Crown",
      "Bridge",
      "Denture",
      "Aligner",
      "Implant",
      "Inlay/Onlay",
      "Veneer",
      "Others",
    ],
    required: true,
  },
  othersText: { type: String },
  toothNumbers: [{ type: String }],
  shade: { type: String },
  material: { type: String },
  impressionsTakenOn: { type: Date },
  sentToLabOn: { type: Date },
  expectedDeliveryDate: { type: Date },
  reWorkSentDate: { type: Date },
  receivedFromLabOn: { type: Date },
  fittedOn: { type: Date },
  status: {
    type: String,
    enum: ["Pending", "Rework", "Received", "Fitted", "Cancelled"],
    default: "Pending",
  },
  remarks: String,
  attachments: [AttachmentSchema],
});

const LabWorkModel =
  mongoose.models.LabWork || model<ILabWork>("LabWork", LabWorkSchema);

export default LabWorkModel;
