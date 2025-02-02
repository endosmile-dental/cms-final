import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, BarChart } from "lucide-react";

const stats = [
  {
    title: "Total Users",
    value: "1,245",
    icon: <Users size={24} />,
    color: "bg-blue-500",
  },
  {
    title: "Appointments",
    value: "345",
    icon: <Calendar size={24} />,
    color: "bg-green-500",
  },
  {
    title: "Revenue",
    value: "$12,340",
    icon: <BarChart size={24} />,
    color: "bg-yellow-500",
  },
];

export default function DashboardCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="p-4">
          <CardHeader className="">
            <CardTitle>
              <div
                className={`p-2 sm:p-3 rounded-full ${stat.color} text-white flex items-center gap-x-3 sm:gap-x-5 text-sm sm:text-base`}
              >
                {stat.icon}
                <span className="truncate">{stat.title}</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
