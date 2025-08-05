'use client';

import * as React from 'react';
import { format, getMonth, getYear, setMonth, setYear } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

interface DatePickerProfileProps {
  selectedDate?: Date;
  onDateChange?: (date: Date | undefined) => void;
  disabled?: boolean;
  error?: string;
  className?: string;
  startYear?: number;
  endYear?: number;
}

export function DatePickerProfile({
  selectedDate,
  onDateChange,
  disabled,
  error,
  className,
  startYear = getYear(new Date()) - 100,
  endYear = getYear(new Date()) + 100,
}: DatePickerProfileProps) {
  const [date, setDate] = React.useState<Date | undefined>(selectedDate);

  // Update date when selectedDate prop changes
  React.useEffect(() => {
    setDate(selectedDate);
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
    if (date) {
      const newDate = setMonth(date, months.indexOf(month));
      setDate(newDate);
    }
  };

  const handleYearChange = (year: string) => {
    if (date) {
      const newDate = setYear(date, parseInt(year));
      setDate(newDate);
    }
  };

  const handleSelect = (selectedData: Date | undefined) => {
    setDate(selectedData);
    if (onDateChange) {
      onDateChange(selectedData);
    }
  };

  return (
    <div className="w-full">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={'outline'}
            disabled={disabled}
            className={cn(
              'w-full justify-start text-left font-normal rounded-full border border-transparent focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 bg-slate-700/60 text-white placeholder-slate-400 shadow-[0_4px_4px_rgba(0,0,0,0.25)] py-2 px-3 hover:bg-slate-700/80 transition-all duration-200 disabled:opacity-70 h-auto text-sm',
              !date && 'text-slate-400',
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-purple-700 focus:border-purple-500',
              className
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? (
              <span className="text-white">{format(date, 'PPP')}</span>
            ) : (
              <span className="text-slate-400">Chọn ngày sinh</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-white border border-gray-200 shadow-lg rounded-lg">
          <div className="flex justify-between p-3 bg-gray-50 border-b border-gray-200 rounded-t">
            <Select
              onValueChange={handleMonthChange}
              value={date ? months[getMonth(date)] : months[getMonth(new Date())]}
            >
              <SelectTrigger className="w-[110px] bg-white border border-gray-300 rounded">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
                {months.map((month) => (
                  <SelectItem
                    key={month}
                    value={month}
                    className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              onValueChange={handleYearChange}
              value={date ? getYear(date).toString() : getYear(new Date()).toString()}
            >
              <SelectTrigger className="w-[110px] bg-white border border-gray-300 rounded">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
                {years.map((year) => (
                  <SelectItem
                    key={year}
                    value={year.toString()}
                    className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
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
