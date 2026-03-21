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
    <div className="bg-card border-border p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          Appointments & Treatments
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeFrame("monthly")}
            className={`px-4 py-1 rounded text-sm ${
              timeFrame === "monthly"
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setTimeFrame("yearly")}
            className={`px-4 py-1 rounded text-sm ${
              timeFrame === "yearly"
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            Yearly
          </button>
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              stroke="hsl(var(--foreground))"
            />
            <YAxis
              label={{
                value: "Count",
                angle: -90,
                position: "insideLeft",
              }}
              stroke="hsl(var(--foreground))"
            />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="appointments"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              name="Appointments"
            />
            <Line
              type="monotone"
              dataKey="treatments"
              stroke="hsl(var(--secondary))"
              strokeWidth={2}
              name="Treatments"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
