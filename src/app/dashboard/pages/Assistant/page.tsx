import { auth } from "@/app/auth";
import { redirect } from "next/navigation";
import { getAssistantDashboardData } from "@/app/lib/server-data/assistantDashboard";
import AssistantDashboardClient from "./AssistantDashboardClient";

export default async function AssistantDashboard() {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  if (session.user.role !== "Assistant") {
    redirect(`/dashboard/pages/${session.user.role}`);
  }

  const data = await getAssistantDashboardData(session.user.id);

  return <AssistantDashboardClient data={data} />;
}
