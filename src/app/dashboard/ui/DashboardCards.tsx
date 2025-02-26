import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Users, Calendar, BarChart } from "lucide-react";

export interface Stat {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

interface DashboardCardsProps {
  stats: Stat[];
}
export default function DashboardCards({ stats }: DashboardCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      {stats.map((stat, index) => (
        <Card key={index} className="">
          <CardHeader className="">
            <CardTitle>
              <div
                className={`p-2 rounded-full ${stat.color} text-white flex items-center gap-x-1 md:gap-x-2 text-sm md:text-base`}
              >
                {stat.icon}
                <span className="truncate">{stat.title}</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
