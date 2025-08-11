'use client';

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '@/lib/utils';

interface DualRangeSliderProps {
  value: [number, number];
  onValueChange: (value: [number, number]) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: (value: number) => React.ReactNode;
  className?: string;
  debounceMs?: number;
}

const DualRangeSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  DualRangeSliderProps
>(
  (
    {
      className,
      value,
      onValueChange,
      min = 0,
      max = 100,
      step = 1,
      label,
      debounceMs = 300,
      ...props
    },
    ref
  ) => {
    const [localValue, setLocalValue] = React.useState<[number, number]>(value);
    const timeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined);
    const isDraggingRef = React.useRef(false);

    // Update local value when prop value changes (but not during drag)
    React.useEffect(() => {
      if (!isDraggingRef.current) {
        setLocalValue(value);
      }
    }, [value]);

    // Debounced value change handler
    const handleValueChange = React.useCallback(
      (newValue: [number, number]) => {
        setLocalValue(newValue);

        // Clear existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Debounce the actual value change
        timeoutRef.current = setTimeout(() => {
          onValueChange(newValue);
        }, debounceMs);
      },
      [onValueChange, debounceMs]
    );

    // Handle drag start
    const handleDragStart = React.useCallback(() => {
      isDraggingRef.current = true;
    }, []);

    // Handle drag end
    const handleDragEnd = React.useCallback(
      (newValue: [number, number]) => {
        isDraggingRef.current = false;
        // Immediately update parent value when drag ends
        onValueChange(newValue);
      },
      [onValueChange]
    );

    // Cleanup timeout on unmount
    React.useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    return (
      <div className="w-full space-y-4">
        <SliderPrimitive.Root
          ref={ref}
          className={cn('relative flex w-full touch-none select-none items-center', className)}
          value={localValue}
          onValueChange={handleValueChange}
          onValueCommit={handleDragEnd}
          min={min}
          max={max}
          step={step}
          {...props}
        >
          <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-gray-200">
            <SliderPrimitive.Range className="absolute h-full bg-blue-500" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb
            className="block h-5 w-5 rounded-full border-2 border-blue-500 bg-white shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:pointer-events-none disabled:opacity-50 hover:bg-blue-50 cursor-pointer"
            onPointerDown={handleDragStart}
          />
          <SliderPrimitive.Thumb
            className="block h-5 w-5 rounded-full border-2 border-blue-500 bg-white shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:pointer-events-none disabled:opacity-50 hover:bg-blue-50 cursor-pointer"
            onPointerDown={handleDragStart}
          />
        </SliderPrimitive.Root>

        {/* Custom Labels */}
        {label && (
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>{label(localValue[0])}</span>
            <span>{label(localValue[1])}</span>
          </div>
        )}
      </div>
    );
  }
);

DualRangeSlider.displayName = 'DualRangeSlider';

export { DualRangeSlider };
