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
import { format } from "date-fns";

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
    contactNumber?: string;
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

  const selectedDates = appointmentDetails.map((item) => {
    // Parse the date string as local date to avoid timezone issues
    const [year, month, day] = item.date.split("-").map(Number);
    // Create date at start of day in local timezone to avoid timezone issues
    const date = new Date(year, month - 1, day);
    date.setHours(0, 0, 0, 0); // Ensure it's at start of day
    return date;
  });

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAppointments, setSelectedAppointments] = useState<
    AppointmentDateDetailed["appointments"]
  >([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const detail = dateToDetailsMap.get(dateStr);

    // helper: returns minutes since midnight or Infinity if unparsable
    const parseTimeToMinutes = (time?: string) => {
      if (!time) return Infinity;
      const m = time.trim().match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
      if (!m) return Infinity;
      let hour = parseInt(m[1], 10);
      const minute = parseInt(m[2], 10);
      const ampm = m[3].toUpperCase();
      if (ampm === "PM" && hour !== 12) hour += 12;
      if (ampm === "AM" && hour === 12) hour = 0;
      return hour * 60 + minute;
    };

    if (detail) {
      console.log("Clicked date with appointments:", detail.appointments);
      console.log("Detail:", detail.date);

      setSelectedDate(date);
      // use a copy to avoid mutating original array
      setSelectedAppointments(
        [...detail.appointments].sort(
          (a, b) =>
            parseTimeToMinutes(a.timeSlot) - parseTimeToMinutes(b.timeSlot)
        )
      );
      setIsDialogOpen(true);
    }
  };

  const CustomDay = ({ date }: { date: Date }) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const detail = dateToDetailsMap.get(dateStr);
    const isToday =
      format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
    const dayNum = date.getDate();

    const baseStyle =
      "w-9 h-9 flex items-center justify-center text-sm rounded cursor-pointer";

    // Case: Today with appointments
    if (detail && isToday) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`${baseStyle} bg-primary text-primary-foreground ring-2 ring-offset-2 ring-primary`}
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
    }

    // Case: Today without appointments
    if (!detail && isToday) {
      return (
        <div
          className={`${baseStyle} text-foreground bg-background ring-2 ring-offset-2 ring-primary`}
        >
          {dayNum}
        </div>
      );
    }

    // Case: Not today but has appointments
    if (detail) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`${baseStyle} bg-primary text-primary-foreground`}
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
    }

    // Default day (not today, no appointments)
    return (
      <div className="w-9 h-9 flex items-center justify-center text-sm text-foreground">
        {dayNum}
      </div>
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
            className="border border-border rounded-xl p-4 bg-background shadow-sm w-full max-w-full overflow-x-auto md:overflow-x-hidden"
            classNames={{
              months: "flex flex-col gap-6 justify-center items-center",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-foreground font-medium",
              nav: "flex gap-1 absolute top-1 right-1",
              nav_button: "h-8 w-64 bg-transparent p-0 rounded-md",
              nav_button_next: "absolute -left-5 -top-1",
              nav_button_previous: "absolute right-1 -top-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex gap-1",
              head_cell: "text-muted-foreground font-medium text-sm w-9",
              row: "flex w-full mt-1 gap-1",
              cell: "h-9 w-9 text-center text-sm p-0 relative",
              day: "h-9 w-9 p-0 font-normal rounded-md hover:bg-muted aria-selected:opacity-100",
              day_selected:
                "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90",
              day_today: "bg-primary/10 text-primary-foreground",
              day_outside: "text-muted-foreground opacity-50",
              day_disabled: "text-muted-foreground line-through",
            }}
            modifiersClassNames={{
              selected: "!bg-primary !text-primary-foreground",
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
