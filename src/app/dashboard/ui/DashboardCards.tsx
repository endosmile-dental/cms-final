import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
// import { Users, Calendar, BarChart } from "lucide-react";

export interface Stat {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  LinkURL: string;
}

interface DashboardCardsProps {
  stats: Stat[];
}
export default function DashboardCards({ stats }: DashboardCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        // Split title into words
        const words = stat.title.split(" ");
        const mobileTitle = words.length > 1 ? words[1] : stat.title; // Show second word if available
        return (
          <Link href={stat.LinkURL || ""} key={index}>
            <Card className="relative transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-lg border border-gray-100 rounded-xl overflow-hidden">
              <div className="absolute inset-0" />
              <CardHeader className="pb-2">
                <CardTitle>
                  <div
                    className={`flex items-center gap-1 ${stat.color} rounded-lg`}
                  >
                    <span className="p-3 rounded-lg backdrop-blur-sm hidden md:block">
                      {stat.icon}
                    </span>
                    <span className="text-sm text-white font-semibold hidden md:block">
                      {stat.title}
                    </span>
                    {/* Truncated title on small screens with hover animation */}
                    <span className="p-1 text-sm text-white font-semibold block md:hidden relative max-w-[100px] overflow-hidden whitespace-nowrap text-ellipsis group-hover:overflow-visible group-hover:whitespace-normal group-hover:bg-black group-hover:px-2 group-hover:rounded">
                      {mobileTitle || stat.title}
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <div
                  className={`h-1.5 w-8 mt-4 rounded-full ${stat.color.replace(
                    "text",
                    "bg"
                  )}`}
                />
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
