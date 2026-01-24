import { Readable } from "stream";
import { auth } from "@/app/auth";
import dbConnect from "@/app/utils/dbConnect";
import { streamBackupZip } from "@/app/utils/backup";

export async function POST() {
  await dbConnect();

  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { role } = session.user as {
    role: "Admin" | "Doctor";
  };

  if (role !== "Admin" && role !== "Doctor") {
    return new Response("Forbidden", { status: 403 });
  }

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
