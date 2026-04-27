import { auth } from "@/app/auth";
import { redirect } from "next/navigation";
import AssistantBookAppointmentForm from "./AssistantBookAppointmentForm";

export default async function AssistantBookAppointmentPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  if (session.user.role !== "Assistant") {
    redirect(`/dashboard/pages/${session.user.role}/appointments`);
  }

  return <AssistantBookAppointmentForm />;
}
