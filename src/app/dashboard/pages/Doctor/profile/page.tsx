import { auth } from "@/app/auth";
import { redirect } from "next/navigation";
import ProfileSettingsClient from "./ProfileSettingsClient";

export default async function ProfileSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  if (session.user.role !== "Doctor") {
    redirect(`/dashboard/pages/${session.user.role}`);
  }

  return <ProfileSettingsClient />;
}
