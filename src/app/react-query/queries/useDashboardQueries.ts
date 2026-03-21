"use client";

import { useQuery } from "@tanstack/react-query";
import type { ApiResponse } from "@/app/types/api";
import { unwrapApiResponse } from "@/app/utils/apiClient";
import type { BillingRecord } from "@/app/redux/slices/billingSlice";
import type { Appointment } from "@/app/redux/slices/appointmentSlice";
import type { Patient } from "@/app/redux/slices/patientSlice";
import type { ILabWork } from "@/app/redux/slices/labWorkSlice";
import type { Doctor } from "@/app/redux/slices/doctorSlice";
import type { ProfileData, DoctorProfile, PatientProfile } from "@/app/redux/slices/profileSlice";

type UserRole = "Doctor" | "Patient";

const FIVE_MIN = 5 * 60 * 1000;
const THIRTY_MIN = 30 * 60 * 1000;

async function getJson<T extends object>(url: string, headers: HeadersInit): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }

  const payload = (await response.json()) as ApiResponse<T>;
  return unwrapApiResponse(payload);
}

export function useBillingsQuery(userId: string | undefined, role: UserRole | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["dashboard", "billings", role, userId],
    enabled: enabled && !!userId && !!role,
    queryFn: async (): Promise<BillingRecord[]> => {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      const url = role === "Doctor" ? "/api/doctor/billing/getAll" : "/api/patient/billing/getBilling";

      if (role === "Doctor") headers["x-doctor-user-id"] = userId as string;
      if (role === "Patient") headers["x-patient-user-id"] = userId as string;

      const data = await getJson<{ billings: BillingRecord[] }>(url, headers);
      return Array.isArray(data.billings) ? data.billings : [];
    },
    staleTime: FIVE_MIN,
    gcTime: THIRTY_MIN,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function useAppointmentsQuery(userId: string | undefined, role: UserRole | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["dashboard", "appointments", role, userId],
    enabled: enabled && !!userId && !!role,
    queryFn: async (): Promise<Appointment[]> => {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      const url = role === "Doctor"
        ? "/api/doctor/appointments/fetchAppointments"
        : "/api/patient/appointments/fetchAppointments";

      if (role === "Doctor") headers["x-doctor-user-id"] = userId as string;
      if (role === "Patient") headers["x-patient-user-id"] = userId as string;

      const data = await getJson<{ appointments: Appointment[] }>(url, headers);
      return Array.isArray(data.appointments) ? data.appointments : [];
    },
    staleTime: FIVE_MIN,
    gcTime: THIRTY_MIN,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function useLabWorksQuery(userId: string | undefined, role: UserRole | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["dashboard", "labworks", role, userId],
    enabled: enabled && !!userId && !!role,
    queryFn: async (): Promise<ILabWork[]> => {
      const headers: HeadersInit = { "Content-Type": "application/json" };

      if (role === "Doctor") headers["x-doctor-user-id"] = userId as string;
      if (role === "Patient") headers["x-patient-user-id"] = userId as string;

      const data = await getJson<{ labWorks: ILabWork[] }>(
        "/api/doctor/labWork/fetchAll",
        headers,
      );
      return Array.isArray(data.labWorks) ? data.labWorks : [];
    },
    staleTime: FIVE_MIN,
    gcTime: THIRTY_MIN,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function useDoctorsQuery(userId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["dashboard", "doctors", userId],
    enabled: enabled && !!userId,
    queryFn: async (): Promise<Doctor[]> => {
      const data = await getJson<{ doctors: Doctor[] }>("/api/doctor/fetchDoctors", {
        "Content-Type": "application/json",
        "x-user-id": userId as string,
      });

      return Array.isArray(data.doctors) ? data.doctors : [];
    },
    staleTime: FIVE_MIN,
    gcTime: THIRTY_MIN,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function usePatientsQuery(userId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["dashboard", "patients", userId],
    enabled: enabled && !!userId,
    queryFn: async (): Promise<Patient[]> => {
      const data = await getJson<{ patients: Patient[] }>("/api/doctor/fetchPatients", {
        "Content-Type": "application/json",
        "x-doctor-user-id": userId as string,
      });

      return Array.isArray(data.patients) ? data.patients : [];
    },
    staleTime: FIVE_MIN,
    gcTime: THIRTY_MIN,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function useProfileQuery(userId: string | undefined, role: UserRole | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["dashboard", "profile", role, userId],
    enabled: enabled && !!userId && !!role,
    queryFn: async (): Promise<ProfileData> => {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      const endpoint = role === "Doctor" ? "/api/doctor/fetchProfile" : "/api/patient/fetchProfile";

      if (role === "Doctor") headers["x-doctor-user-id"] = userId as string;
      if (role === "Patient") headers["x-patient-user-id"] = userId as string;

      const data = await getJson<{ doctor?: DoctorProfile; patient?: PatientProfile }>(endpoint, headers);

      if (role === "Doctor") {
        return data.doctor ?? null;
      }

      return data.patient ?? null;
    },
    staleTime: FIVE_MIN,
    gcTime: THIRTY_MIN,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}
