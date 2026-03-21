import mongoose, { Document, Schema } from "mongoose";

export interface ITreatment extends Document {
  name: string;
  category: string;
  description?: string;
  defaultPrice?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const treatmentSchema = new Schema<ITreatment>({
  name: {
    type: String,
    required: [true, "Treatment name is required"],
    trim: true,
    unique: true,
    maxlength: [100, "Treatment name cannot exceed 100 characters"],
  },
  category: {
    type: String,
    required: [true, "Category is required"],
    enum: [
      "Consultation",
      "Diagnostic",
      "Restorative",
      "Prosthodontics",
      "Orthodontics",
      "Surgical",
      "Cosmetic",
      "Preventive",
      "Other",
    ],
    default: "Other",
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, "Description cannot exceed 500 characters"],
  },
  defaultPrice: {
    type: Number,
    min: [0, "Default price cannot be negative"],
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
treatmentSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Index for better performance
treatmentSchema.index({ category: 1 });
treatmentSchema.index({ isActive: 1 });

export const Treatment = mongoose.models.Treatment || mongoose.model<ITreatment>("Treatment", treatmentSchema);