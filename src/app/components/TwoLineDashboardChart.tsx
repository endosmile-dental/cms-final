import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ChartData {
  date: string;
  appointments: number;
  treatments: number;
}

interface DashboardChartProps {
  data: ChartData[];
  timeFrame: "monthly" | "yearly";
  setTimeFrame: (frame: "monthly" | "yearly") => void;
}

export default function TwoLineDashboardChart({
  data,
  timeFrame,
  setTimeFrame,
}: DashboardChartProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          Appointments & Treatments
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeFrame("monthly")}
            className={`px-4 py-1 rounded text-sm ${
              timeFrame === "monthly"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setTimeFrame("yearly")}
            className={`px-4 py-1 rounded text-sm ${
              timeFrame === "yearly"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Yearly
          </button>
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
            />
            <YAxis
              label={{
                value: "Count",
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="appointments"
              stroke="#8884d8"
              strokeWidth={2}
              name="Appointments"
            />
            <Line
              type="monotone"
              dataKey="treatments"
              stroke="#82ca9d"
              strokeWidth={2}
              name="Treatments"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
