"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  summary?: {
    date: Date;
    count?: number;
    new?: number;
    followUp?: number;
  }[];
};

function Calendar({
  summary = [],
  className = "",
  classNames = {},
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  // Build a lookup dictionary for summary by date key using ISO slice.
  const summaryByDate = React.useMemo(() => {
    const dict: Record<
      string,
      { count: number; new: number; followUp: number }
    > = {};
    summary.forEach((item) => {
      const key = item.date.toISOString().slice(0, 10);
      dict[key] = {
        count: item.count ?? 0,
        new: item.new ?? 0,
        followUp: item.followUp ?? 0,
      };
    });

    return dict;
  }, [summary]);

  return (
    <DayPicker
      defaultMonth={new Date("2025-03-01")} // For testing: display March 2025.
      {...(props as any)}
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_start: "day-range-start",
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("h-4 w-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("h-4 w-4", className)} {...props} />
        ),
      }}
      renderDay={(day: Date) => {
        const dateKey = day.toISOString().slice(0, 10);
        const item = summaryByDate[dateKey];
        // Debug: Uncomment the line below to check which day is rendered.
        console.log("renderDay called for:", dateKey, "Summary:", item);
        return (
          <div className="relative group h-full w-full">
            <div className="flex h-full w-full items-center justify-center">
              {day.getDate()}
            </div>
            {item && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 text-white text-xs p-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div>{item.count} appointments</div>
                <div>New: {item.new}</div>
                <div>Follow-up: {item.followUp}</div>
              </div>
            )}
          </div>
        );
      }}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
