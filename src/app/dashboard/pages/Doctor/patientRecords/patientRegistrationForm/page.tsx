import { auth } from "@/app/auth";
import { redirect } from "next/navigation";
import PatientRegistrationFormClient from "./PatientRegistrationFormClient";

export default async function PatientRegistrationFormPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  if (session.user.role !== "Doctor") {
    redirect(`/dashboard/pages/${session.user.role}`);
  }

  return <PatientRegistrationFormClient />;
}
