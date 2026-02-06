"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DataPoint {
  [key: string]: number | string;
}

interface BarChartProps {
  data: {
    monthly: DataPoint[];
    weekly: DataPoint[];
    yearly: DataPoint[];
  };
  config: ChartConfig;
  xDataKey?: string;
  className?: string;
  barRadius?: number | [number, number, number, number];
}

export function DashboardBarChart({
  data,
  config,
  className,
  barRadius = 4,
}: BarChartProps) {
  const [timeFrame, setTimeFrame] = useState<"monthly" | "weekly" | "yearly">(
    "monthly"
  );

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-4 bg-transparent">
        <h2 className="text-lg font-semibold">Appointment Statistics</h2>
        <Select
          onValueChange={(value: "monthly" | "weekly" | "yearly") =>
            setTimeFrame(value)
          }
          defaultValue="monthly"
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ChartContainer config={config}>
        <BarChart accessibilityLayer data={data[timeFrame]}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey={
              timeFrame === "monthly"
                ? "month"
                : timeFrame === "weekly"
                  ? "week"
                  : "year"
            }
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value) => {
              if (timeFrame === "monthly") return value; // "Feb 2026"
              if (timeFrame === "weekly") return value;
              return value; // year
            }}

          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />

          {Object.keys(config).map((key, index) => (
            <Bar
              key={`${key}-${timeFrame}-${index}`}
              dataKey={key}
              fill={`var(--color-${key})`}
              radius={barRadius}
            />
          ))}
        </BarChart>
      </ChartContainer>
    </div>
  );
}
