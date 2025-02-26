import mongoose from "mongoose";
import UserModel from "../model/User.model";
import { setSuperAdminStatus } from "./globalStore";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is missing in environment variables");
}

// ✅ Use a global cache to persist connection across requests
let cached = (global as any).mongoose || { conn: null, promise: null };

const dbConnect = async () => {
  if (cached.conn) {
    console.log("Using existing MongoDB connection");
    return cached.conn;
  }

  if (!cached.promise) {
    console.log("Creating new MongoDB connection...");
    cached.promise = mongoose.connect(MONGODB_URI);
  }

  try {
    cached.conn = await cached.promise;
    console.log("MongoDB connected");

    // ✅ Run SuperAdmin check only **once** (not on every request)
    if (!cached.superAdminChecked) {
      const superAdmin = await UserModel.findOne({ role: "SuperAdmin" });
      setSuperAdminStatus(!!superAdmin);
      cached.superAdminChecked = true;
    }

    return cached.conn;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw new Error("Failed to connect to MongoDB");
  }
};

(global as any).mongoose = cached;

export default dbConnect;
