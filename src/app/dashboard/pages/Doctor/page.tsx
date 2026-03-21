import { auth } from "@/app/auth";
import { redirect } from "next/navigation";
import DoctorDashboardClient from "./DoctorDashboardClient";
import { getDoctorDashboardData } from "@/app/lib/server-data/doctorDashboard";

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
