"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar as CalendarIcon } from "lucide-react";
import { DayPicker } from "react-day-picker";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

import AppointmentDetailsModal from "@/app/components/doctor/AppointmentDetailsModal";

interface DashboardCalendarProps {
  title?: string;
  appointmentDetails?: AppointmentDateDetailed[];
}

export interface AppointmentDateDetailed {
  date: string; // Format: "yyyy-MM-dd"
  count: number;
  patients: string[];
}

export default function DashboardCalendar({
  title = "Appointments",
  appointmentDetails = [],
}: DashboardCalendarProps) {
  // Mapping appointment details to date
  const dateToDetailsMap = new Map(
    appointmentDetails.map((item) => [item.date, item])
  );

  const selectedDates = appointmentDetails.map((item) => new Date(item.date));

  // Local state to handle dialog and date selection
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAppointments, setSelectedAppointments] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDateClick = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    const detail = dateToDetailsMap.get(dateStr);

    if (detail) {
      setSelectedDate(date);
      setSelectedAppointments(
        detail.patients.map((name) => ({
          patientName: name,
          appointmentTime: new Date(), // Replace with actual time if available
          status: "Scheduled", // Replace with real status
        }))
      );
      setIsDialogOpen(true);
    }
  };

  return (
    <Card className="p-4">
      <CardHeader className="flex justify-between">
        <CardTitle className="flex items-center gap-x-3 px-5">
          <CalendarIcon size={24} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <DayPicker
            mode="multiple"
            selected={selectedDates}
            components={{
              Day: ({ date, ...props }) => {
                const dateStr = date.toISOString().split("T")[0];
                const detail = dateToDetailsMap.get(dateStr);
                const dayNum = date.getDate();

                if (!detail) {
                  return (
                    <div className="w-9 h-9 flex items-center justify-center text-sm">
                      {dayNum}
                    </div>
                  );
                }

                return (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="w-9 h-9 flex items-center justify-center text-white bg-primary rounded cursor-pointer"
                        onClick={() => handleDateClick(date)}
                      >
                        {dayNum}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-sm font-medium">
                        {detail.count} {detail.count === 1 ? "appointment" : "appointments"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              },
            }}
          />
        </TooltipProvider>
      </CardContent>

      {/* Modal to show appointment details on date click */}
      {selectedDate && isDialogOpen && (
        <AppointmentDetailsModal
          date={selectedDate}
          appointments={selectedAppointments}
          onClose={() => setIsDialogOpen(false)}
        />
      )}
    </Card>
  );
}
