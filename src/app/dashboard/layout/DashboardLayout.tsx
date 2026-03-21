"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "../ui/AppSidebar";
import { DarkModeToggle } from "@/app/components/DarkModeToggle";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useAppDispatch } from "@/app/redux/store/hooks";
import { hydratePatients } from "@/app/redux/slices/patientSlice";
import { hydrateBillings } from "@/app/redux/slices/billingSlice";
import { hydrateAppointments } from "@/app/redux/slices/appointmentSlice";
import { hydrateProfile } from "@/app/redux/slices/profileSlice";
import { hydrateDoctors } from "@/app/redux/slices/doctorSlice";
import { hydrateLabWorks } from "@/app/redux/slices/labWorkSlice";
import { hydrateTreatments } from "@/app/redux/slices/treatmentSlice";
import {
  useAppointmentsQuery,
  useBillingsQuery,
  useDoctorsQuery,
  useLabWorksQuery,
  usePatientsQuery,
  useProfileQuery,
} from "@/app/react-query/queries/useDashboardQueries";
import { useTreatmentsQuery } from "@/app/react-query/queries/useTreatmentsQuery";
import GlobalOverlay from "@/app/components/doctor/GlobalOverlay";

type QueryNeeds = {
  treatments: boolean;
  billings: boolean;
  appointments: boolean;
  labworks: boolean;
  profile: boolean;
  doctors: boolean;
  patients: boolean;
};

function getDoctorRouteQueryNeeds(pathname: string): QueryNeeds {
  const base = "/dashboard/pages/Doctor";
  const isDoctorRoute = pathname.startsWith(base);

  if (!isDoctorRoute) {
    return {
      treatments: false,
      billings: false,
      appointments: false,
      labworks: false,
      profile: false,
      doctors: false,
      patients: false,
    };
  }

  const isAppointments = pathname.includes("/appointments");
  const isPatientRecords = pathname.includes("/patientRecords");
  const isRevenue = pathname.includes("/revenue");
  const isPatientBilling = pathname.includes("/patientBilling");
  const isLabWork = pathname.includes("/labWork");
  const isProfile = pathname.includes("/profile");

  return {
    // Doctor appointments views depend on treatment + patient data for edit/forms.
    treatments: isAppointments,
    // Revenue + billing pages require billings.
    billings: isRevenue || isPatientBilling,
    // Appointments route needs appointment list hydration.
    appointments: isAppointments,
    // Keep lab work query only on lab work route.
    labworks: isLabWork,
    // Profile route needs profile hydration.
    profile: isProfile,
    // Doctor pages generally do not need full doctors list from layout.
    doctors: false,
    // Patients are needed by records, appointments, billing, and lab work route features.
    patients: isPatientRecords || isAppointments || isPatientBilling || isRevenue || isLabWork,
  };
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const sessionUser = session?.user;
  const dispatch = useAppDispatch();

  const role = sessionUser?.role;
  const userId = sessionUser?.id;

  const isDoctor = role === "Doctor";
  const isPatient = role === "Patient";
  const dashboardRole = isDoctor ? "Doctor" : isPatient ? "Patient" : undefined;
  const canAccessDashboardData = Boolean(userId && dashboardRole);

  const doctorNeeds = getDoctorRouteQueryNeeds(pathname || "");

  // For non-doctor roles, keep previous behavior.
  const queryNeeds: QueryNeeds = isDoctor
    ? doctorNeeds
    : {
        treatments: canAccessDashboardData,
        billings: canAccessDashboardData,
        appointments: canAccessDashboardData,
        labworks: canAccessDashboardData,
        profile: canAccessDashboardData,
        doctors: canAccessDashboardData,
        patients: false,
      };

  const treatmentsQuery = useTreatmentsQuery(
    canAccessDashboardData && queryNeeds.treatments,
  );

  const billingsQuery = useBillingsQuery(
    userId,
    dashboardRole,
    canAccessDashboardData && queryNeeds.billings,
  );

  const appointmentsQuery = useAppointmentsQuery(
    userId,
    dashboardRole,
    canAccessDashboardData && queryNeeds.appointments,
  );

  const labWorksQuery = useLabWorksQuery(
    userId,
    dashboardRole,
    canAccessDashboardData && queryNeeds.labworks,
  );

  const profileQuery = useProfileQuery(
    userId,
    dashboardRole,
    canAccessDashboardData && queryNeeds.profile,
  );

  const doctorsQuery = useDoctorsQuery(
    userId,
    canAccessDashboardData && queryNeeds.doctors,
  );

  const patientsQuery = usePatientsQuery(
    userId,
    Boolean(userId && isDoctor && queryNeeds.patients),
  );

  useEffect(() => {
    if (!queryNeeds.treatments || !treatmentsQuery.data) return;
    dispatch(hydrateTreatments(treatmentsQuery.data));
  }, [dispatch, queryNeeds.treatments, treatmentsQuery.data]);

  useEffect(() => {
    if (!queryNeeds.billings || !billingsQuery.data) return;
    dispatch(hydrateBillings(billingsQuery.data));
  }, [billingsQuery.data, dispatch, queryNeeds.billings]);

  useEffect(() => {
    if (!queryNeeds.appointments || !appointmentsQuery.data) return;
    dispatch(hydrateAppointments(appointmentsQuery.data));
  }, [appointmentsQuery.data, dispatch, queryNeeds.appointments]);

  useEffect(() => {
    if (!queryNeeds.labworks || !labWorksQuery.data) return;
    dispatch(hydrateLabWorks(labWorksQuery.data));
  }, [dispatch, labWorksQuery.data, queryNeeds.labworks]);

  useEffect(() => {
    if (!queryNeeds.profile || profileQuery.data === undefined) return;
    dispatch(hydrateProfile(profileQuery.data));
  }, [dispatch, profileQuery.data, queryNeeds.profile]);

  useEffect(() => {
    if (!queryNeeds.doctors || !doctorsQuery.data) return;
    dispatch(hydrateDoctors(doctorsQuery.data));
  }, [dispatch, doctorsQuery.data, queryNeeds.doctors]);

  useEffect(() => {
    if (!queryNeeds.patients || !patientsQuery.data) return;
    dispatch(hydratePatients(patientsQuery.data));
  }, [dispatch, patientsQuery.data, queryNeeds.patients]);

  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen">
        <AppSidebar />

        <main className="flex-1 w-full overflow-auto">
          <div className="flex items-center justify-between p-4 border-b border-border bg-background">
            <SidebarTrigger />
            <DarkModeToggle />
          </div>
          <div className="p-4 bg-gradient-to-br from-sky-50 via-background to-violet-50 dark:from-slate-950 dark:via-background dark:to-slate-900">
            {children}
          </div>
          <GlobalOverlay />
        </main>
      </div>
    </SidebarProvider>
  );
}
