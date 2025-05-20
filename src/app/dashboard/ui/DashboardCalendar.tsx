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
import { format, parse } from "date-fns";

import AppointmentDetailsModal from "@/app/components/doctor/AppointmentDetailsModal";

interface DashboardCalendarProps {
  title?: string;
  appointmentDetails?: AppointmentDateDetailed[];
}

export interface AppointmentDateDetailed {
  date: string; // "yyyy-MM-dd"
  count: number;
  appointments: {
    patientName: string;
    timeSlot: string;
    treatments: string[];
    teeth: string[];
  }[];
}

export default function DashboardCalendar({
  title = "Appointments",
  appointmentDetails = [],
}: DashboardCalendarProps) {
  const dateToDetailsMap = new Map(
    appointmentDetails.map((item) => [item.date, item])
  );

  const selectedDates = appointmentDetails.map((item) =>
    parse(item.date, "yyyy-MM-dd", new Date())
  );

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAppointments, setSelectedAppointments] = useState<
    AppointmentDateDetailed["appointments"]
  >([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const detail = dateToDetailsMap.get(dateStr);

    if (detail) {
      setSelectedDate(date);
      setSelectedAppointments(detail.appointments);
      setIsDialogOpen(true);
    }
  };

  const CustomDay = ({ date }: { date: Date }) => {
    const dateStr = format(date, "yyyy-MM-dd");
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
        <TooltipContent side="top" className="text-xs">
          <div>
            <strong>
              {detail.count}{" "}
              {detail.count === 1 ? "appointment" : "appointments"}
            </strong>
          </div>
        </TooltipContent>
      </Tooltip>
    );
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
              Day: CustomDay,
            }}
            className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm w-full max-w-full overflow-x-auto md:overflow-x-hidden"
            classNames={{
              months: "flex flex-col gap-6 justify-center items-center",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-gray-900 font-medium",
              nav: "flex gap-1 absolute top-1 right-1",
              nav_button:
                "h-8 w-40 md:w-64 bg-transparent p-0 rounded-md",
              nav_button_next: "absolute -left-5 -top-1",
              nav_button_previous: "absolute right-1 -top-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex gap-1",
              head_cell: "text-gray-500 font-medium text-sm w-9",
              row: "flex w-full mt-1 gap-1",
              cell: "h-9 w-9 text-center text-sm p-0 relative",
              day: "h-9 w-9 p-0 font-normal rounded-md hover:bg-gray-100 aria-selected:opacity-100",
              day_selected:
                "bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700",
              day_today: "bg-blue-100 text-blue-900",
              day_outside: "text-gray-400 opacity-50",
              day_disabled: "text-gray-400 line-through",
            }}
            modifiersClassNames={{
              selected: "!bg-blue-600 !text-white",
              today: "font-semibold",
            }}
          />
        </TooltipProvider>
      </CardContent>

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
