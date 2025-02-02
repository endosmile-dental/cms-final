import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const activities = [
  { user: "John Doe", action: "Created an appointment", time: "2 hrs ago" },
  { user: "Jane Smith", action: "Updated profile", time: "5 hrs ago" },
  { user: "Michael Lee", action: "Made a payment", time: "1 day ago" },
];

export default function DashboardTable() {
  return (
    <Card className="p-4">
      <CardHeader>
        <CardTitle>Recent Activities</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {activities.map((activity, index) => (
            <li key={index} className="flex justify-between border-b pb-2">
              <span>{activity.user}</span>
              <span>{activity.action}</span>
              <span className="text-gray-500">{activity.time}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
