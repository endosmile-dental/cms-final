"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export interface ColumnDefinition<T> {
  header: string;
  accessor: (row: T) => React.ReactNode;
}

interface ReusableTableProps<T> {
  title: string;
  data: T[];
  columns: ColumnDefinition<T>[];
  emptyMessage?: string;
}

export default function ReusableTable<T>({
  title,
  data,
  columns,
  emptyMessage = "No data available.",
}: ReusableTableProps<T>) {
  // Limit the number of rows to a maximum of 5
  const displayedData = data.slice(0, 5);

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="border-b border-border">
        <CardTitle className="text-lg font-semibold text-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          {displayedData.length > 0 ? (
            <table className="w-full">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  {columns.map((col, index) => (
                    <th 
                      key={index} 
                      className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider"
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {displayedData.map((row, rowIndex) => (
                  <tr 
                    key={rowIndex} 
                    className="hover:bg-muted/50 transition-colors duration-200"
                  >
                    {columns.map((col, colIndex) => (
                      <td 
                        key={colIndex} 
                        className="px-4 py-3 text-sm text-foreground"
                      >
                        {col.accessor(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <p className="text-sm">{emptyMessage}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
