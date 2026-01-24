import mongoose, { Schema, Types } from "mongoose";

const BackupHistorySchema = new Schema(
  {
    filename: {
      type: String,
      required: true,
      index: true,
    },

    // Absolute or relative path to backup zip
    path: {
      type: String,
      required: true,
    },

    // admin / doctor
    role: {
      type: String,
      enum: ["Admin", "Doctor"],
      required: true,
    },

    // Size in bytes
    size: {
      type: Number,
      required: true,
    },

    // User who triggered backup
    triggeredBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Explicit backup date (helps filtering & retention jobs)
    backupDate: {
      type: Date,
      required: true,
      default: () => new Date(),
      index: true,
    },
  },
  {
    timestamps: true, // createdAt / updatedAt
  }
);

export default mongoose.models.BackupHistory ||
  mongoose.model("BackupHistory", BackupHistorySchema);
