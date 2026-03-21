import { auth } from "@/app/auth";
import { redirect } from "next/navigation";
import { getDoctorDashboardData } from "@/app/api/doctor/dashboard/route";
import DoctorDashboardClient from "./DoctorDashboardClient";

export default async function DoctorDashboard() {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  if (session.user.role !== "Doctor") {
    redirect(`/dashboard/pages/${session.user.role}`);
  }

  const data = await getDoctorDashboardData(session.user.id);

  return <DoctorDashboardClient data={data} />;
}
