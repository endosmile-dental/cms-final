"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PieChartData {
  name: string;
  value: number;
}

interface DashboardPieChartProps {
  title?: string;
  data:
    | PieChartData[]
    | {
        weekly: PieChartData[];
        monthly: PieChartData[];
        yearly: PieChartData[];
      };
  enableTimeFrameSort?: boolean;
  innerRadius?: number;
  showPercentage?: boolean;
  showLegend?: boolean;
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82ca9d",
  "#FF6B6B",
  "#4ECDC4",
  "#FF9F1C",
  "#6A0572",
];

export default function DashboardPieChart({
  title = "Appointment Distribution",
  data,
  enableTimeFrameSort = false,
  innerRadius = 60,
  showPercentage = true,
  showLegend = true,
}: DashboardPieChartProps) {
  const [timeFrame, setTimeFrame] = useState<"weekly" | "monthly" | "yearly">(
    "monthly"
  );

  const isTimeFrameData =
    enableTimeFrameSort &&
    typeof data === "object" &&
    "weekly" in data &&
    "monthly" in data &&
    "yearly" in data;

  const chartData = isTimeFrameData
    ? (
        data as {
          weekly: PieChartData[];
          monthly: PieChartData[];
          yearly: PieChartData[];
        }
      )[timeFrame]
    : (data as PieChartData[]);

  return (
    <Card className="p-2 h-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{title}</CardTitle>

          {enableTimeFrameSort && (
            <Select
              onValueChange={(value: "weekly" | "monthly" | "yearly") =>
                setTimeFrame(value)
              }
              defaultValue="monthly"
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {chartData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  innerRadius={innerRadius}
                  label={
                    showPercentage
                      ? ({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                      : ({ name }) => name
                  }
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value}`, "Count"]}
                  labelFormatter={(name) => name}
                />
              </PieChart>
            </ResponsiveContainer>

            {showLegend && (
              <div className="flex flex-wrap justify-center mt-4 gap-3">
                {chartData.map((entry, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    {entry.name}: {entry.value}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="h-60 flex items-center justify-center text-muted-foreground">
            No data available for this time period
          </div>
        )}
      </CardContent>
    </Card>
  );
}
