'use client';

import * as React from 'react';
import { format, getMonth, getYear, setMonth, setYear } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

interface DatePickerProps {
  startYear?: number;
  endYear?: number;
  selectedDate?: Date;
  onDateChange?: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  error?: string;
  className?: string;
}

export function DatePicker({
  startYear = getYear(new Date()) - 100,
  endYear = getYear(new Date()) + 100,
  selectedDate,
  onDateChange,
  disabled,
  error,
  className,
}: DatePickerProps) {
  const [date, setDate] = React.useState<Date>(selectedDate || new Date());

  // Update date when selectedDate prop changes
  React.useEffect(() => {
    if (selectedDate) {
      setDate(selectedDate);
    }
  }, [selectedDate]);

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

  const handleMonthChange = (month: string) => {
    const newDate = setMonth(date, months.indexOf(month));
    setDate(newDate);
  };

  const handleYearChange = (year: string) => {
    const newDate = setYear(date, parseInt(year));
    setDate(newDate);
  };

  const handleSelect = (selectedData: Date | undefined) => {
    if (selectedData) {
      setDate(selectedData);
      // Call the callback if provided
      if (onDateChange) {
        onDateChange(selectedData);
      }
    }
  };

  return (
    <div className="w-full">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={'outline'}
            className={cn(
              'w-full justify-start text-left font-normal bg-white border hover:bg-gray-50 rounded text-black',
              !date && 'text-muted-foreground',
              error
                ? 'border-red-500 focus:border-red-500'
                : 'border-gray-300 focus:border-gray-300',
              className
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, 'PPP') : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-white border border-gray-200 shadow-lg rounded">
          <div className="flex justify-between p-3 bg-gray-50 border-b border-gray-200 rounded-t">
            <Select onValueChange={handleMonthChange} value={months[getMonth(date)]}>
              <SelectTrigger className="w-[110px] bg-white border border-gray-300 rounded">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={handleYearChange} value={getYear(date).toString()}>
              <SelectTrigger className="w-[110px] bg-white border border-gray-300 rounded">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="p-3 bg-white">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleSelect}
              initialFocus
              month={date}
              onMonthChange={setDate}
              className="rounded"
              disabled={disabled}
            />
          </div>
        </PopoverContent>
      </Popover>
      {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
    </div>
  );
}
