import { auth } from "@/app/auth";
import { redirect } from "next/navigation";
import PatientBillingClient from "./PatientBillingClient";
import { getDoctorPatients } from "@/app/lib/server-data/patients";
import { getDoctorBillingRecords } from "@/app/lib/server-data/billing";
import { getTreatments } from "@/app/lib/server-data/treatments";

export default async function PatientBillingPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  if (session.user.role !== "Doctor") {
    redirect(`/dashboard/pages/${session.user.role}`);
  }

  // Pre-fetch data on server side for better performance
  const [patients, billings, treatments] = await Promise.all([
    getDoctorPatients(session.user.id),
    getDoctorBillingRecords(session.user.id),
    getTreatments()
  ]);

  return (
    <PatientBillingClient 
      initialPatients={patients}
      initialBillings={billings}
    />
  );
}
