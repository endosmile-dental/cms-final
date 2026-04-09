"use client";

import React from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DateRangeFilterProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  label?: string;
  className?: string;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  label = "Date Range:",
  className,
}) => {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());

  const handleStartDateSelect = (date: Date | undefined) => {
    onStartDateChange(date);
    if (date) {
      setCurrentMonth(date);
    }
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    onEndDateChange(date);
    if (date) {
      setCurrentMonth(date);
    }
  };

  const handleClearDates = () => {
    onStartDateChange(undefined);
    onEndDateChange(undefined);
  };

  const formatDateDisplay = (date: Date | undefined) => {
    if (!date) return "";
    return format(date, "dd/MM/yyyy");
  };

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      {label && (
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
      )}

      {/* Start Date Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[150px] justify-start text-left font-normal",
              !startDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {startDate ? formatDateDisplay(startDate) : <span>Start date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={startDate}
            onSelect={handleStartDateSelect}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* End Date Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[150px] justify-start text-left font-normal",
              !endDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {endDate ? formatDateDisplay(endDate) : <span>End date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={endDate}
            onSelect={handleEndDateSelect}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* Clear Button */}
      {(startDate || endDate) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearDates}
          className="flex items-center gap-1"
        >
          <X className="h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
};

export default DateRangeFilter;