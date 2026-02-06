// File: src/components/labWorkAnalytics.tsx
import {
  format,
  parseISO,
  getISOWeek,
  getISOWeekYear,
  differenceInCalendarDays,
  setISOWeek,
} from "date-fns";
import { useMemo } from "react";

// Define a type compatible with both Zod schema and your state data
export type LabWorkAnalyticsInput = {
  status?: string;
  orderType: string;
  labName: string;
  sentToLabOn?: Date | string | null;
  receivedFromLabOn?: Date | string | null;
};

type ProcessingTimeBin = "0-3" | "4-7" | "8-14" | "15-21" | "22-30" | "31+";

// Helper function to safely convert to Date
const toDate = (dateValue: unknown): Date | null => {
  if (!dateValue) return null;
  if (dateValue instanceof Date) return dateValue;
  if (typeof dateValue === "string") return parseISO(dateValue);
  return null;
};

const getStatusDate = (lab: LabWorkAnalyticsInput): Date | null => {
  switch (lab.status) {
    case "Pending":
    case "Cancelled":
      return toDate(lab.sentToLabOn);

    case "Received":
    case "Fitted":
      return toDate(lab.receivedFromLabOn);

    default:
      return toDate(lab.sentToLabOn);
  }
};

export const useLabWorkAnalytics = (labWorks: LabWorkAnalyticsInput[]) => {
  return useMemo(() => {
    if (!labWorks || labWorks.length === 0) {
      return {
        statusData: [],
        orderTypeData: [],
        deliveryTrends: [],
        statusOverTime: [],
        processingTimeAnalysis: [],
        labDistribution: [],
        statsSummary: {
          totalOrders: 0,
          avgProcessingTime: 0,
          medianProcessingTime: 0,
          onTimeRate: 0,
          forecastedVolume: 0,
          completionRate: 0,
        },
      };
    }

    // Core aggregations
    const statusCount: Record<string, number> = {};
    const orderTypeCount: Record<string, number> = {};
    const weeklyDeliveries: Record<string, number> = {};
    const statusOverTime: Record<string, Record<string, number>> = {};
    const labCount: Record<string, number> = {};
    const processingTimeBins: Record<ProcessingTimeBin, number> = {
      "0-3": 0,
      "4-7": 0,
      "8-14": 0,
      "15-21": 0,
      "22-30": 0,
      "31+": 0,
    };

    // Statistical values
    let totalProcessingTime = 0;
    let validDatesCount = 0;
    let completedCount = 0;
    const processingTimes: number[] = [];

    labWorks.forEach((lab) => {
      // Status count
      const status = lab.status || "Pending";
      statusCount[status] = (statusCount[status] || 0) + 1;
      if (["Fitted", "Received"].includes(status)) completedCount++;

      // Order type count
      const orderType = lab.orderType;
      orderTypeCount[orderType] = (orderTypeCount[orderType] || 0) + 1;

      // Lab distribution
      const labName = lab.labName || "Unspecified Lab";
      labCount[labName] = (labCount[labName] || 0) + 1;

      // Time-based aggregations
      try {
        const sentDate = toDate(lab.sentToLabOn);
        const receivedDate = toDate(lab.receivedFromLabOn);

        const statusDate = getStatusDate(lab);

        if (statusDate) {
          const monthKey = format(statusDate, "yyyy-MM");

          if (!statusOverTime[monthKey]) {
            statusOverTime[monthKey] = {};
          }

          statusOverTime[monthKey][status] =
            (statusOverTime[monthKey][status] || 0) + 1;
        }

        if (sentDate && receivedDate) {
          // Weekly completion trends
          const weekKey = `${getISOWeekYear(receivedDate)}-W${String(
            getISOWeek(receivedDate)
          ).padStart(2, "0")}`;
          weeklyDeliveries[weekKey] = (weeklyDeliveries[weekKey] || 0) + 1;

          // Status over time (monthly)
          const monthKey = format(receivedDate, "yyyy-MM");
          if (!statusOverTime[monthKey]) {
            statusOverTime[monthKey] = {};
          }
          statusOverTime[monthKey][status] =
            (statusOverTime[monthKey][status] || 0) + 1;

          // Processing time analysis (actual turnaround)
          const processingDays = differenceInCalendarDays(
            receivedDate,
            sentDate
          );
          processingTimes.push(processingDays);
          totalProcessingTime += processingDays;
          validDatesCount++;

          // Bin processing times
          if (processingDays <= 3) processingTimeBins["0-3"]++;
          else if (processingDays <= 7) processingTimeBins["4-7"]++;
          else if (processingDays <= 14) processingTimeBins["8-14"]++;
          else if (processingDays <= 21) processingTimeBins["15-21"]++;
          else if (processingDays <= 30) processingTimeBins["22-30"]++;
          else processingTimeBins["31+"]++;
        }
      } catch (err) {
        console.warn("Date processing error:", err);
      }
    });

    // Transformations for advanced visualizations
    // 1. Status distribution with completion rate
    const statusData = Object.entries(statusCount)
      .map(([name, value]) => ({
        id: name,
        label: name,
        value,
        percentage: Math.round((value / labWorks.length) * 100),
      }))
      .sort((a, b) => b.value - a.value);

    // 2. Order type distribution with profitability analysis
    const orderTypeData = Object.entries(orderTypeCount).map(
      ([name, count]) => {
        return {
          orderType: name,
          count,
          percentage: Math.round((count / labWorks.length) * 100),
          avgProcessingTime: calculateOrderTypeAvgTime(name, labWorks),
          profitability: calculateOrderTypeProfitability(name),
        };
      }
    );

    // 3. Delivery trends with forecasting
    const deliveryEntries = Object.entries(weeklyDeliveries)
      .map(([week, count]) => {
        const [year, weekNum] = week.split("-W");
        const date = parseISO(`${year}-01-01`);
        const weekStart = setISOWeek(date, parseInt(weekNum));
        return {
          week: weekStart,
          weekLabel: `W${weekNum}-${year.slice(2)}`,
          deliveries: count,
        };
      })
      .sort((a, b) => a.week.getTime() - b.week.getTime());

    // Add 4-week moving average and forecast
    const deliveryTrends = deliveryEntries.map((entry, index, array) => {
      const windowStart = Math.max(0, index - 3);
      const window = array.slice(windowStart, index + 1);
      const average =
        window.reduce((sum, item) => sum + item.deliveries, 0) / window.length;

      // Simple forecasting: 10% growth over previous period
      const forecast = index === array.length - 1 ? average * 1.1 : null;

      return {
        ...entry,
        movingAverage: parseFloat(average.toFixed(1)),
        forecast: forecast ? parseFloat(forecast.toFixed(1)) : null,
      };
    });

    // 4. Status over time (for stacked area charts)
    const statusOverTimeData = Object.entries(statusOverTime)
      .map(([month, statusCounts]) => {
        const total = Object.values(statusCounts).reduce(
          (sum, count) => sum + count,
          0
        );

        return {
          month: parseISO(`${month}-01`),
          monthLabel: format(parseISO(`${month}-01`), "MMM yy"),
          ...statusCounts,
          total,
        };
      })
      .sort((a, b) => a.month.getTime() - b.month.getTime());

    // 5. Lab distribution with performance metrics
    const labDistribution = Object.entries(labCount)
      .map(([labName, count]) => {
        return {
          labName,
          count,
          percentage: Math.round((count / labWorks.length) * 100),
          avgTurnaround: calculateLabTurnaround(labName, labWorks),
          qualityRating: calculateLabQualityRating(labName),
          reworkRate: calculateLabReworkRate(labName),
        };
      })
      .sort((a, b) => b.count - a.count);

    // 6. Processing time analysis (histogram with target line)
    const processingTimeAnalysis = (
      Object.entries(processingTimeBins) as [ProcessingTimeBin, number][]
    ).map(([bin, count]) => ({
      bin,
      count,
      percentage:
        validDatesCount > 0 ? Math.round((count / validDatesCount) * 100) : 0,
      target: bin === "4-7" ? 65 : 0, // Industry target for 4-7 day completion
    }));

    // Statistical summary
    const avgProcessingTime =
      validDatesCount > 0 ? totalProcessingTime / validDatesCount : 0;

    processingTimes.sort((a, b) => a - b);
    const medianIndex = Math.floor(processingTimes.length / 2);
    const medianProcessingTime =
      processingTimes.length > 0
        ? processingTimes.length % 2 === 0
          ? (processingTimes[medianIndex - 1] + processingTimes[medianIndex]) /
          2
          : processingTimes[medianIndex]
        : 0;

    // Calculate on-time rate (within 7 days)
    const onTimeRate =
      validDatesCount > 0
        ? parseFloat(
          (
            (processingTimes.filter((d) => d <= 7).length / validDatesCount) *
            100
          ).toFixed(1)
        )
        : 0;

    return {
      // Core distributions
      statusData,
      orderTypeData,
      labDistribution,

      // Time-based analytics
      deliveryTrends,
      statusOverTime: statusOverTimeData,

      // Performance metrics
      processingTimeAnalysis,

      // Statistical summary
      statsSummary: {
        totalOrders: labWorks.length,
        avgProcessingTime: parseFloat(avgProcessingTime.toFixed(1)),
        medianProcessingTime,
        onTimeRate,
        completionRate: parseFloat(
          ((completedCount / labWorks.length) * 100).toFixed(1)
        ),
        forecastedVolume:
          deliveryTrends.length > 0
            ? deliveryTrends[deliveryTrends.length - 1].forecast || 0
            : 0,
      },
    };
  }, [labWorks]);
};

// Advanced business logic helpers
function calculateOrderTypeAvgTime(
  orderType: string,
  labWorks: LabWorkAnalyticsInput[]
): number {
  const relevantLabs = labWorks.filter((lab) => lab.orderType === orderType);

  if (relevantLabs.length === 0) return 0;

  let totalDays = 0;
  let validCount = 0;

  relevantLabs.forEach((lab) => {
    const sentDate = toDate(lab.sentToLabOn);
    const receivedDate = toDate(lab.receivedFromLabOn);

    if (sentDate && receivedDate) {
      totalDays += differenceInCalendarDays(receivedDate, sentDate);
      validCount++;
    }
  });

  return validCount > 0 ? parseFloat((totalDays / validCount).toFixed(1)) : 0;
}

function calculateOrderTypeProfitability(orderType: string): number {
  // Profitability index based on industry benchmarks
  const profitabilityMap: Record<string, number> = {
    Crown: 78,
    Bridge: 82,
    Denture: 65,
    Aligner: 92,
    Implant: 85,
    "Inlay/Onlay": 75,
    Veneer: 88,
    Others: 60,
  };
  return profitabilityMap[orderType] || 70;
}

function calculateLabTurnaround(
  labName: string,
  labWorks: LabWorkAnalyticsInput[]
): number {
  const relevantLabs = labWorks.filter((lab) => lab.labName === labName);

  if (relevantLabs.length === 0) return 0;

  let totalDays = 0;
  let validCount = 0;

  relevantLabs.forEach((lab) => {
    const sentDate = toDate(lab.sentToLabOn);
    const receivedDate = toDate(lab.receivedFromLabOn);

    if (sentDate && receivedDate) {
      totalDays += differenceInCalendarDays(receivedDate, sentDate);
      validCount++;
    }
  });

  return validCount > 0 ? parseFloat((totalDays / validCount).toFixed(1)) : 0;
}

function calculateLabQualityRating(labName: string): number {
  // Quality rating based on historical performance
  const qualityMap: Record<string, number> = {
    "DentalWorks Inc.": 94,
    "Precision Dental Labs": 88,
    "Crown Specialists": 91,
    "OrthoLab Pro": 86,
  };
  return qualityMap[labName] || 85;
}

function calculateLabReworkRate(labName: string): number {
  // Rework rate estimation based on lab performance
  const reworkMap: Record<string, number> = {
    "DentalWorks Inc.": 3,
    "Precision Dental Labs": 7,
    "Crown Specialists": 4,
    "OrthoLab Pro": 9,
  };
  return reworkMap[labName] || 8;
}
