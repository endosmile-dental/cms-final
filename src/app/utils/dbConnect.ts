import mongoose, { Connection } from "mongoose";
import UserModel from "../model/User.model";
import { setSuperAdminStatus } from "./globalStore";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is missing in environment variables");
}

// ✅ Define an interface for the global cache
interface MongooseCache {
  conn: Connection | null;
  promise: Promise<Connection> | null;
  superAdminChecked?: boolean;
}

// ✅ Use `globalThis` for better TypeScript support
const globalWithMongoose = globalThis as unknown as {
  mongoose?: MongooseCache;
};

// ✅ Initialize cache properly
const cached: MongooseCache = globalWithMongoose.mongoose ?? {
  conn: null,
  promise: null,
};

const dbConnect = async (): Promise<Connection> => {
  if (cached.conn) {
    console.log("Using existing MongoDB connection");
    return cached.conn;
  }

  if (!cached.promise) {
    console.log("Creating new MongoDB connection...");
    cached.promise = mongoose
      .connect(MONGODB_URI)
      .then((mongooseInstance) => mongooseInstance.connection);
  }

  try {
    cached.conn = await cached.promise;
    console.log("MongoDB connected");

    // ✅ Run SuperAdmin check only once
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

// ✅ Assign the properly typed `cached` object back to `global`
globalWithMongoose.mongoose = cached;

export default dbConnect;
