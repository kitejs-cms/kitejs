import * as React from "react";
import { differenceInCalendarDays, format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import {
  Button,
  Calendar,
  Popover,
  PopoverContent,
  PopoverTrigger,
  cn,
} from "@kitejs-cms/dashboard-core";
import { useTranslation } from "react-i18next";

type DatePickerProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: DateRange;
  defaultValue?: DateRange;
  onValueChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
};

export function DatePicker({
  className,
  value,
  defaultValue,
  onValueChange,
  placeholder = "Pick a date",
  ...divProps
}: DatePickerProps) {
  const { t } = useTranslation("analytics");

  const handleSelect = (next: DateRange | undefined) => {
    onValueChange?.(next);
  };

  return (
    <div className={cn("flex items-center gap-2", className)} {...divProps}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, "LLL dd, y")} -{" "}
                  {format(value.to, "LLL dd, y")}
                </>
              ) : (
                format(value.from, "LLL dd, y")
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            autoFocus
            mode="range"
            defaultMonth={value?.from}
            selected={value ?? defaultValue}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
      {value.from && value.to && (
        <span className="text-sm text-muted-foreground">
          {t("technologies.selectedRange", {
            days: differenceInCalendarDays(value.to, value.from) + 1,
          })}
        </span>
      )}
    </div>
  );
}
