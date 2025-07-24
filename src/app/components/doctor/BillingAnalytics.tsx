"use client";

import { useState, useMemo } from "react";
import { useAppSelector } from "@/app/redux/store/hooks";
import { selectBillings } from "@/app/redux/slices/billingSlice";
import { selectPatients } from "@/app/redux/slices/patientSlice";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  AreaChart,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  Line,
} from "recharts";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Helper functions for date calculations
const getStartOfPeriod = (date: Date, period: string) => {
  const d = new Date(date);
  if (period === "day") return new Date(d.setHours(0, 0, 0, 0));
  if (period === "week") {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }
  if (period === "month") return new Date(d.getFullYear(), d.getMonth(), 1);
  return d;
};

export default function BillingAnalytics() {
  const billings = useAppSelector(selectBillings);
  const patients = useAppSelector(selectPatients);
  const [timePeriod, setTimePeriod] = useState<"day" | "week" | "month">(
    "week"
  );
  const [searchQuery, setSearchQuery] = useState("");

  // 1. Deep Billing Trends Analysis
  const billingTrends = useMemo(() => {
    const periodData: Record<string, number> = {};
    const comparisonData: Record<string, number> = {};
    const periodLabels: string[] = [];

    // Current period data
    const periodCount =
      timePeriod === "day" ? 30 : timePeriod === "week" ? 12 : 12;

    for (let i = periodCount - 1; i >= 0; i--) {
      const date = new Date();
      let periodStart: Date;
      let label: string;

      if (timePeriod === "day") {
        date.setDate(date.getDate() - i);
        periodStart = getStartOfPeriod(date, "day");
        label = periodStart.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      } else if (timePeriod === "week") {
        date.setDate(date.getDate() - i * 7);
        periodStart = getStartOfPeriod(date, "week");
        const weekEnd = new Date(periodStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        label = `${periodStart.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })} - ${weekEnd.toLocaleDateString("en-US", { day: "numeric" })}`;
      } else {
        date.setMonth(date.getMonth() - i);
        periodStart = getStartOfPeriod(date, "month");
        label = periodStart.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
      }

      const periodKey = periodStart.toISOString();
      periodData[periodKey] = 0;
      periodLabels.push(label);

      // Previous period data for comparison
      if (i < periodCount / 2) {
        const compPeriodStart = new Date(periodStart);
        if (timePeriod === "day")
          compPeriodStart.setDate(compPeriodStart.getDate() - periodCount);
        if (timePeriod === "week")
          compPeriodStart.setDate(compPeriodStart.getDate() - periodCount * 7);
        if (timePeriod === "month")
          compPeriodStart.setMonth(compPeriodStart.getMonth() - periodCount);
        comparisonData[compPeriodStart.toISOString()] = 0;
      }
    }

    // Aggregate billing counts
    billings.forEach((billing) => {
      const billingDate = new Date(billing.date);
      const periodStart = getStartOfPeriod(billingDate, timePeriod);
      const periodKey = periodStart.toISOString();

      if (periodData[periodKey] !== undefined) {
        periodData[periodKey]++;
      }

      const compPeriodStart = new Date(periodStart);
      if (timePeriod === "day")
        compPeriodStart.setDate(compPeriodStart.getDate() - periodCount);
      if (timePeriod === "week")
        compPeriodStart.setDate(compPeriodStart.getDate() - periodCount * 7);
      if (timePeriod === "month")
        compPeriodStart.setMonth(compPeriodStart.getMonth() - periodCount);
      const compPeriodKey = compPeriodStart.toISOString();

      if (comparisonData[compPeriodKey] !== undefined) {
        comparisonData[compPeriodKey]++;
      }
    });

    // Format for chart
    return periodLabels.map((label, i) => {
      const periodKey = Object.keys(periodData)[i];
      const compPeriodKey = Object.keys(comparisonData)[i];

      return {
        name: label,
        current: periodData[periodKey] || 0,
        previous: comparisonData[compPeriodKey] || 0,
      };
    });
  }, [billings, timePeriod]);

  // 2. Deep Patient Billing Analysis
  const patientBillingAnalysis = useMemo(() => {
    const patientCounts: Record<string, number> = {};
    const patientData = [];

    // Safely calculate patient counts
    billings.forEach((billing) => {
      patientCounts[billing.patientId] =
        (patientCounts[billing.patientId] || 0) + 1;
    });

    // Create patient data with safe values
    for (const [patientId, count] of Object.entries(patientCounts)) {
      const patient = patients.find((p) => p.PatientId === patientId);
      const patientBillings = billings.filter((b) => b.patientId === patientId);

      // Sort billings safely
      patientBillings.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      patientData.push({
        patientId,
        name: patient ? patient.fullName : patientId,
        count,
        lastBillingDate: patientBillings[0]?.date || null,
      });
    }

    // Sort by count descending
    patientData.sort((a, b) => b.count - a.count);

    // Calculate billing frequency statistics safely
    const billingFrequencies = patientData.map((p) => p.count);
    const maxFrequency =
      billingFrequencies.length > 0 ? Math.max(...billingFrequencies) : 0;
    const minFrequency =
      billingFrequencies.length > 0 ? Math.min(...billingFrequencies) : 0;
    const avgFrequency =
      billingFrequencies.length > 0
        ? billingFrequencies.reduce((sum, val) => sum + val, 0) /
          billingFrequencies.length
        : 0;

    // Calculate frequency counts safely
    const highFrequencyPatients = patientData.filter(
      (p) => p.count > avgFrequency * 1.5
    ).length;
    const mediumFrequencyPatients = patientData.filter(
      (p) => p.count > avgFrequency * 1
    ).length;
    const lowFrequencyPatients = patientData.filter(
      (p) => p.count > avgFrequency * 0.5
    ).length;

    return {
      patientData,
      stats: {
        maxFrequency,
        minFrequency,
        avgFrequency: parseFloat(avgFrequency.toFixed(2)),
        patientCount: patientData.length,
        highFrequencyPatients,
        mediumFrequencyPatients,
        lowFrequencyPatients,
      },
    };
  }, [billings, patients]);

  // Filtered patient data based on search
  const filteredPatients = useMemo(() => {
    if (!searchQuery) return patientBillingAnalysis.patientData;

    const query = searchQuery.toLowerCase();
    return patientBillingAnalysis.patientData.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.patientId.toLowerCase().includes(query)
    );
  }, [patientBillingAnalysis.patientData, searchQuery]);

  // 3. Patient Billing Cohort Analysis
  const patientCohorts = useMemo(() => {
    const cohortData: Record<string, { count: number; patients: string[] }> =
      {};
    const totalPatients = patientBillingAnalysis.stats.patientCount;

    patientBillingAnalysis.patientData.forEach((patient) => {
      const cohort =
        patient.count >= 10
          ? "10+"
          : patient.count >= 5
          ? "5-9"
          : patient.count >= 3
          ? "3-4"
          : "1-2";

      if (!cohortData[cohort]) {
        cohortData[cohort] = { count: 0, patients: [] };
      }

      cohortData[cohort].count++;
      cohortData[cohort].patients.push(patient.name);
    });

    return Object.entries(cohortData)
      .map(([cohort, data]) => ({
        cohort,
        patients: data.count,
        percentage:
          totalPatients > 0
            ? ((data.count / totalPatients) * 100).toFixed(1)
            : "0.0",
      }))
      .sort((a, b) => parseInt(b.cohort) - parseInt(a.cohort));
  }, [patientBillingAnalysis]);

  // Calculate totals safely
  const currentTotal = billingTrends.reduce(
    (sum, item) => sum + item.current,
    0
  );
  const previousTotal = billingTrends.reduce(
    (sum, item) => sum + item.previous,
    0
  );

  // Calculate growth rate safely
  const growthRate =
    previousTotal > 0
      ? (currentTotal - previousTotal) / previousTotal
      : currentTotal > 0
      ? 1
      : 0;

  // Calculate peak billings safely
  const peakBillings =
    billingTrends.length > 0
      ? Math.max(...billingTrends.map((item) => item.current))
      : 0;

  return (
    <div className="w-full space-y-6">
      {/* Section 1: Billing Trends Over Time */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center py-2">
            <div>
              <CardTitle>Billing Volume Trends</CardTitle>
              <CardDescription>
                Historical patterns of billing activity
              </CardDescription>
            </div>
            <Tabs
              value={timePeriod}
              onValueChange={(v) =>
                setTimePeriod(v as "day" | "week" | "month")
              }
              className="w-[300px]"
            >
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="day">Daily</TabsTrigger>
                <TabsTrigger value="week">Weekly</TabsTrigger>
                <TabsTrigger value="month">Monthly</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={billingTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="current"
                  name="Current Period"
                  stroke="#0088FE"
                  fill="#0088FE"
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="previous"
                  name="Comparison Period"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  fillOpacity={0.3}
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <Card className="bg-blue-50">
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{currentTotal}</div>
                <div className="text-sm text-gray-600">
                  Total Billings (Current)
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-50">
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{previousTotal}</div>
                <div className="text-sm text-gray-600">
                  Total Billings (Comparison)
                </div>
              </CardContent>
            </Card>
            <Card className="bg-purple-50">
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{peakBillings}</div>
                <div className="text-sm text-gray-600">
                  Peak Billings (Current)
                </div>
              </CardContent>
            </Card>
            <Card className="bg-orange-50">
              <CardContent className="p-4">
                <div className="text-2xl font-bold">
                  {growthRate.toLocaleString(undefined, {
                    style: "percent",
                    minimumFractionDigits: 1,
                  })}
                </div>
                <div className="text-sm text-gray-600">Growth Rate</div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Patient Billing Analysis */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Patient Billing Patterns</CardTitle>
              <CardDescription>
                Patient billing frequency and distribution
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search
                className="absolute left-3 top-2.5 text-gray-400"
                size={18}
              />
              <Input
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Patient Cohort Analysis */}
            <div className="lg:col-span-1">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Patient Billing Cohorts</CardTitle>
                </CardHeader>
                <CardContent style={{ paddingLeft: 0 }}>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={patientCohorts}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="cohort" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="patients"
                          name="Patients"
                          fill="#8884d8"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4 pl-5">
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-xl font-bold">
                        {patientBillingAnalysis.stats.avgFrequency}
                      </div>
                      <div className="text-sm text-gray-600">
                        Avg Bills per Patient
                      </div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-xl font-bold">
                        {patientBillingAnalysis.stats.highFrequencyPatients}
                      </div>
                      <div className="text-sm text-gray-600">
                        High Frequency Patients
                      </div>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-xl font-bold">
                        {patientBillingAnalysis.stats.mediumFrequencyPatients}
                      </div>
                      <div className="text-sm text-gray-600">
                        Medium Frequency Patients
                      </div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-xl font-bold">
                        {patientBillingAnalysis.stats.lowFrequencyPatients}
                      </div>
                      <div className="text-sm text-gray-600">
                        Low Frequency Patients
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Patient Billing Table */}
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Patient Billing Frequency</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[480px] overflow-auto">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-white">
                        <tr className="border-b">
                          <th className="text-left p-3">Patient</th>
                          <th className="text-left p-3">ID</th>
                          <th className="text-right p-3">Bill Count</th>
                          <th className="text-right p-3">Last Billing</th>
                          <th className="text-right p-3">Frequency Tier</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPatients.map((patient, index) => {
                          const tier =
                            patient.count >= 10
                              ? "VIP"
                              : patient.count >= 5
                              ? "Frequent"
                              : patient.count >= 3
                              ? "Regular"
                              : "Occasional";

                          const tierColor =
                            tier === "VIP"
                              ? "bg-purple-100 text-purple-800"
                              : tier === "Frequent"
                              ? "bg-blue-100 text-blue-800"
                              : tier === "Regular"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800";

                          return (
                            <tr
                              key={index}
                              className="border-b hover:bg-gray-50"
                            >
                              <td className="p-3">{patient.name}</td>
                              <td className="p-3">{patient.patientId}</td>
                              <td className="p-3 text-right">
                                <span className="font-medium">
                                  {patient.count}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                {patient.lastBillingDate
                                  ? new Date(
                                      patient.lastBillingDate
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </td>
                              <td className="p-3 text-right">
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${tierColor}`}
                                >
                                  {tier}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 text-sm text-gray-600">
                    Showing {filteredPatients.length} of{" "}
                    {patientBillingAnalysis.patientData.length} patients
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Patient Billing Timeline */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Patient Billing Distribution Timeline</CardTitle>
          <CardDescription>
            How patient billing patterns evolve over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={billingTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="current"
                  name="Billing Volume"
                  fill="#8884d8"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey={(data) => {
                    const idx = billingTrends.findIndex(
                      (d) => d.name === data.name
                    );
                    return idx > 0
                      ? data.current - billingTrends[idx - 1].current
                      : 0;
                  }}
                  name="Volume Change"
                  stroke="#ff7300"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
