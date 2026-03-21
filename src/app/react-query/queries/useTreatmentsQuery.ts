"use client";

import { useQuery } from "@tanstack/react-query";
import type { ITreatment } from "@/app/redux/slices/treatmentSlice";

type TreatmentsApiResponse = {
  success: boolean;
  message?: string;
  error?: string;
  treatments?: ITreatment[];
};

export const TREATMENTS_QUERY_KEY = ["treatments", "active"] as const;

async function fetchTreatmentsFromApi(): Promise<ITreatment[]> {
  const response = await fetch("/api/admin/treatments", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch treatments (${response.status})`);
  }

  const payload = (await response.json()) as TreatmentsApiResponse;

  if (!payload.success) {
    throw new Error(payload.error || payload.message || "Failed to fetch treatments");
  }

  if (!Array.isArray(payload.treatments)) {
    return [];
  }

  return payload.treatments;
}

export function useTreatmentsQuery(enabled = true) {
  return useQuery({
    queryKey: TREATMENTS_QUERY_KEY,
    queryFn: fetchTreatmentsFromApi,
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}
