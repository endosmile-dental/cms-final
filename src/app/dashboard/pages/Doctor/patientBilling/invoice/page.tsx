import { auth } from "@/app/auth";
import { redirect } from "next/navigation";
import InvoiceClient from "./InvoiceClient";

export default async function InvoicePage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  if (session.user.role !== "Doctor") {
    redirect(`/dashboard/pages/${session.user.role}`);
  }

  return <InvoiceClient />;
}
