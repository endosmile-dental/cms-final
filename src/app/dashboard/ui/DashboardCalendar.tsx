import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar as CalendarUI } from "@/components/ui/calendar";

interface DashboardCalendarProps {
  title?: string;
  appointmentDates?: string[]; // Accepts only dates as strings
}

export default function DashboardCalendar({
  title = "Appointments",
  appointmentDates = [],
}: DashboardCalendarProps) {
  // Convert string dates to Date objects
  const selectedDates = appointmentDates.map((date) => new Date(date));

  return (
    <Card className="p-4">
      <CardHeader className="flex justify-between">
        <CardTitle className="flex items-center gap-x-3 px-5">
          <CalendarIcon size={24} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CalendarUI mode="multiple" selected={selectedDates} />
      </CardContent>
    </Card>
  );
}
