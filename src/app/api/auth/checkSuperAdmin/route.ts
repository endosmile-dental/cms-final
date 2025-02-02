// app/api/auth/checkSuperAdmin/route.ts
import { getSuperAdminStatus } from "@/app/utils/globalStore";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const superAdminExists = await getSuperAdminStatus();
    return NextResponse.json({ superAdminExists });
  } catch (error) {
    console.error("Error checking SuperAdmin status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
