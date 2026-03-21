import { auth } from "@/app/auth";
import { redirect } from "next/navigation";
import RevenueDashboardClient from "./RevenueDashboardClient";
import { getDoctorBillingRecords, getDoctorBillingAnalytics } from "@/app/lib/server-data/billing";
import { getDoctorPatients } from "@/app/lib/server-data/patients";
import { Suspense } from "react";
import { ErrorBoundary } from "@/app/components/ErrorBoundary";

export default async function RevenuePage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  if (session.user.role !== "Doctor") {
    redirect(`/dashboard/pages/${session.user.role}`);
  }

  // Fetch billing records, analytics, and patients on the server side
  const [billings, analytics, patients] = await Promise.all([
    getDoctorBillingRecords(session.user.id),
    getDoctorBillingAnalytics(session.user.id),
    getDoctorPatients(session.user.id),
  ]);

  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading revenue dashboard...</div>}>
        <RevenueDashboardClient 
          initialBillings={billings} 
          initialAnalytics={analytics} 
          initialPatients={patients}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
