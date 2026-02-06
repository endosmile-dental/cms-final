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

interface DataPoint {
  month: string;
  users: number;
}

interface DashboardChartProps {
  title?: string;
  data?: DataPoint[];
}

export default function DashboardChart({
  title = "User Growth",
  data = [
    { month: "Jan", users: 100 },
    { month: "Feb", users: 200 },
    { month: "Mar", users: 300 },
    { month: "Apr", users: 500 },
    { month: "May", users: 700 },
  ],
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
            <XAxis dataKey="month" tickFormatter={(value) => value.split(" ")[0]} // Feb
            />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="users" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
