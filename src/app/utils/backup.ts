import path from "path";
import fs from "fs/promises";
import mongoose from "mongoose";
import archiver from "archiver";
import { createWriteStream } from "fs";
import BackupHistoryModel from "../model/BackupHistory.model";

interface BackupOptions {
  role: "Admin" | "Doctor";
  triggeredBy: string;
}

export async function triggerManualBackup({
  role,
  triggeredBy,
}: BackupOptions) {
  if (!mongoose.connection.db) {
    throw new Error("DB not connected");
  }

  const db = mongoose.connection.db;
  const date = new Date().toISOString().split("T")[0];
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  const baseDir = path.join(process.cwd(), "backups", date);
  const tempDir = path.join(baseDir, "temp");
  const filename = `backup-${role}-${timestamp}.zip`;
  const zipPath = path.join(baseDir, filename);

  await fs.mkdir(tempDir, { recursive: true });

  const allowedCollections =
    role === "Admin"
      ? await db.listCollections().toArray()
      : [{ name: "appointments" }, { name: "labworks" }, { name: "patients" }, { name: "billings" }];        

  for (const col of allowedCollections) {
    const docs = await db.collection(col.name).find({}).toArray();
    await fs.writeFile(
      path.join(tempDir, `${col.name}.json`),
      JSON.stringify(docs, null, 2)
    );
  }

  await zipDirectory(tempDir, zipPath);
  await fs.rm(tempDir, { recursive: true, force: true });

  const stats = await fs.stat(zipPath);

  await BackupHistoryModel.create({
    filename,
    role,
    path: zipPath,
    size: stats.size,
    triggeredBy,
  });

  return { filePath: zipPath, filename };
}

function zipDirectory(src: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(dest);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", resolve);
    archive.on("error", reject);

    archive.pipe(output);
    archive.directory(src, false);
    archive.finalize();
  });
}
