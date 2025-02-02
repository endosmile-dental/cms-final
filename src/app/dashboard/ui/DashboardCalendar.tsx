import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { Calendar as CalendarUI } from "@/components/ui/calendar";

export default function DashboardCalendar() {
  return (
    <Card className="p-4">
      <CardHeader className="flex justify-between">
        <CardTitle>Appointments</CardTitle>
        <Calendar size={24} />
      </CardHeader>
      <CardContent>
        <CalendarUI />
      </CardContent>
    </Card>
  );
}
