import { auth } from "@/app/auth";
import { redirect } from "next/navigation";
import LabWorkClient, { LabAnalytics } from "./LabWorkClient";
import { getDoctorLabWorks, getDoctorLabWorkAnalytics } from "@/app/lib/server-data/labWork";
import { getDoctorPatients } from "@/app/lib/server-data/patients";
import { Suspense } from "react";
import { ErrorBoundary } from "@/app/components/ErrorBoundary";
import { ILabWork, LabWorkPatient } from "@/app/redux/slices/labWorkSlice";

export default async function LabWorkPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  if (session.user.role !== "Doctor") {
    redirect(`/dashboard/pages/${session.user.role}`);
  }

  // Fetch lab work records, analytics, and patients on the server side
  let labWorks: ILabWork[] = [];
  let analytics: LabAnalytics | undefined = undefined;
  let patients: LabWorkPatient[] = [];

  try {
    const results = await Promise.all([
      getDoctorLabWorks(session.user.id),
      getDoctorLabWorkAnalytics(session.user.id),
      getDoctorPatients(session.user.id),
    ]);
    labWorks = results[0] as unknown as ILabWork[];
    analytics = results[1] as LabAnalytics;
    patients = results[2] as unknown as LabWorkPatient[];

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
          initialLabWorks={labWorks}
          initialAnalytics={analytics}
          initialPatients={patients}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
