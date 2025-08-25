'use client';

import * as React from 'react';
import { format, getMonth, getYear, setMonth, setYear } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { useThemeClasses } from '@/hooks/useThemeClasses';

interface DatePickerProfileProps {
  selectedDate?: Date;
  onDateChange?: (date: Date | undefined) => void;
  onMonthChange?: (month: string) => void;
  onYearChange?: (year: string) => void;
  disabled?: boolean;
  error?: string;
  className?: string;
  startYear?: number;
  endYear?: number;
}

export function DatePickerProfile({
  selectedDate,
  onDateChange,
  onMonthChange,
  onYearChange,
  disabled,
  error,
  className,
  startYear = getYear(new Date()) - 100,
  endYear = getYear(new Date()) + 100,
}: DatePickerProfileProps) {
  const [date, setDate] = React.useState<Date | undefined>(selectedDate);
  const { getThemeClass } = useThemeClasses();

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
      if (onDateChange) {
        onDateChange(newDate);
      }
      if (onMonthChange) {
        onMonthChange(month);
      }
    }
  };

  const handleYearChange = (year: string) => {
    if (date) {
      const newDate = setYear(date, parseInt(year));
      setDate(newDate);
      if (onDateChange) {
        onDateChange(newDate);
      }
      if (onYearChange) {
        onYearChange(year);
      }
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
              'w-full justify-start text-left font-normal rounded-full border transition-all duration-200 py-2 px-3 h-auto text-sm shadow-[0_4px_4px_rgba(0,0,0,0.25)] hover:transition-all disabled:opacity-70',
              !date && getThemeClass('text-gray-500', 'text-slate-400'),
              error
                ? getThemeClass(
                    'border-red-500 bg-red-50 text-red-700 focus:ring-red-500/20',
                    'border-red-500 bg-red-900/20 text-red-300 focus:ring-red-500/20'
                  )
                : getThemeClass(
                    'border-blue-300 bg-blue-50/75 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-blue-50',
                    'border-purple-700 bg-slate-700/60 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:bg-slate-700/80'
                  ),
              className
            )}
          >
            <CalendarIcon
              className={cn('mr-2 h-4 w-4', getThemeClass('text-gray-600', 'text-slate-400'))}
            />
            {date ? (
              <span className={getThemeClass('text-gray-900', 'text-white')}>
                {format(date, 'PPP')}
              </span>
            ) : (
              <span className={getThemeClass('text-gray-500', 'text-slate-400')}>
                Chọn ngày sinh
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            'w-auto p-0 border shadow-lg rounded-lg',
            getThemeClass('bg-white border-gray-200', 'bg-slate-700 border-purple-600')
          )}
        >
          <div
            className={cn(
              'flex justify-between p-3 border-b rounded-t',
              getThemeClass('bg-gray-50 border-gray-200', 'bg-slate-800 border-purple-600')
            )}
          >
            <Select
              onValueChange={handleMonthChange}
              value={date ? months[getMonth(date)] : months[getMonth(new Date())]}
            >
              <SelectTrigger
                className={cn(
                  'w-[110px] border rounded',
                  getThemeClass(
                    'bg-white border-gray-300 text-gray-900',
                    'bg-slate-700 border-purple-600 text-white'
                  )
                )}
              >
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent
                className={cn(
                  'border rounded-lg',
                  getThemeClass('bg-white border-gray-200', 'bg-slate-700 border-purple-600')
                )}
              >
                {months.map((month) => (
                  <SelectItem
                    key={month}
                    value={month}
                    className={getThemeClass(
                      'text-gray-900 hover:bg-gray-100 focus:bg-gray-100',
                      'text-white hover:bg-slate-600 focus:bg-slate-600'
                    )}
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
              <SelectTrigger
                className={cn(
                  'w-[110px] border rounded',
                  getThemeClass(
                    'bg-white border-gray-300 text-gray-900',
                    'bg-slate-700 border-purple-600 text-white'
                  )
                )}
              >
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent
                className={cn(
                  'border rounded-lg',
                  getThemeClass('bg-white border-gray-200', 'bg-slate-700 border-purple-600')
                )}
              >
                {years.map((year) => (
                  <SelectItem
                    key={year}
                    value={year.toString()}
                    className={getThemeClass(
                      'text-gray-900 hover:bg-gray-100 focus:bg-gray-100',
                      'text-white hover:bg-slate-600 focus:bg-slate-600'
                    )}
                  >
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className={cn('p-3', getThemeClass('bg-white', 'bg-slate-700'))}>
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
      {error && (
        <div className={cn('text-xs mt-1 ml-2', getThemeClass('text-red-600', 'text-red-400'))}>
          {error}
        </div>
      )}
    </div>
  );
}
