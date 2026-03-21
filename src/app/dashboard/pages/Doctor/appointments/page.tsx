import { auth } from "@/app/auth";
import { redirect } from "next/navigation";
import DoctorAppointmentsClient from "./DoctorAppointmentsClient";
import { getDoctorAppointments } from "@/app/lib/server-data/appointments";
import { Suspense } from "react";
import { ErrorBoundary } from "@/app/components/ErrorBoundary";
import type { Appointment } from "@/app/redux/slices/appointmentSlice";

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

  // Type assertion to ensure proper typing for the client component
  const typedAppointments = appointments as unknown as Appointment[];

  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading appointments...</div>}>
        <DoctorAppointmentsClient initialAppointments={typedAppointments} />
      </Suspense>
    </ErrorBoundary>
  );
}
