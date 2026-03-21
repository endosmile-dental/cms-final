import { useMemo } from "react";

// Type definitions for status types
type AppointmentStatus = "Scheduled" | "Completed" | "Cancelled";

interface AppointmentLike {
  appointmentDate: string;
  status: AppointmentStatus;
  treatments?: string[];
  timeSlot?: string;
  patient?: string;
}

interface BillingLike {
  date: string;
  treatments?: unknown[];
  totalAmount?: number;
  amountDue?: number;
  amountReceived?: number;
}

interface PatientLike {
  _id: string;
}

/**
 * Custom hook for memoizing expensive calculations with multiple dependencies
 * This helps optimize performance by preventing recalculation unless dependencies change
 */
export const useMemoizedCalculations = <T>(
  dependencies: unknown[],
  calculate: () => T,
  debugName?: string
): T => {
  return useMemo(() => {
    void dependencies;
    if (debugName) {
      console.log(`🔄 Recalculating ${debugName}`);
    }
    return calculate();
  }, [calculate, debugName, dependencies]);
};

/**
 * Hook for memoizing chart data calculations
 */
export const useChartCalculations = (
  appointments: AppointmentLike[],
  billings: BillingLike[],
  patients: PatientLike[],
  timeFrame: "monthly" | "yearly" = "monthly"
) => {
  return useMemoizedCalculations(
    [appointments, billings, patients, timeFrame],
    () => {
      // Expensive chart data processing
      const processChartData = (
        patientAppointments: AppointmentLike[],
        patientBillings: BillingLike[],
        timeFrame: "monthly" | "yearly"
      ) => {
        const formatDate = (dateString: string) => {
          const date = new Date(dateString);
          return timeFrame === "yearly"
            ? `${date.getFullYear()}`
            : `${date.getFullYear()}-${(date.getMonth() + 1)
              .toString()
              .padStart(2, "0")}`;
        };

        // Process appointments
        const appointmentCounts = patientAppointments.reduce<
          Record<string, number>
        >((acc, appointment) => {
          const month = formatDate(appointment.appointmentDate);
          acc[month] = (acc[month] || 0) + 1;
          return acc;
        }, {});

        // Process treatments from billings
        const treatmentCounts = patientBillings.reduce<Record<string, number>>(
          (acc, billing) => {
            const month = formatDate(billing.date);
            const treatmentsCount = billing.treatments?.length || 0;
            acc[month] = (acc[month] || 0) + treatmentsCount;
            return acc;
          },
          {}
        );

        // Combine data
        const allMonths = Array.from(
          new Set([
            ...Object.keys(appointmentCounts),
            ...Object.keys(treatmentCounts),
          ])
        ).sort();

        return allMonths.map((month) => ({
          date: month,
          appointments: appointmentCounts[month] || 0,
          treatments: treatmentCounts[month] || 0,
        })) as Record<string, string | number>[];
      };

      // Appointment statistics for charts
      const appointmentStats = (() => {
        const statusCounts = {
          Scheduled: 0,
          Completed: 0,
          Cancelled: 0,
        };

        const now = new Date();
        const weeklyCounts = { Scheduled: 0, Completed: 0, Cancelled: 0 };
        const monthlyCounts = { Scheduled: 0, Completed: 0, Cancelled: 0 };
        const yearlyCounts = { Scheduled: 0, Completed: 0, Cancelled: 0 };

        const treatmentCounts: Record<string, number> = {};
        const timeSlotCounts: Record<string, number> = {};

        // Process appointment data for charts
        appointments.forEach((appointment) => {
          const appDate = new Date(appointment.appointmentDate);
          const status = appointment.status as AppointmentStatus;

          // Update overall status counts
          statusCounts[status] = (statusCounts[status] || 0) + 1;

          // Update time-based status counts
          // Weekly (last 7 days)
          if (appDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)) {
            weeklyCounts[status]++;
          }

          // Monthly (last 30 days)
          if (appDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)) {
            monthlyCounts[status]++;
          }

          // Yearly (current year)
          if (appDate.getFullYear() === now.getFullYear()) {
            yearlyCounts[status]++;
          }

          // Count treatments
          appointment.treatments?.forEach((treatment: string) => {
            treatmentCounts[treatment] = (treatmentCounts[treatment] || 0) + 1;
          });

          // Count time slots
          if (appointment.timeSlot) {
            timeSlotCounts[appointment.timeSlot] =
              (timeSlotCounts[appointment.timeSlot] || 0) + 1;
          }
        });

        // Format data for pie chart (status distribution)
        const statusData = Object.entries(statusCounts).map(([name, value]) => ({
          name,
          value,
        })) as Record<string, string | number>[];

        // Format time-based status data
        const statusByTime = {
          weekly: Object.entries(weeklyCounts).map(([name, value]) => ({
            name,
            value,
          })) as Record<string, string | number>[],
          monthly: Object.entries(monthlyCounts).map(([name, value]) => ({
            name,
            value,
          })) as Record<string, string | number>[],
          yearly: Object.entries(yearlyCounts).map(([name, value]) => ({
            name,
            value,
          })) as Record<string, string | number>[],
        };

        // Format data for bar chart (treatment popularity)
        const treatmentData = Object.entries(treatmentCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([name, value]) => ({
            name,
            value,
          })) as Record<string, string | number>[];

        // Format data for time slot heatmap
        const timeSlotData = Object.entries(timeSlotCounts)
          .map(([name, value]) => ({
            time: name,
            appointments: value,
          }))
          .sort((a, b) => {
            // Sort by time slot order
            const timeSlots = [
              "9:00 AM - 9:30 AM",
              "9:30 AM - 10:00 AM",
              "10:00 AM - 10:30 AM",
              "10:30 AM - 11:00 AM",
              "11:00 AM - 11:30 AM",
              "11:30 AM - 12:00 PM",
              "12:00 PM - 12:30 PM",
              "12:30 PM - 1:00 PM",
              "1:00 PM - 1:30 PM",
              "1:30 PM - 2:00 PM",
              "2:00 PM - 2:30 PM",
              "2:30 PM - 3:00 PM",
              "3:00 PM - 3:30 PM",
              "3:30 PM - 4:00 PM",
              "4:00 PM - 4:30 PM",
              "4:30 PM - 5:00 PM",
              "5:00 PM - 5:30 PM",
              "5:30 PM - 6:00 PM",
            ];
            return timeSlots.indexOf(a.time) - timeSlots.indexOf(b.time);
          }) as Record<string, string | number>[];

        return {
          statusData,
          statusByTime,
          treatmentData,
          timeSlotData,
        };
      })();

      // Patient statistics
      const patientStats = (() => {
        const totalPatients = patients.length;
        const activePatients = patients.filter(p => 
          appointments.some(a => a.patient === p._id)
        ).length;
        const newPatients = patients.filter(p => 
          !appointments.some(a => a.patient === p._id)
        ).length;

        return {
          totalPatients,
          activePatients,
          newPatients,
        };
      })();

      // Revenue statistics
      const revenueStats = (() => {
        const totalRevenue = billings.reduce((sum, billing) => 
          sum + (billing.totalAmount || 0), 0
        );
        const pendingRevenue = billings.reduce((sum, billing) => 
          sum + (billing.amountDue || 0), 0
        );
        const receivedRevenue = billings.reduce((sum, billing) => 
          sum + (billing.amountReceived || 0), 0
        );

        return {
          totalRevenue,
          pendingRevenue,
          receivedRevenue,
        };
      })();

      return {
        chartData: processChartData(appointments, billings, timeFrame),
        appointmentStats,
        patientStats,
        revenueStats,
      };
    },
    "Chart Calculations"
  );
};

/**
 * Hook for memoizing filtered data calculations
 */
export const useFilteredData = <T extends object>(
  data: T[],
  filters: Partial<Record<keyof T, unknown>>,
  searchQuery: string,
  transformFn?: (item: T) => T
) => {
  return useMemoizedCalculations(
    [data, filters, searchQuery],
    () => {
      let filtered = data;

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          filtered = filtered.filter(item => {
            const itemValue = (item as T)[key as keyof T];
            return itemValue === value;
          });
        }
      });

      // Apply search
      if (searchQuery) {
        filtered = filtered.filter(item => {
          const searchStr = JSON.stringify(item).toLowerCase();
          return searchStr.includes(searchQuery.toLowerCase());
        });
      }

      // Apply transformation if provided
      if (transformFn) {
        filtered = filtered.map(transformFn);
      }

      return filtered;
    },
    "Filtered Data"
  );
};

/**
 * Hook for memoizing expensive sorting operations
 */
export const useSortedData = <T extends object>(
  data: T[],
  sortBy: keyof T & string,
  sortOrder: 'asc' | 'desc' = 'asc'
) => {
  return useMemoizedCalculations(
    [data, sortBy, sortOrder],
    () => {
      return [...data].sort((a, b) => {
        const aValue = (a as T)[sortBy as keyof T];
        const bValue = (b as T)[sortBy as keyof T];
        
        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    },
    "Sorted Data"
  );
};