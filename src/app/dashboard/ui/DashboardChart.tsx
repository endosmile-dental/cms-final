import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DashboardChartProps {
  title?: string;
  data: Array<Record<string, number | string>>;
  xKey: string; // dynamic x axis key
  lines: {
    dataKey: string;
    stroke?: string;
  }[];
}

export default function DashboardChart({
  title = "Chart",
  data,
  xKey,
  lines,
}: DashboardChartProps) {
  return (
    <Card className="p-2 flex flex-col justify-center items-start">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="w-full flex">
        <ResponsiveContainer width="100%" height={300} className="-ml-8 mt-4">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />

            {lines.map((line, index) => (
              <Line
                key={index}
                type="monotone"
                dataKey={line.dataKey}
                stroke={line.stroke || "#8884d8"}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
