import { useAppSelector } from "@/app/redux/store/hooks";
import React, { useMemo } from "react";
import { useLabWorkAnalytics } from "./LabWorkAnalytics";
import {
  LineChart,
  BarChart,
  PieChart,
  AreaChart,
  RadarChart,
  Line,
  Bar,
  Pie,
  Area,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

// Define TypeScript interfaces for each analytics structure
interface KeyMetricProps {
  [key: string]: string | number;
}

interface DeliveryTrendItem {
  week: Date;
  weekLabel: string;
  deliveries: number;
  movingAverage: number;
  forecast: number;
}

interface LabDistributionItem {
  labName: string;
  count: number;
  percentage: number;
  avgTurnaround: number;
  qualityRating: number;
  reworkRate: number;
}

interface OrderTypeDataItem {
  orderType: string;
  count: number;
  percentage: number;
  avgProcessingTime: number;
  profitability: number;
}

interface ProcessingTimeItem {
  bin: string;
  count: number;
  percentage: number;
  target: number;
}

interface StatusDataItem {
  id: string;
  label: string;
  value: number;
  percentage: number;
}

// Fix for StatusOverTimeItem
interface StatusOverTimeItem {
  [key: string]: number | Date | string;
  month: Date;
  monthLabel: string;
  total: number;
}

interface AnalyticsData {
  deliveryTrends: DeliveryTrendItem[];
  labDistribution: LabDistributionItem[];
  orderTypeData: OrderTypeDataItem[];
  processingTimeAnalysis: ProcessingTimeItem[];
  statsSummary: KeyMetricProps;
  statusData: StatusDataItem[];
  statusOverTime: StatusOverTimeItem[];
}

// Custom Components with TypeScript props
const KeyMetrics = ({ data }: { data: KeyMetricProps }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
    {Object.entries(data).map(([key, value]) => (
      <div key={key} className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-semibold text-gray-500 capitalize">
          {key.replace(/([A-Z])/g, " $1").trim()}
        </h3>
        <p className="text-2xl font-bold mt-1">
          {typeof value === "number" ? value.toFixed(1) : value}
          {key === "completionRate" || key === "onTimeRate" ? "%" : ""}
        </p>
      </div>
    ))}
  </div>
);

const DeliveryTrendsChart = ({ data }: { data: DeliveryTrendItem[] }) => (
  <div className="bg-white p-4 rounded-lg shadow mb-6">
    <h2 className="text-lg font-bold mb-4">Delivery Trends Forecast</h2>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="weekLabel" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="deliveries"
          name="Actual Deliveries"
          stroke="#8884d8"
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="movingAverage"
          name="Moving Average"
          stroke="#82ca9d"
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="forecast"
          name="Forecast"
          stroke="#ff7300"
          strokeDasharray="5 5"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

const LabPerformanceCharts = ({ data }: { data: LabDistributionItem[] }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-bold mb-4">Lab Market Share</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="percentage"
            nameKey="labName"
            label={({ name, percent }: { name: string; percent: number }) =>
              `${name}: ${(percent * 100).toFixed(0)}%`
            }
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={["#0088FE", "#00C49F"][index % 2]}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>

    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-bold mb-4">Lab Performance Metrics</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="labName" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="qualityRating" name="Quality Rating" fill="#8884d8" />
          <Bar dataKey="reworkRate" name="Rework Rate" fill="#82ca9d" />
          <Bar
            dataKey="avgTurnaround"
            name="Avg Turnaround (days)"
            fill="#ffc658"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const OrderTypeAnalysis = ({ data }: { data: OrderTypeDataItem[] }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-bold mb-4">Order Volume & Profitability</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="orderType" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" name="Order Count" fill="#8884d8" />
          <Bar
            dataKey="profitability"
            name="Profitability (%)"
            fill="#82ca9d"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>

    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-bold mb-4">Order Type Comparison</h2>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="orderType" />
          <PolarRadiusAxis />
          <Radar
            name="Profitability"
            dataKey="profitability"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.6}
          />
          <Radar
            name="Processing Time"
            dataKey="avgProcessingTime"
            stroke="#82ca9d"
            fill="#82ca9d"
            fillOpacity={0.6}
          />
          <Tooltip />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const ProcessingTimeChart = ({ data }: { data: ProcessingTimeItem[] }) => (
  <div className="bg-white p-4 rounded-lg shadow mb-6">
    <h2 className="text-lg font-bold mb-4">Processing Time Distribution</h2>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="bin" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="percentage" name="Actual %" fill="#8884d8" />
        <Bar dataKey="target" name="Target %" fill="#82ca9d" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

const StatusDistributionChart = ({ data }: { data: StatusDataItem[] }) => {
  // Define color palette for different statuses
  const statusColors: Record<string, string> = {
    Fitted: "#00C49F",
    Pending: "#FFBB28",
    Received: "#0088FE",
    Cancelled: "#FF2C2C",
    Rework: "#FF8042",
    // Add more status-color mappings as needed
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <h2 className="text-lg font-bold mb-4">Order Status Distribution</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={true}
            outerRadius={100}
            fill="#8884d8"
            dataKey="percentage"
            nameKey="label"
            label={({ name, percent }) =>
              `${name}: ${(percent * 100).toFixed(0)}%`
            }
          >
            {data.map((entry) => (
              <Cell
                key={`cell-${entry.id}`}
                fill={statusColors[entry.id] || "#8884d8"} // Default color if status not found
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

const StatusOverTimeChart = ({ data }: { data: StatusOverTimeItem[] }) => (
  <div className="bg-white p-4 rounded-lg shadow">
    <h2 className="text-lg font-bold mb-4">Status Trends Over Time</h2>
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="monthLabel" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Area
          type="monotone"
          dataKey="Fitted"
          stackId="1"
          stroke="#00C49F"
          fill="#00C49F"
        />
        <Area
          type="monotone"
          dataKey="Pending"
          stackId="1"
          stroke="#FF8042"
          fill="#FF8042"
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

const LabDashboardAnalytics: React.FC = () => {
  const { data: labWorks } = useAppSelector((state) => state.labWork);

  const analyticsData = useMemo(() => {
    if (!labWorks) return [];

    return labWorks.map((lab) => ({
      status: lab.status,
      orderType: lab.orderType,
      labName: lab.labName,
      sentToLabOn: lab.sentToLabOn,
      receivedFromLabOn: lab.receivedFromLabOn,
    }));
  }, [labWorks]);

  const analytics = useLabWorkAnalytics(
    analyticsData
  ) as unknown as AnalyticsData;

  if (!analytics) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Lab Analytics</h1>
        <p>Loading analytics data...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Lab Analytics</h1>
      <p className="mb-6 text-gray-600">
        Comprehensive performance insights for lab operations
      </p>

      {/* Key Metrics */}
      <KeyMetrics data={analytics.statsSummary} />

      {/* Main Grid */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DeliveryTrendsChart data={analytics.deliveryTrends} />
          <StatusDistributionChart data={analytics.statusData} />
        </div>

        <LabPerformanceCharts data={analytics.labDistribution} />
        <OrderTypeAnalysis data={analytics.orderTypeData} />
        <ProcessingTimeChart data={analytics.processingTimeAnalysis} />
        <StatusOverTimeChart data={analytics.statusOverTime} />
      </div>
    </div>
  );
};

export default LabDashboardAnalytics;
