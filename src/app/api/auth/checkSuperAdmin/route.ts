// app/api/auth/checkSuperAdmin/route.ts
import { getSuperAdminStatus } from "@/app/utils/globalStore";
import { errorResponse, successResponse } from "@/app/utils/api";

export async function GET() {
  try {
    const superAdminExists = await getSuperAdminStatus();
    return successResponse({ superAdminExists });
  } catch (error) {
    console.error("Error checking SuperAdmin status:", error);
    return errorResponse(500, "Internal server error");
  }
}
