import mongoose, { Connection, ConnectOptions } from "mongoose";
import UserModel from "../model/User.model";
import { setSuperAdminStatus } from "./globalStore";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is missing in environment variables");
}

// Define your cache interface
interface MongooseCache {
  conn: Connection | null;
  promise: Promise<Connection> | null;
  superAdminChecked?: boolean;
}

// Attach cache to globalThis so it persists across hot-reloads
const globalWithMongoose = globalThis as unknown as {
  mongoose?: MongooseCache;
};

const cached: MongooseCache = globalWithMongoose.mongoose ?? {
  conn: null,
  promise: null,
};

const dbConnect = async (
  retries = 3,
  initialDelayMs = 500
): Promise<Connection> => {
  // If we already have a live connection, return it
  if (cached.conn) {
    console.log("✅ Using existing MongoDB connection");
    return cached.conn;
  }

  // If there's already a “connecting Promise,” just await it
  if (!cached.promise) {
    console.log("🔄 Starting new MongoDB connection attempt...");

    // Turn off Mongoose buffering so we fail fast if the DB is unreachable
    mongoose.set("bufferCommands", false);

    const options: ConnectOptions = {
      bufferCommands: false, // do not buffer model calls
      serverSelectionTimeoutMS: 5000, // give up if no server in 5 seconds
      socketTimeoutMS: 45000, // close sockets after 45 seconds of inactivity
    };

    // Create the connect-promise (no retry here yet—will wrap below)
    cached.promise = mongoose
      .connect(MONGODB_URI, options)
      .then((mongooseInstance) => mongooseInstance.connection)
      .catch((err) => {
        // If connect() itself errors, clear the promise so we can retry
        cached.promise = null;
        throw err;
      });
  }

  // Wrap the “await cached.promise” in a retry loop with exponential backoff
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      cached.conn = await cached.promise; // either already-in-flight or just created
      console.log("✅ MongoDB connected");

      // Run the SuperAdmin check exactly once:
      if (!cached.superAdminChecked) {
        const superAdmin = await UserModel.findOne({
          role: "SuperAdmin",
        }).lean();
        setSuperAdminStatus(!!superAdmin);
        cached.superAdminChecked = true;
      }

      return cached.conn;
    } catch (err) {
      lastError = err;
      console.error(
        `❌ MongoDB connection attempt ${attempt} failed:`,
        (err as Error).message || err
      );

      // If this was NOT our last attempt, wait before retrying:
      if (attempt < retries) {
        const backoff = initialDelayMs * 2 ** (attempt - 1);
        console.log(`⏳ Retrying in ${backoff} ms...`);
        await new Promise((resolve) => setTimeout(resolve, backoff));

        // Ensure promise is reset so that a fresh connect() happens next loop
        if (!cached.conn) {
          const retryOptions: ConnectOptions = {
            bufferCommands: false,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
          };

          cached.promise = mongoose
            .connect(MONGODB_URI, retryOptions)
            .then((mongooseInstance) => mongooseInstance.connection)
            .catch((innerErr) => {
              cached.promise = null;
              throw innerErr;
            });
        }
      }
    }
  }

  // If we exit the loop, all retries failed
  console.error("❌ All MongoDB connection attempts failed.");
  throw lastError;
};

// Reassign to globalThis so hot-reload in dev doesn’t lose our cache
globalWithMongoose.mongoose = cached;

export default dbConnect;
