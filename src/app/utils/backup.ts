import archiver from "archiver";
import mongoose from "mongoose";
import { PassThrough } from "stream";

interface BackupOptions {
  role: "Admin" | "Doctor";
}

export async function streamBackupZip({ role }: BackupOptions) {
  if (!mongoose.connection.db) {
    throw new Error("DB not connected");
  }

  const db = mongoose.connection.db;

  const archive = archiver("zip", { zlib: { level: 9 } });
  const stream = new PassThrough();

  archive.pipe(stream);

  const collections =
    role === "Admin"
      ? await db.listCollections().toArray()
      : [
          { name: "appointments" },
          { name: "labworks" },
          { name: "patients" },
          { name: "billings" },
        ];

  for (const col of collections) {
    const cursor = db.collection(col.name).find();
    const jsonStream = new PassThrough();

    archive.append(jsonStream, { name: `${col.name}.json` });

    jsonStream.write("[\n");

    let first = true;
    for await (const doc of cursor) {
      if (!first) jsonStream.write(",\n");
      first = false;
      jsonStream.write(JSON.stringify(doc));
    }

    jsonStream.write("\n]");
    jsonStream.end();
  }

  await archive.finalize();

  return stream; // Node stream (correct)
}
