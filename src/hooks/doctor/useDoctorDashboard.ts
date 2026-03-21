import { DoctorDashboardDTO } from "@/app/types/dashboard/doctor/doctorDashboard";
import { useQuery } from "@tanstack/react-query";

export function useDoctorDashboard() {
  return useQuery<DoctorDashboardDTO>({
    queryKey: ["doctor-dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/doctor/dashboard", {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to load dashboard");
      }

      return res.json();
    },
    staleTime: 60 * 1000, // 1 min cache
  });
}
