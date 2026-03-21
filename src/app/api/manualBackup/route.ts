import { Readable } from "stream";
import dbConnect from "@/app/utils/dbConnect";
import { streamBackupZip } from "@/app/utils/backup";
import { requireAuth } from "@/app/utils/authz";

export async function POST() {
  await dbConnect();

  const authResult = await requireAuth(["Admin", "Doctor"]);
  if ("error" in authResult) return authResult.error;
  const { role } = authResult.user;

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `backup-${role}-${timestamp}.zip`;

  const nodeStream = await streamBackupZip({ role });

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
