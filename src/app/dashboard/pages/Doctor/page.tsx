"use client";

import React, { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/app/dashboard/layout/DashboardLayout";
import DashboardCards, { Stat } from "@/app/dashboard/ui/DashboardCards";
import DashboardChart from "@/app/dashboard/ui/DashboardChart";
import DashboardPieChart from "@/app/dashboard/ui/DashboardPieChart";
import DashboardCalendar, {
  AppointmentDateDetailed,
} from "@/app/dashboard/ui/DashboardCalendar";
import {
  Syringe,
  User,
  AlertTriangle,
  UserRoundPlus,
  ClipboardPlus,
  LucideFlaskConical,
  FlaskConical,
} from "lucide-react";
import { useAppSelector } from "@/app/redux/store/hooks";
import {
  selectPatientLoading,
  selectPatients,
} from "@/app/redux/slices/patientSlice";
import {
  selectAppointments,
  selectAppointmentsLoading,
} from "@/app/redux/slices/appointmentSlice";
import {
  selectBillings,
  selectBillingsLoading,
} from "@/app/redux/slices/billingSlice";
import { format } from "date-fns";
import { DashboardBarChart } from "../../ui/DashboardBarChart";
import { ChartConfig } from "@/components/ui/chart";
import {
  selectProfile,
  selectProfileLoading,
} from "@/app/redux/slices/profileSlice";
import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import IconButtonWithTooltip from "@/app/components/IconButtonWithTooltip";
import DataTable from "@/app/components/DataTable";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Loading from "@/app/components/loading/Loading";
import {
  selectAllLabWorks,
  selectLabWorkLoading,
} from "@/app/redux/slices/labWorkSlice";

interface BillingTreatment {
  treatment: string;
  quantity?: number;
}

export default function DoctorDashboard() {
  const patients = useAppSelector(selectPatients);
  const patientsLoading = useAppSelector(selectPatientLoading);
  const appointments = useAppSelector(selectAppointments);
  const appointmentsLoading = useAppSelector(selectAppointmentsLoading);
  const billings = useAppSelector(selectBillings);
  const billingsLoading = useAppSelector(selectBillingsLoading);
  const profile = useAppSelector(selectProfile);
  const profileLoading = useAppSelector(selectProfileLoading);

  const labWorks = useAppSelector(selectAllLabWorks);
  const labWorksLoading = useAppSelector(selectLabWorkLoading);

  const { data: session, status: sessionStatus } = useSession();

  // Combined loading state
  const isDataLoading = useMemo(
    () =>
      sessionStatus === "loading" ||
      profileLoading ||
      patientsLoading ||
      appointmentsLoading ||
      billingsLoading ||
      labWorksLoading,
    [
      sessionStatus,
      profileLoading,
      patientsLoading,
      appointmentsLoading,
      billingsLoading,
      labWorksLoading,
    ]
  );

  const [tableData, setTableData] = useState<
    {
      id: string;
      patient: string;
      contact: string;
      gender: "Male" | "Female" | "Other";
      dob: string;
      registeredAt: string;
    }[]
  >([]);

  const router = useRouter();

  useEffect(() => {
    if (patients) {
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
      };

      const patientsTableData = [...patients]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .map((patient) => ({
          id: patient._id,
          patient: patient.fullName,
          contact: patient.contactNumber,
          gender: patient.gender,
          dob: new Date(patient.dateOfBirth).toLocaleDateString(
            "en-US",
            options
          ),
          registeredAt: new Date(patient.createdAt).toLocaleDateString(
            "en-US",
            options
          ),
        }));
      setTableData(patientsTableData);
    }
  }, [patients]);

  const pendingCount = useMemo(() => {
    return labWorks?.filter((lab) => lab.status === "Pending").length || 0;
  }, [labWorks]);

  const aggregatedAppointments = useMemo(() => {
    const result = {
      followUps: 0,
      pending: 0,
      upcoming: 0,
      monthly: {} as Record<string, { completed: number; scheduled: number }>,
      weekly: {} as Record<string, { completed: number; scheduled: number }>,
      yearly: {} as Record<string, { completed: number; scheduled: number }>,
      uniqueDates: new Set<string>(),
    };

    if (!appointments || appointments.length === 0) return result;

    const today = new Date();

    appointments.forEach((appointment) => {
      const appointmentDate = new Date(appointment.appointmentDate);

      if (appointment.consultationType === "Follow-up") result.followUps++;
      else if (appointment.consultationType === "New") result.pending++;

      if (
        appointmentDate >= today &&
        !["Completed", "Cancelled"].includes(appointment.status)
      ) {
        result.upcoming++;
      }

      const month = format(appointmentDate, "MMM");
      const week = format(appointmentDate, "wo");
      const year = format(appointmentDate, "yyyy");
      result.uniqueDates.add(format(appointmentDate, "yyyy-MM-dd"));

      result.monthly[month] = result.monthly[month] || {
        completed: 0,
        scheduled: 0,
      };
      result.weekly[week] = result.weekly[week] || {
        completed: 0,
        scheduled: 0,
      };
      result.yearly[year] = result.yearly[year] || {
        completed: 0,
        scheduled: 0,
      };

      if (appointment.status === "Completed") {
        result.monthly[month].completed++;
        result.weekly[week].completed++;
        result.yearly[year].completed++;
      } else if (appointment.status === "Scheduled") {
        result.monthly[month].scheduled++;
        result.weekly[week].scheduled++;
        result.yearly[year].scheduled++;
      }
    });

    return result;
  }, [appointments]);

  const stats: Stat[] = [
    {
      title: "Total Patients",
      value: patients?.length?.toString() || "N/A",
      icon: <User size={24} color="white" />,
      color: "bg-green-500",
      LinkURL: "/dashboard/pages/Doctor/patientRecords",
    },
    {
      title: "Total Appointments",
      value: appointments?.length?.toString() || "N/A",
      icon: <Syringe size={24} color="white" />,
      color: "bg-blue-500",
      LinkURL: "/dashboard/pages/Doctor/appointments",
    },
    {
      title: "Pending LabWorks",
      value: `${pendingCount || 0}`,
      icon: <LucideFlaskConical size={24} color="white" />,
      color: "bg-orange-500",
      LinkURL: "/dashboard/pages/Doctor/labWork",
    },
    {
      title: "Upcoming Consultations",
      value: aggregatedAppointments.upcoming.toString(),
      icon: <AlertTriangle size={24} color="white" />,
      color: "bg-red-500",
      LinkURL: "/dashboard/pages/Doctor/appointments",
    },
  ];

  const barChartConfig = {
    completed: { label: "Completed", color: "#2563eb" },
    cancelled: { label: "Scheduled", color: "#60a5fa" },
  } satisfies ChartConfig;

  const appointmentStats = useMemo(
    () => ({
      monthly: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ].map((month) => ({
        month,
        completed: aggregatedAppointments.monthly[month]?.completed || 0,
        cancelled: aggregatedAppointments.monthly[month]?.scheduled || 0,
      })),
      weekly: Object.keys(aggregatedAppointments.weekly).map((week) => ({
        week,
        completed: aggregatedAppointments.weekly[week].completed,
        cancelled: aggregatedAppointments.weekly[week].scheduled,
      })),
      yearly: Object.keys(aggregatedAppointments.yearly).map((year) => ({
        year,
        completed: aggregatedAppointments.yearly[year].completed,
        cancelled: aggregatedAppointments.yearly[year].scheduled,
      })),
    }),
    [aggregatedAppointments]
  );

  const appointmentDatesDetailed = useMemo<AppointmentDateDetailed[]>(() => {
    if (!appointments?.length || !patients?.length) return [];

    const dateMap: Record<
      string,
      {
        count: number;
        appointments: {
          patientName: string;
          contactNumber?: string;
          timeSlot: string;
          treatments: string[];
          teeth: string[];
        }[];
      }
    > = {};

    appointments.forEach((appointment) => {
      const dateStr = format(
        new Date(appointment.appointmentDate),
        "yyyy-MM-dd"
      );
      const matchedPatient = patients.find(
        (p) => p._id === appointment.patient
      );
      const patientName = matchedPatient?.fullName || "Unknown";
      const contactNumber = matchedPatient?.contactNumber || "N/A";

      if (!dateMap[dateStr]) dateMap[dateStr] = { count: 0, appointments: [] };

      dateMap[dateStr].count++;
      dateMap[dateStr].appointments.push({
        patientName,
        contactNumber,
        timeSlot: appointment?.timeSlot || "09:00 AM",
        teeth: appointment?.teeth || [],
        treatments: appointment?.treatments || [],
      });
    });

    return Object.entries(dateMap).map(([date, { count, appointments }]) => ({
      date,
      count,
      appointments,
    }));
  }, [appointments, patients]);

  const pieData = useMemo(() => {
    if (!billings?.length) return { weekly: [], monthly: [], yearly: [] };

    type BillingWithDate = {
      date: string | Date;
      treatments?: BillingTreatment[];
    };

    const getTreatmentCounts = (
      filterFn: (billing: BillingWithDate) => boolean
    ) => {
      const counts = billings.filter(filterFn).reduce((acc, billing) => {
        billing.treatments?.forEach((treatment: BillingTreatment) => {
          acc[treatment.treatment] =
            (acc[treatment.treatment] || 0) + (treatment.quantity || 1);
        });
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    };

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    // Weekly = last 7 days
    const weeklyData = getTreatmentCounts((billing) => {
      const date = new Date(billing.date);
      return date >= sevenDaysAgo && date <= now;
    });

    // Monthly = current calendar month
    const monthlyData = getTreatmentCounts((billing) => {
      const date = new Date(billing.date);
      return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth()
      );
    });

    // Yearly = current calendar year
    const yearlyData = getTreatmentCounts((billing) => {
      const date = new Date(billing.date);
      return date.getFullYear() === now.getFullYear();
    });

    return {
      weekly: weeklyData,
      monthly: monthlyData,
      yearly: yearlyData,
    };
  }, [billings]);

  const registrationChartData = useMemo(() => {
    if (!patients?.length) return [];
    const monthlyData = patients.reduce((acc, patient) => {
      const month = format(new Date(patient.createdAt), "MMM");
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ].map((month) => ({ month, users: monthlyData[month] || 0 }));
  }, [patients]);

  if (isDataLoading) {
    return (
      <DashboardLayout>
        <Loading />
      </DashboardLayout>
    );
  }

  // Check session availability
  if (sessionStatus !== "authenticated" || !session) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[80vh] text-center">
          <AlertTriangle className="text-red-500 w-16 h-16 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Session Not Available</h2>
          <p className="text-gray-600 mb-4">
            Please sign in to access the dashboard
          </p>
          <Button onClick={() => signIn()}>Sign In</Button>
        </div>
      </DashboardLayout>
    );
  }

  // Check profile availability
  if (!profile) {
    return (
      <DashboardLayout>
        <Loading />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="px-1 space-y-3">
        {session && profile && (
          <div className="w-full flex justify-between items-end">
            <h1 className="text-base md:text-2xl font-semibold tracking-wide font-sans">
              {(() => {
                const hour = new Date().getHours();
                return `Good ${
                  hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening"
                }, 
                ${profile.fullName.split(" ")[0]}`;
              })()}
            </h1>
            <div className="flex pr-5 gap-x-5">
              <div className="hidden md:flex gap-x-3 items-end">
                <IconButtonWithTooltip
                  href="/dashboard/pages/Doctor/labWork"
                  tooltip="Add Lab Work"
                  icon={
                    <FlaskConical
                      size={18}
                      className="text-red-500 group-hover:text-white"
                    />
                  }
                  hoverBgColor="red"
                />
                <IconButtonWithTooltip
                  href="/dashboard/pages/Doctor/appointments/bookAppointment"
                  tooltip="Book Appointment"
                  icon={
                    <ClipboardPlus
                      size={18}
                      className="text-teal-600 group-hover:text-white"
                    />
                  }
                  hoverBgColor="teal"
                />
                <IconButtonWithTooltip
                  href="/dashboard/pages/Doctor/patientRecords/patientRegistrationForm"
                  tooltip="Add New Patient"
                  icon={
                    <UserRoundPlus
                      size={18}
                      className="text-green-600 group-hover:text-white"
                    />
                  }
                  hoverBgColor="green"
                />
              </div>
              <a
                href="https://g.co/kgs/1FNC4r5"
                target="_blank"
                rel="noreferrer"
              >
                <Image
                  src="/logo1.png"
                  alt="Clinic Logo"
                  width={50}
                  height={50}
                  className="rounded-full"
                />
              </a>
            </div>
          </div>
        )}

        <DashboardCards stats={stats} />

        <div className="w-full md:max-h-[400px] flex flex-col md:flex-row gap-y-4 md:gap-x-4">
          <DashboardCalendar
            title="Appointments"
            appointmentDetails={appointmentDatesDetailed}
          />
          <DashboardBarChart
            data={appointmentStats}
            config={barChartConfig}
            className="min-h-[200px] max-h-[355px] w-full"
            barRadius={8}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DashboardChart
            title="Patient Monthly Registration"
            data={registrationChartData}
          />
          <DashboardPieChart
            title="Treatments Taken"
            data={pieData}
            enableTimeFrameSort={true}
            innerRadius={2}
            showPercentage={false}
            showLegend={false}
          />
        </div>

        <div>
          <DataTable
            data={tableData
              .slice()
              .sort(
                (a, b) =>
                  new Date(b.registeredAt).getTime() -
                  new Date(a.registeredAt).getTime()
              )
              .map((item) => ({
                id: item.id,
                fullName: item.patient,
                contactNumber: item.contact,
                dob: item.dob,
                registeredAt: item.registeredAt,
              }))}
            title="Recent Patient Registrations"
            itemsPerPage={10}
            showSearch={true}
            searchFields={["fullName", "registeredAt"]}
            onRowClick={(patient) => {
              router.push(
                `/dashboard/pages/Doctor/patientRecords?patientId=${patient.id}`
              );
            }}
            columns={[
              { header: "Full Name", accessorKey: "fullName" },
              {
                header: "Contact",
                accessorKey: "contactNumber",
                render: (value) => value || "N/A",
              },
              {
                header: "Date of Birth",
                accessorKey: "dob",
                render: (value) => value || "N/A",
              },
              {
                header: "Registered At",
                accessorKey: "registeredAt",
                sortable: true,
                render: (value) => value || "N/A",
              },
              {
                header: "Actions",
                accessorKey: "id",
                render: (_, row) => (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(
                        `/dashboard/pages/Doctor/patientRecords?patientId=${row.id}`
                      );
                    }}
                  >
                    View
                  </Button>
                ),
              },
            ]}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
