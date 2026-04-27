import { auth } from "@/app/auth";
import { redirect } from "next/navigation";
import AppointmentsPageClient from "./AppointmentsPageClient";

export default async function AppointmentsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  if (session.user.role !== "Assistant") {
    redirect(`/dashboard/pages/${session.user.role}/appointments`);
  }

  return <AppointmentsPageClient />;
}
