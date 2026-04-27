import { auth } from "@/app/auth";
import { redirect } from "next/navigation";
import PatientRecordsClient from "./PatientRecordsClient";
import { getDoctorPatients } from "@/app/lib/server-data/patients";
import { Suspense } from "react";
import { ErrorBoundary } from "@/app/components/ErrorBoundary";
import Loading from "@/app/components/loading/Loading";

export default async function PatientRecords() {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  if (session.user.role !== "Doctor") {
    redirect(`/dashboard/pages/${session.user.role}`);
  }

  // Fetch patients on the server side
  const patients = await getDoctorPatients(session.user.id);

  return (
    <ErrorBoundary>
      <Suspense fallback={<Loading />}>
        <PatientRecordsClient initialPatients={patients} />
      </Suspense>
    </ErrorBoundary>
  );
}
