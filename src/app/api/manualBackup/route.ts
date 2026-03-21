import { Readable } from "stream";
import dbConnect from "@/app/utils/dbConnect";
import { streamBackupZip } from "@/app/utils/backup";
import { requireAuth } from "@/app/utils/authz";

export async function POST() {
  await dbConnect();

  const authResult = await requireAuth(["Admin", "Doctor", "SuperAdmin"]);
  if ("error" in authResult) return authResult.error;
  const { role } = authResult.user;

  // Check if role is allowed for backup
  if (role === "Patient") {
    return new Response("Unauthorized for backup", { status: 403 });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `backup-${role}-${timestamp}.zip`;

  const nodeStream = await streamBackupZip({ role: role as "Admin" | "Doctor" | "SuperAdmin" });

  // ✅ Node → Web stream (runtime correct)
  const webStream = Readable.toWeb(nodeStream);

  // ✅ Narrow, intentional bridge cast (NOT `any`)
  return new Response(webStream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
