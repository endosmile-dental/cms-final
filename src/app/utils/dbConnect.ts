import mongoose, { Connection, ConnectOptions } from "mongoose";
import UserModel from "../model/User.model";
import { setSuperAdminStatus } from "./globalStore";
import { createWriteStream } from "fs";
import archiver from "archiver";
import { json2csv } from "json-2-csv";
import * as fs from "fs/promises";
import * as path from "path";
import { ObjectId } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is missing in environment variables");
}

// Storage monitoring configuration
const STORAGE_THRESHOLDS = {
  WARNING: 0.8, // 80% - send warning flag
  CRITICAL: 0.95, // 95% - trigger backup
  MAX_MEMORY: 512 * 1024 * 1024, // 512MB in bytes
} as const;

// Backup flag interface
interface BackupStatus {
  needsBackup: boolean;
  storageUsage: number;
  storagePercentage: number;
  message: string;
  timestamp: Date;
}

// Define your cache interface
interface MongooseCache {
  conn: Connection | null;
  promise: Promise<Connection> | null;
  superAdminChecked?: boolean;
  lastStorageCheck?: number;
  backupStatus?: BackupStatus;
  storageMonitoringStarted?: boolean;
}

// Attach cache to globalThis so it persists across hot-reloads
const globalWithMongoose = globalThis as unknown as {
  mongoose?: MongooseCache;
};

const cached: MongooseCache = globalWithMongoose.mongoose ?? {
  conn: null,
  promise: null,
};

class StorageMonitor {
  private static instance: StorageMonitor;
  private checkInterval: NodeJS.Timeout | null = null;
  private listeners: ((status: BackupStatus) => void)[] = [];
  private isMonitoring: boolean = false;

  private constructor() {}

  static getInstance(): StorageMonitor {
    if (!StorageMonitor.instance) {
      StorageMonitor.instance = new StorageMonitor();
    }
    return StorageMonitor.instance;
  }

  async checkStorageUsage(): Promise<BackupStatus> {
    try {
      // Check if connection and database are available
      if (
        !cached.conn ||
        !cached.conn.readyState ||
        cached.conn.readyState !== 1
      ) {
        throw new Error("Database connection not available or not connected");
      }

      // Type-safe check for db property
      const db = cached.conn.db;
      if (!db) {
        throw new Error("Database instance not available");
      }

      // Throttle checks - don't check more than once every 5 minutes
      if (
        cached.lastStorageCheck &&
        Date.now() - cached.lastStorageCheck < 5 * 60 * 1000
      ) {
        return cached.backupStatus!;
      }

      console.log("📊 Checking database storage usage...");

      // Get database stats - now db is guaranteed to be defined
      const stats = await db.stats();

      console.log("📊 Database Stats:", stats);

      // Calculate storage usage
      const storageSize = stats.storageSize || 0;
      const storagePercentage = storageSize / STORAGE_THRESHOLDS.MAX_MEMORY;
      console.log(
        `📊 Storage Percentage: ${storagePercentage} bytes (${(
          storagePercentage * 100
        ).toFixed(1)}%)`
      );
      console.log(
        `📊 Storage Threshold max mem: ${STORAGE_THRESHOLDS.MAX_MEMORY}`
      );
      console.log(
        `📊 Storage Threshold critical: ${STORAGE_THRESHOLDS.CRITICAL}`
      );
      console.log(
        `📊 Storage Threshold warning: ${STORAGE_THRESHOLDS.WARNING}`
      );

      let needsBackup = false;
      let message = "Storage usage normal";

      if (storagePercentage >= STORAGE_THRESHOLDS.CRITICAL) {
        needsBackup = true;
        message = `CRITICAL: Storage usage at ${(
          storagePercentage * 100
        ).toFixed(1)}%. Backup required immediately.`;
      } else if (storagePercentage >= STORAGE_THRESHOLDS.WARNING) {
        needsBackup = true;
        message = `WARNING: Storage usage at ${(
          storagePercentage * 100
        ).toFixed(1)}%. Consider backup soon.`;
      }

      const backupStatus: BackupStatus = {
        needsBackup,
        storageUsage: storageSize,
        storagePercentage,
        message,
        timestamp: new Date(),
      };

      // Update cache
      cached.backupStatus = backupStatus;
      cached.lastStorageCheck = Date.now();

      console.log(`📊 Storage Check: ${backupStatus}`);

      // Notify listeners
      this.notifyListeners(backupStatus);

      // Trigger backup if needed (only for critical, not warning)
      // if (needsBackup && storagePercentage >= STORAGE_THRESHOLDS.CRITICAL) {
      //   console.log("🚨 Critical storage level reached, triggering backup...");
      //   await this.triggerAutomaticBackup();
      // }

      if (needsBackup && storagePercentage >= STORAGE_THRESHOLDS.CRITICAL) {
        console.log("🚨 Critical storage level reached, triggering backup...");
        await this.triggerAutomaticBackup();
      }

      return backupStatus;
    } catch (error) {
      console.error("❌ Storage monitoring failed:", error);
      const errorStatus: BackupStatus = {
        needsBackup: false,
        storageUsage: 0,
        storagePercentage: 0,
        message: `Storage monitoring error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        timestamp: new Date(),
      };
      cached.backupStatus = errorStatus;
      return errorStatus;
    }
  }

  private async triggerAutomaticBackup(): Promise<void> {
    try {
      console.log(
        "🔄 Starting automatic backup due to critical storage levels..."
      );

      // Implement your actual backup logic here
      await this.performDatabaseBackup();

      console.log("✅ Automatic backup completed successfully");

      // After backup, check storage again
      setTimeout(() => this.checkStorageUsage(), 10000);
    } catch (error) {
      console.error("❌ Automatic backup failed:", error);
    }
  }

  private async performDatabaseBackup(): Promise<void> {
    if (!cached.conn || !cached.conn.db) {
      throw new Error("No database connection available for backup");
    }

    const db = cached.conn.db;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupDir = path.join(process.cwd(), "temp-backup", timestamp);
    const zipFilePath = path.join(
      process.cwd(),
      "backups",
      `backup-${timestamp}.zip`
    );

    try {
      // Create directories
      await fs.mkdir(backupDir, { recursive: true });
      await fs.mkdir(path.dirname(zipFilePath), { recursive: true });

      console.log("📦 Starting database backup...");

      // Get all collections
      const collections = await db.listCollections().toArray();
      console.log(`📊 Found ${collections.length} collections to backup`);

      // Backup each collection to CSV
      for (const collectionInfo of collections) {
        await this.backupCollectionToCSV(db, collectionInfo.name, backupDir);
      }

      // Create compressed zip file
      await this.createCompressedZip(backupDir, zipFilePath);

      console.log(`✅ Backup completed successfully: ${zipFilePath}`);

      // Clean up temporary files
      await fs.rm(backupDir, { recursive: true });

      // Optional: Clean up old data after backup
      await this.cleanupOldData();
    } catch (error) {
      console.error("❌ Backup failed:", error);
      // Clean up temporary directory on error
      try {
        await fs.rm(backupDir, { recursive: true });
      } catch (cleanupError) {
        console.error("Failed to clean up temporary directory:", cleanupError);
      }
      throw error;
    }
  }

  private async backupCollectionToCSV(
    db: mongoose.mongo.Db,
    collectionName: string,
    backupDir: string
  ): Promise<void> {
    try {
      console.log(`📄 Backing up collection: ${collectionName}`);

      const collection = db.collection(collectionName);
      const cursor = collection.find();
      const documents = await cursor.toArray();

      if (documents.length === 0) {
        console.log(
          `   ⚠️  Collection ${collectionName} is empty, skipping...`
        );
        return;
      }

      // Transform documents for CSV (handle ObjectId, Date, etc.)
      const transformedDocs = documents.map((doc: unknown) =>
        this.transformDocumentForCSV(doc)
      );

      // Convert to CSV using json-2-csv
      const csv = await json2csv(transformedDocs, {
        expandArrayObjects: false,
        expandNestedObjects: false,
        prependHeader: true,
        sortHeader: true,
        excelBOM: true,
        keys: this.getFieldsFromDocuments(transformedDocs),
      });

      // Write CSV file
      const csvFilePath = path.join(backupDir, `${collectionName}.csv`);
      await fs.writeFile(csvFilePath, csv, "utf8");

      console.log(
        `   ✅ ${collectionName}: ${documents.length} records backed up`
      );
    } catch (error) {
      console.error(
        `   ❌ Failed to backup collection ${collectionName}:`,
        error
      );
      throw error;
    }
  }

  private transformDocumentForCSV(doc: unknown): Record<string, unknown> {
    const transformed: Record<string, unknown> = {};

    // Type guard to check if it's a record
    if (typeof doc !== "object" || doc === null) {
      return transformed;
    }

    for (const [key, value] of Object.entries(doc)) {
      if (value instanceof ObjectId) {
        transformed[key] = value.toString();
      } else if (value instanceof Date) {
        transformed[key] = value.toISOString();
      } else if (Array.isArray(value)) {
        // For arrays, transform each item
        transformed[key] = value
          .map((item: unknown) => {
            if (item instanceof ObjectId) return item.toString();
            if (item instanceof Date) return item.toISOString();
            if (typeof item === "object" && item !== null)
              return JSON.stringify(item);
            return item;
          })
          .join("; "); // Use semicolon as delimiter for array items
      } else if (typeof value === "object" && value !== null) {
        transformed[key] = JSON.stringify(value);
      } else {
        transformed[key] = value;
      }
    }

    return transformed;
  }

  private getFieldsFromDocuments(
    documents: Record<string, unknown>[]
  ): string[] {
    if (documents.length === 0) return [];

    const allFields = new Set<string>();

    documents.forEach((doc) => {
      Object.keys(doc).forEach((field) => {
        allFields.add(field);
      });
    });

    return Array.from(allFields).sort();
  }

  private async createCompressedZip(
    sourceDir: string,
    zipFilePath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = createWriteStream(zipFilePath);
      const archive = archiver("zip", {
        zlib: { level: 9 }, // Maximum compression
      });

      output.on("close", () => {
        console.log(`📦 Zip file created: ${archive.pointer()} total bytes`);
        resolve();
      });

      archive.on("error", (err) => {
        reject(err);
      });

      archive.pipe(output);

      // Add all CSV files from the backup directory
      archive.directory(sourceDir, false);

      archive.finalize();
    });
  }

  // Alternative streaming version for large collections (more memory efficient)
  private async backupCollectionToCSVStreaming(
    db: mongoose.mongo.Db,
    collectionName: string,
    backupDir: string
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const collection = db.collection(collectionName);
        const cursor = collection.find();

        const fieldSet = new Set<string>();
        const documents: Record<string, unknown>[] = [];
        let processedCount = 0;
        const batchSize = 1000;

        const csvFilePath = path.join(backupDir, `${collectionName}.csv`);
        let isFirstBatch = true;

        while (await cursor.hasNext()) {
          const doc = await cursor.next();
          const transformedDoc = this.transformDocumentForCSV(doc);
          documents.push(transformedDoc);

          // Update field set with new fields
          Object.keys(transformedDoc).forEach((field) => fieldSet.add(field));

          processedCount++;

          // Process in batches
          if (documents.length >= batchSize) {
            await this.writeCSVBatch(
              csvFilePath,
              Array.from(fieldSet),
              documents,
              isFirstBatch
            );
            documents.length = 0; // Clear array
            isFirstBatch = false;
            console.log(
              `   📊 ${collectionName}: Processed ${processedCount} records...`
            );
          }
        }

        // Write remaining documents
        if (documents.length > 0) {
          await this.writeCSVBatch(
            csvFilePath,
            Array.from(fieldSet),
            documents,
            isFirstBatch
          );
        }

        console.log(
          `   ✅ ${collectionName}: ${processedCount} records backed up`
        );
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  private async writeCSVBatch(
    csvFilePath: string,
    fields: string[],
    documents: Record<string, unknown>[],
    isFirstBatch: boolean
  ): Promise<void> {
    const csv = await json2csv(documents, {
      expandArrayObjects: false,
      expandNestedObjects: false,
      prependHeader: isFirstBatch, // Only include header for first batch
      sortHeader: true,
      excelBOM: isFirstBatch, // Only include BOM for first batch
      keys: fields,
    });

    if (isFirstBatch) {
      await fs.writeFile(csvFilePath, csv, "utf8");
    } else {
      // For subsequent batches, remove the header line if it exists
      const lines = csv.split("\n");
      const dataWithoutHeader = lines.slice(1).join("\n");
      if (dataWithoutHeader) {
        await fs.appendFile(csvFilePath, "\n" + dataWithoutHeader);
      }
    }
  }

  private async cleanupOldData(): Promise<void> {
    try {
      console.log("🧹 Cleaning up old data to free up space...");

      // Example: Delete records older than 1 year
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      // Implement your actual cleanup logic here for specific collections
      // Example:
      // await BillingModel.deleteMany({ createdAt: { $lt: oneYearAgo } });
      // await AppointmentModel.deleteMany({ appointmentDate: { $lt: oneYearAgo } });

      // Clean up old backup files (keep only last 5 backups)
      await this.cleanupOldBackups();

      console.log("✅ Old data cleanup completed");
    } catch (error) {
      console.error("❌ Data cleanup failed:", error);
    }
  }

  private async cleanupOldBackups(): Promise<void> {
    try {
      const backupsDir = path.join(process.cwd(), "backups");

      try {
        await fs.access(backupsDir);
      } catch {
        // Backups directory doesn't exist, nothing to clean up
        return;
      }

      const files = await fs.readdir(backupsDir);

      // Create an array of backup file info with stats
      const backupFilesWithStats = await Promise.all(
        files
          .filter(
            (file: string) =>
              file.startsWith("backup-") && file.endsWith(".zip")
          )
          .map(async (file: string) => {
            const filePath = path.join(backupsDir, file);
            const stats = await fs.stat(filePath);
            return {
              name: file,
              path: filePath,
              time: stats.mtime.getTime(),
            };
          })
      );

      // Sort by newest first
      const backupFiles = backupFilesWithStats.sort((a, b) => b.time - a.time);

      // Keep only the last 5 backups
      const filesToDelete = backupFiles.slice(5);

      for (const file of filesToDelete) {
        await fs.unlink(file.path);
        console.log(`🗑️  Deleted old backup: ${file.name}`);
      }

      if (filesToDelete.length > 0) {
        console.log(`✅ Cleaned up ${filesToDelete.length} old backup files`);
      }
    } catch (error) {
      console.error("Failed to clean up old backups:", error);
    }
  }

  addListener(listener: (status: BackupStatus) => void): void {
    this.listeners.push(listener);
  }

  removeListener(listener: (status: BackupStatus) => void): void {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  private notifyListeners(status: BackupStatus): void {
    this.listeners.forEach((listener) => {
      try {
        listener(status);
      } catch (error) {
        console.error("Error in storage listener:", error);
      }
    });
  }

  startMonitoring(intervalMs: number = 30 * 60 * 1000): void {
    // Prevent multiple monitoring intervals
    if (this.isMonitoring) {
      console.log("📊 Storage monitoring is already running");
      return;
    }

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(async () => {
      try {
        await this.checkStorageUsage();
      } catch (error) {
        console.error("Periodic storage check failed:", error);
      }
    }, intervalMs);

    this.isMonitoring = true;
    cached.storageMonitoringStarted = true;

    console.log(
      `📊 Storage monitoring started (interval: ${intervalMs / 60000} minutes)`
    );

    // Do initial check
    setTimeout(() => {
      this.checkStorageUsage().catch((error) => {
        console.error("Initial storage check failed:", error);
      });
    }, 5000);
  }

  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isMonitoring = false;
    cached.storageMonitoringStarted = false;
    console.log("📊 Storage monitoring stopped");
  }

  getLastStatus(): BackupStatus | null {
    return cached.backupStatus || null;
  }

  isStorageMonitoring(): boolean {
    return this.isMonitoring;
  }
}

// Export the storage monitor instance
export const storageMonitor = StorageMonitor.getInstance();

const dbConnect = async (
  retries = 3,
  initialDelayMs = 500
): Promise<Connection> => {
  // If we already have a live connection, return it
  if (cached.conn) {
    console.log("✅ Using existing MongoDB connection");

    // Start storage monitoring ONLY if not already started
    if (!cached.storageMonitoringStarted && cached.conn.readyState === 1) {
      setTimeout(() => {
        storageMonitor.startMonitoring();
      }, 5000);
    }

    return cached.conn;
  }

  // If there's already a "connecting Promise," just await it
  if (!cached.promise) {
    console.log("🔄 Starting new MongoDB connection attempt...");

    // Turn off Mongoose buffering so we fail fast if the DB is unreachable
    mongoose.set("bufferCommands", false);

    const options: ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    // Create the connect-promise
    cached.promise = mongoose
      .connect(MONGODB_URI, options)
      .then((mongooseInstance) => {
        const conn = mongooseInstance.connection;

        console.log("✅ MongoDB connected successfully");

        // Start storage monitoring ONLY if not already started
        if (!cached.storageMonitoringStarted) {
          setTimeout(() => {
            storageMonitor.startMonitoring();
          }, 5000);
        }

        return conn;
      })
      .catch((err) => {
        cached.promise = null;
        throw err;
      });
  }

  // Retry logic with exponential backoff
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      cached.conn = await cached.promise;
      console.log("✅ MongoDB connection established");

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

      if (attempt < retries) {
        const backoff = initialDelayMs * 2 ** (attempt - 1);
        console.log(`⏳ Retrying in ${backoff} ms...`);
        await new Promise((resolve) => setTimeout(resolve, backoff));

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

  console.error("❌ All MongoDB connection attempts failed.");
  throw lastError;
};

// Reassign to globalThis so hot-reload in dev doesn't lose our cache
globalWithMongoose.mongoose = cached;

// Export utility functions
export const getStorageStatus = (): BackupStatus | null => {
  return storageMonitor.getLastStatus();
};

export const forceStorageCheck = (): Promise<BackupStatus> => {
  return storageMonitor.checkStorageUsage();
};

export const startStorageMonitoring = (intervalMs?: number): void => {
  storageMonitor.startMonitoring(intervalMs);
};

export const stopStorageMonitoring = (): void => {
  storageMonitor.stopMonitoring();
};

export const isStorageMonitoring = (): boolean => {
  return storageMonitor.isStorageMonitoring();
};

export const onStorageStatusChange = (
  callback: (status: BackupStatus) => void
): void => {
  storageMonitor.addListener(callback);
};

export default dbConnect;
