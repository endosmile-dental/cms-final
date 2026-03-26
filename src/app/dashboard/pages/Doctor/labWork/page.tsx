import { auth } from "@/app/auth";
import { redirect } from "next/navigation";
import LabWorkClient, { LabAnalytics } from "./LabWorkClient";
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
  let labWorks: unknown[] = [];
  let analytics: LabAnalytics | undefined = undefined;
  let patients: unknown[] = [];

  try {
    const results = await Promise.all([
      getDoctorLabWorks(session.user.id),
      getDoctorLabWorkAnalytics(session.user.id),
      getDoctorPatients(session.user.id),
    ]);
    labWorks = results[0];
    analytics = results[1] as LabAnalytics;
    patients = results[2];

    console.log("Server-side lab works fetched:", labWorks?.length || 0, "items");
    console.log("Server-side analytics:", analytics);
  } catch (error) {
    console.error("Error fetching lab works on server:", error);
    // Continue with empty data - component will fetch from API if needed
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading lab work dashboard...</div>}>
        <LabWorkClient
          initialLabWorks={labWorks as any}
          initialAnalytics={analytics}
          initialPatients={patients as any}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
