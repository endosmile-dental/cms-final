/**
 * FrequencyCard Component
 *
 * This component displays a visual representation of item frequencies (e.g., treatments, visits).
 * It supports two data formats:
 *
 * 1. Whole Data Mode: An array of data items with name/value pairs (`data: FrequencyDataItem[]`)
 *    - Sorting by time frame is **not available** in this mode.
 *
 * 2. Time-Based Mode: If the parent component manages weekly/monthly/yearly sorting,
 *    it can pass only the relevant subset (weekly | monthly | yearly) to this component.
 *
 * Props:
 * - title: Optional title for the card (default: "Frequency").
 * - data: Array of objects representing the items and their frequencies.
 * - total: The total count used to calculate percentage width of each bar.
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Type definition for each frequency data item
interface FrequencyDataItem {
  name: string;
  value: number;
}

interface FrequencyCardProps {
  title?: string;
  data: FrequencyDataItem[];
  total: number;
}

const FrequencyCard: React.FC<FrequencyCardProps> = ({
  title = "Frequency",
  data,
  total,
}) => {
  return (
    <Card className="p-4">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>

      {/* Scrollable content area for the frequency bars */}
      <CardContent className="max-h-[350px] overflow-y-auto">
        <div className="space-y-4 pr-2">
          {data.map((item) => {
            // Calculate percentage width for the frequency bar
            const percentage = total ? (item.value / total) * 100 : 0;

            return (
              <div key={item.name} className="flex items-center">
                {/* Item label */}
                <div className="w-32 text-sm font-medium">{item.name}</div>

                {/* Frequency bar */}
                <div className="flex-1">
                  <div
                    className="bg-primary h-6 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Numeric value */}
                <div className="w-10 text-right text-sm">{item.value}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default FrequencyCard;
