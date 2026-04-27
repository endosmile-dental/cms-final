import { auth } from "@/app/auth";
import { redirect } from "next/navigation";
import AssistantPatientRecordsClient from "./AssistantPatientRecordsClient";
import { getAssistantPatients } from "@/app/lib/server-data/patients";
import { Suspense } from "react";
import { ErrorBoundary } from "@/app/components/ErrorBoundary";
import Loading from "@/app/components/loading/Loading";

export default async function AssistantPatientRecords() {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  if (session.user.role !== "Assistant") {
    redirect(`/dashboard/pages/${session.user.role}`);
  }

  // Fetch patients for the assistant's clinic
  const patients = await getAssistantPatients(session.user.id);

  return (
    <ErrorBoundary>
      <Suspense fallback={<Loading />}>
        <AssistantPatientRecordsClient initialPatients={patients} />
      </Suspense>
    </ErrorBoundary>
  );
}
