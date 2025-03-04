import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar as CalendarUI } from "@/components/ui/calendar";

interface AppointmentSummary {
  date: Date;
  count: number;
  new: number;
  followUp: number;
}

interface DashboardCalendarProps {
  title?: string;
  appointmentSummary?: AppointmentSummary[];
}

export default function DashboardCalendar({
  title = "Appointments",
  appointmentSummary = [],
}: DashboardCalendarProps) {
  // Derive selected dates from appointmentSummary
  const selectedDates = appointmentSummary.map((item) => item.date);

  return (
    <Card className="p-4">
      <CardHeader className="flex justify-between">
        <CardTitle className="flex items-center gap-x-3 px-5">
          <CalendarIcon size={24} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CalendarUI
          mode="multiple"
          selected={selectedDates}
          summary={appointmentSummary}
        />
      </CardContent>
    </Card>
  );
}
