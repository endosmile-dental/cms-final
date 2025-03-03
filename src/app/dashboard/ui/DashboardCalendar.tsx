import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { Calendar as CalendarUI } from "@/components/ui/calendar";

interface DashboardCalendarProps {
  title?: string;
  selectedDates?: Date[];
}

export default function DashboardCalendar({
  title = "Appointments",
  selectedDates = [],
}: DashboardCalendarProps) {
  return (
    <Card className="p-4">
      <CardHeader className="flex justify-between">
        <CardTitle className="flex items-center gap-x-3 px-5">
          <Calendar size={24} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Set mode to "multiple" so that multiple dates can be selected */}
        <CalendarUI mode="multiple" selected={selectedDates} />
      </CardContent>
    </Card>
  );
}
