import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "../ui/AppSidebar";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAppDispatch, useAppSelector } from "@/app/redux/store/hooks";
import { fetchPatients, selectPatients } from "@/app/redux/slices/patientSlice";
import { fetchBillings, selectBillings } from "@/app/redux/slices/billingSlice";
import {
  fetchAppointments,
  selectAppointments,
} from "@/app/redux/slices/appointmentSlice";
import { fetchProfile, ProfileData } from "@/app/redux/slices/profileSlice";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const dispatch = useAppDispatch();

  // Select existing data from Redux
  const patients = useAppSelector(selectPatients);
  const billings = useAppSelector(selectBillings);
  const appointments = useAppSelector(selectAppointments);
  const profile = useAppSelector((state) => {
    return state?.profile?.profile as ProfileData;
  });

  useEffect(() => {
    if (session?.user?.role === "Doctor") {
      // Fetch only if patients/billings are empty
      if (!patients || patients.length === 0)
        dispatch(fetchPatients(session?.user.id));
      if (!billings || billings.length === 0)
        dispatch(fetchBillings(session?.user.id));
      if (!appointments || appointments.length === 0)
        dispatch(fetchAppointments(session?.user.id));
      if (!profile)
        dispatch(
          fetchProfile({ userId: session.user.id, role: session.user.role })
        );

      // Fetch global profile data regardless of role.
    }
  }, [dispatch, session?.user?.id]); // Depend on role & existing data

  useEffect(() => {
    console.log("profile", profile);
  }, [profile]);

  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen bg-gray-100">
        <AppSidebar />

        {/* Main Content */}
        <main className="flex-1 px-1 md:px-2 w-full overflow-auto">
          <SidebarTrigger />
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
