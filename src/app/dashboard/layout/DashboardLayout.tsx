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
    const fetchData = async () => {
      if (!session?.user) return;

      const { id, role } = session.user;

      const promises = [];

      // Shared for both Doctor and Patient
      if (role === "Doctor" || role === "Patient") {
        if (!billings || billings.length === 0) {
          promises.push(dispatch(fetchBillings({ userId: id, role })));
        }

        if (!appointments || appointments.length === 0) {
          promises.push(dispatch(fetchAppointments({ userId: id, role })));
        }

        if (!profile) {
          promises.push(dispatch(fetchProfile({ userId: id, role })));
        }

        // Global data
        promises.push(dispatch(fetchDoctors({ userId: id })));
      }

      if (role === "Doctor") {
        if (!patients || patients.length === 0) {
          promises.push(dispatch(fetchPatients({ userId: id, role })));
        }
      }

      try {
        await Promise.all(promises); // wait for all dispatches to finish
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();
  }, [dispatch, session?.user?.id]);

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
