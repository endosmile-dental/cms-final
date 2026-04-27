import mongoose, { model, Schema } from "mongoose";
import bcrypt from "bcryptjs"; // ✅ Use bcryptjs for hashing

export interface IUser extends Document {
  email: string;
  password: string;
  role:
    | "SuperAdmin"
    | "Admin"
    | "clientAdmin"
    | "Doctor"
    | "Assistant"
    | "Patient";
  profileImageUrl?: string;
  registrationDate?: Date;
  lastLogin?: Date;
  isActive?: boolean;
  status: "Active" | "Inactive" | "Suspended";
  matchPassword: (enteredPassword: string) => Promise<boolean>;
}

// Define the User Schema
const userSchema: Schema<IUser> = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /^\S+@\S+\.\S+$/,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: [
        "SuperAdmin",
        "Admin",
        "clientAdmin",
        "Doctor",
        "Assistant",
        "Patient",
      ],
      required: true,
    },
    profileImageUrl: {
      type: String,
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    lastLogin: {
      type: Date,
    },
    // Account Status
    status: {
      type: String,
      enum: ["Active", "Inactive", "Suspended"],
      default: "Inactive",
    },
    // Online Status
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// 🔐 Password Hashing Middleware
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10); // ✅ Generate salt
  this.password = await bcrypt.hash(this.password, salt); // ✅ Hash password
  next();
});

// 🔐 Password Comparison Method
userSchema.methods.matchPassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password); // ✅ Compare hashed password
};

export default mongoose.models.User || model<IUser>("User", userSchema);
