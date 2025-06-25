import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export interface Stat {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  LinkURL?: string;
  onClickFunction?: () => void;
}

interface DashboardCardsProps {
  stats: Stat[];
}

export default function DashboardCards({ stats }: DashboardCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
      {stats.map((stat, index) => {
        let textSize = "text-3xl";
        if (stat.value.length > 5) textSize = "text-2xl";
        if (stat.value.length > 7) textSize = "text-lg";

        const words = stat.title.split(" ");
        const mobileTitle = words.length > 1 ? words[1] : stat.title;

        const isClickable = Boolean(stat.LinkURL || stat.onClickFunction);
        const cardClasses = `relative transition-all duration-200 ease-in-out border border-gray-100 rounded-xl overflow-hidden ${
          isClickable
            ? "hover:-translate-y-1 hover:shadow-lg cursor-pointer"
            : "cursor-default opacity-90"
        }`;

        const Content = (
          <Card className={cardClasses}>
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
                  <span className="p-1 pl-2 text-sm text-white font-semibold block md:hidden relative max-w-[100px] overflow-hidden whitespace-nowrap text-ellipsis group-hover:overflow-visible group-hover:whitespace-normal group-hover:bg-black group-hover:px-2 group-hover:rounded">
                    {mobileTitle}
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`font-bold text-gray-900 ${textSize}`}>
                {stat.value}
              </p>
              <div
                className={`h-1.5 w-8 mt-4 rounded-full ${stat.color.replace(
                  "text",
                  "bg"
                )}`}
              />
            </CardContent>
          </Card>
        );

        if (stat.LinkURL) {
          return (
            <Link href={stat.LinkURL} key={index}>
              {Content}
            </Link>
          );
        } else if (stat.onClickFunction) {
          return (
            <div
              key={index}
              onClick={stat.onClickFunction}
              className="w-full h-full" 
            >
              {Content}
            </div>
          );
        } else {
          return <div key={index}>{Content}</div>;
        }
      })}
    </div>
  );
}
