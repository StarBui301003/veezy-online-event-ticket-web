import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

type BaseProps = {
  label?: string;
  error?: string;
  touched?: boolean;
  showError?: boolean;
  containerClass?: string;
  labelClass?: string;
  errorClass?: string;
};

type InputProps = React.InputHTMLAttributes<HTMLInputElement> &
  BaseProps & {
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
  };

type TextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & BaseProps;

type SelectOption = { value: string | number; label: string; disabled?: boolean };
type SelectProps = BaseProps & {
  options: SelectOption[];
  placeholder?: string;
  value?: string | string[];
  onChange: (value: any) => void;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
};

// Base styles
const baseStyles =
  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-offset-2 focus:outline-none transition-all duration-200';
const normalStyles =
  'bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-200 dark:bg-gray-800 dark:border-gray-600 dark:focus:border-blue-400 dark:focus:ring-blue-900';
const errorStyles =
  'border-red-500 focus:border-red-500 focus:ring-red-200 dark:border-red-500 dark:focus:border-red-500 dark:focus:ring-red-900';
const disabledStyles = 'bg-gray-100 cursor-not-allowed opacity-70 dark:bg-gray-700';
const labelStyles = 'block text-sm font-medium mb-1';
const errorMessageStyles = 'mt-1 text-sm text-red-600 dark:text-red-400';

// Input Component
export const InputField = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      touched,
      showError = true,
      className = '',
      containerClass = '',
      labelClass = '',
      errorClass = '',
      leftIcon,
      rightIcon,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${props.name || Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error && (touched || showError);

    return (
      <div className={cn('mb-4', containerClass)}>
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              labelStyles,
              hasError ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300',
              labelClass
            )}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={cn(
              baseStyles,
              hasError ? errorStyles : normalStyles,
              disabled && disabledStyles,
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">{rightIcon}</div>
          )}
        </div>
        {hasError && showError && <p className={cn(errorMessageStyles, errorClass)}>{error}</p>}
      </div>
    );
  }
);

// TextArea Component
export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      error,
      touched,
      showError = true,
      className = '',
      containerClass = '',
      labelClass = '',
      errorClass = '',
      rows = 3,
      id,
      ...props
    },
    ref
  ) => {
    const textareaId = id || `textarea-${props.name || Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error && (touched || showError);

    return (
      <div className={cn('mb-4', containerClass)}>
        {label && (
          <label
            htmlFor={textareaId}
            className={cn(
              labelStyles,
              hasError ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300',
              labelClass
            )}
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          className={cn(
            baseStyles,
            hasError ? errorStyles : normalStyles,
            'resize-y min-h-[80px]',
            className
          )}
          {...props}
        />
        {hasError && showError && <p className={cn(errorMessageStyles, errorClass)}>{error}</p>}
      </div>
    );
  }
);

// Select Component
export const SelectField: React.FC<SelectProps> = ({
  label,
  error,
  touched,
  showError = true,
  options,
  containerClass = '',
  labelClass = '',
  errorClass = '',
  placeholder = 'Select an option',
  value,
  onChange,
  multiple = false,
  disabled = false,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = !!error && (touched || showError);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions, (option) => option.value);
    onChange(multiple ? selected : selected[0] || '');
  };

  return (
    <div className={cn('mb-4', containerClass)}>
      {label && (
        <label
          htmlFor={selectId}
          className={cn(
            labelStyles,
            hasError ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300',
            labelClass
          )}
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        value={value}
        onChange={handleChange}
        multiple={multiple}
        disabled={disabled}
        className={cn(
          baseStyles,
          hasError ? errorStyles : normalStyles,
          'appearance-none bg-no-repeat pr-10',
          !multiple &&
            "bg-[url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")] bg-[right_0.5rem_center]",
          disabled && disabledStyles,
          className
        )}
        {...props}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {hasError && showError && <p className={cn(errorMessageStyles, errorClass)}>{error}</p>}
    </div>
  );
};
