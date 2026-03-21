import { auth } from "@/app/auth";
import { redirect } from "next/navigation";
import DoctorAppointmentsClient from "./DoctorAppointmentsClient";
import { getDoctorAppointments } from "@/app/lib/server-data/appointments";
import { Suspense } from "react";
import { ErrorBoundary } from "@/app/components/ErrorBoundary";

export default async function DoctorAppointments() {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  if (session.user.role !== "Doctor") {
    redirect(`/dashboard/pages/${session.user.role}`);
  }

  // Fetch appointments on the server side
  const appointmentsData = await getDoctorAppointments(session.user.id);

  // Extract the allAppointments array for the client component
  // Handle both the new object structure and the fallback array
  const appointments = 'allAppointments' in appointmentsData 
    ? appointmentsData.allAppointments 
    : appointmentsData;

  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading appointments...</div>}>
        <DoctorAppointmentsClient initialAppointments={appointments} />
      </Suspense>
    </ErrorBoundary>
  );
}
