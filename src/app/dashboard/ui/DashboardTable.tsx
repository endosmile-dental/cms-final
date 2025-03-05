"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export interface TableData {
  patient: string;
  contact: string;
  gender: "Male" | "Female" | "Other";
  registeredAt: string;
}

interface DashboardTableProps {
  data: TableData[];
}

export default function DashboardTable({ data }: DashboardTableProps) {
  return (
    <Card className="p-4">
      <CardHeader>
        <CardTitle>Recent Patient Registrations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          {data.length > 0 ? (
            <table className="w-full text-center">
              <thead>
                <tr>
                  <th className="py-2">Patient</th>
                  <th className="py-2">Contact</th>
                  <th className="py-2">Gender</th>
                  <th className="py-2">Registration</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{row.patient}</td>
                    <td className="py-2">{row.contact}</td>
                    <td className="py-2">{row.gender}</td>
                    <td className="py-2">{row.registeredAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No patient data available.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
