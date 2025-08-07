'use client';

import * as React from 'react';
import { format, getMonth, getYear, setMonth, setYear } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

interface DatePickerRegisterProps {
  startYear?: number;
  endYear?: number;
  selectedDate?: Date;
  onDateChange?: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  error?: string;
  className?: string;
}

export function DatePickerRegister({
  startYear = getYear(new Date()) - 100,
  endYear = getYear(new Date()) + 100,
  selectedDate,
  onDateChange,
  disabled,
  error,
  className,
}: DatePickerRegisterProps) {
  const [date, setDate] = React.useState<Date | undefined>(selectedDate);

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
    if (!date) return;
    const newDate = setMonth(date, months.indexOf(month));
    setDate(newDate);
  };

  const handleYearChange = (year: string) => {
    if (!date) return;
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
              'w-full justify-start text-left font-normal rounded-full border border-transparent focus:border-blue-400 focus:ring-2 focus:ring-blue-200 bg-white/5 text-[#A1A1AA] placeholder:text-white/50 shadow-[0_4px_4px_rgba(0,0,0,0.25)] py-2 px-3 hover:bg-white/10',
              !date && 'text-[#A1A1AA]',
              error
                ? 'border-red-500 focus:border-red-500'
                : 'border-transparent focus:border-blue-400',
              className
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? (
              <span className="text-white/50">{format(date, 'PPP')}</span>
            ) : (
              <span className="text-white/50">Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-white border border-gray-200 shadow-lg rounded">
          <div className="flex justify-between p-3 bg-gray-50 border-b border-gray-200 rounded-t">
            <Select onValueChange={handleMonthChange} value={date ? months[getMonth(date)] : ''}>
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
            <Select onValueChange={handleYearChange} value={date ? getYear(date).toString() : ''}>
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
              defaultMonth={new Date()}
            />
          </div>
        </PopoverContent>
      </Popover>
      {error && <div className="text-red-400 text-xs mt-1 ml-2">{error}</div>}
    </div>
  );
}
