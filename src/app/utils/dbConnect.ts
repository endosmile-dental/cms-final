import mongoose from "mongoose";
import UserModel from "../model/User.model";
import { setSuperAdminStatus } from "./globalStore";

const dbConnect = async () => {
  if (mongoose.connections[0].readyState) {
    console.log("Using existing MongoDB connection");
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI || "");
    console.log("MongoDB connected");

    // ✅ Check if SuperAdmin exists on first startup
    const superAdmin = await UserModel.findOne({ role: "SuperAdmin" });
    setSuperAdminStatus(!!superAdmin);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw new Error("Failed to connect to MongoDB");
  }
};

export default dbConnect;
