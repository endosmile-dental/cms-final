import { auth } from "@/app/auth";
import { redirect } from "next/navigation";
import LabWorkClient from "./LabWorkClient";
import { getDoctorLabWorks, getDoctorLabWorkAnalytics } from "@/app/lib/server-data/labWork";
import { getDoctorPatients } from "@/app/lib/server-data/patients";
import { Suspense } from "react";
import { ErrorBoundary } from "@/app/components/ErrorBoundary";

export default async function LabWorkPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  if (session.user.role !== "Doctor") {
    redirect(`/dashboard/pages/${session.user.role}`);
  }

  // Fetch lab work records, analytics, and patients on the server side
  const [labWorks, analytics, patients] = await Promise.all([
    getDoctorLabWorks(session.user.id),
    getDoctorLabWorkAnalytics(session.user.id),
    getDoctorPatients(session.user.id),
  ]);

  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading lab work dashboard...</div>}>
        <LabWorkClient 
          initialLabWorks={labWorks} 
          initialAnalytics={analytics} 
          initialPatients={patients}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
