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
import { fetchDoctors } from "@/app/redux/slices/doctorSlice";

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
    if (session?.user?.role === "Doctor" || session?.user?.role === "Patient") {
      if (!billings || billings.length === 0)
        dispatch(
          fetchBillings({ userId: session.user.id, role: session.user.role })
        );
      if (!appointments || appointments.length === 0)
        dispatch(
          fetchAppointments({
            userId: session.user.id,
            role: session.user.role,
          })
        );
      if (!profile)
        dispatch(
          fetchProfile({ userId: session.user.id, role: session.user.role })
        );
      // Fetch global profile data regardless of role.
      dispatch(fetchDoctors({ userId: session?.user.id }));
    }

    if (session?.user.role === "Doctor") {
      if (!patients || patients.length === 0)
        dispatch(
          fetchPatients({ userId: session?.user.id, role: session?.user.role })
        );
    }
  }, [dispatch, session?.user?.id]); // Depend on role & existing data

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
