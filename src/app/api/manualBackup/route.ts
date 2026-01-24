import { NextResponse } from "next/server";
import fs from "fs/promises";
import dbConnect from "@/app/utils/dbConnect";
import { triggerManualBackup } from "@/app/utils/backup";
import { auth } from "@/app/auth"; // ✅ IMPORTANT

export async function POST() {
  try {
    await dbConnect();

    // ✅ NextAuth v5 way
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, id } = session.user as {
      role: "Admin" | "Doctor";
      id: string;
    };
    console.log("User Role:", role);
    
    // (Optional) restrict backups to admin and doctor only
    if (role !== "Admin" && role !== "Doctor") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { filePath, filename } = await triggerManualBackup({
      role,
      triggeredBy: id,
    });

    const buffer = await fs.readFile(filePath);

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("Backup error:", err);
    return NextResponse.json({ error: "Backup failed" }, { status: 500 });
  }
}
