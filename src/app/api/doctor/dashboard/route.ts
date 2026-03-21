// app/api/doctor/dashboard/route.ts

import { getDoctorDashboardData } from "@/app/lib/server-data/doctorDashboard";
import { successResponse } from "@/app/utils/api";
import { requireAuth } from "@/app/utils/authz";

export async function GET() {
  const authResult = await requireAuth(["Doctor", "Admin", "SuperAdmin"]);
  if ("error" in authResult) return authResult.error;

  const data = await getDoctorDashboardData(authResult.user.id);

  return successResponse(data);
}
