import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
    type FieldErrors,
    parseAdminBackendErrors,
    getFieldError,
    hasFieldError,
    getAllFieldErrors,
} from '@/utils/validation';

export interface UseAdminValidationOptions {
    // Whether to show toast messages for validation errors
    showToastOnValidation?: boolean;
    // Whether to show toast messages for API errors
    showToastOnApiError?: boolean;
    // Custom field error message prefix
    fieldErrorPrefix?: string;
    // Filter function to determine which API errors should show toast
    shouldShowApiErrorToast?: (error: unknown, generalErrors: string[], fieldErrors: FieldErrors) => boolean;
}

export interface UseAdminValidationReturn {
    // Field errors state
    fieldErrors: FieldErrors;
    // Set field errors manually
    setFieldErrors: React.Dispatch<React.SetStateAction<FieldErrors>>;
    // Clear all field errors
    clearAllErrors: () => void;
    // Clear specific field error
    clearFieldError: (fieldName: string) => void;
    // Get field error message
    getFieldError: (fieldName: string) => string | undefined;
    // Check if field has error
    hasFieldError: (fieldName: string) => boolean;
    // Validate form data with custom validation function
    validateForm: <T>(
        formData: T,
        validationFn: (data: T) => FieldErrors,
        options?: { showToast?: boolean }
    ) => boolean;
    // Handle API errors and extract field errors
    handleApiError: (error: unknown, customMessage?: string) => void;
    // Get error class for input styling
    getErrorClass: (fieldName: string, baseClass?: string) => string;
    // Get all validation errors as array
    getAllErrors: () => string[];
}

export const useAdminValidation = (
    options: UseAdminValidationOptions = {}
): UseAdminValidationReturn => {
    const {
        showToastOnValidation = true,
        showToastOnApiError = true,
        fieldErrorPrefix = '',
        shouldShowApiErrorToast,
    } = options;

    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    // Clear all errors
    const clearAllErrors = useCallback(() => {
        setFieldErrors({});
    }, []);

    // Clear specific field error
    const clearFieldError = useCallback((fieldName: string) => {
        setFieldErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[fieldName];
            delete newErrors[fieldName.toLowerCase()];
            return newErrors;
        });
    }, []);

    // Get field error message
    const getFieldErrorMessage = useCallback(
        (fieldName: string): string | undefined => {
            return getFieldError(fieldErrors, fieldName);
        },
        [fieldErrors]
    );

    // Check if field has error
    const hasFieldErrorState = useCallback(
        (fieldName: string): boolean => {
            return hasFieldError(fieldErrors, fieldName);
        },
        [fieldErrors]
    );

    // Validate form with custom validation function
    const validateForm = useCallback(
        <T>(
            formData: T,
            validationFn: (data: T) => FieldErrors,
            validationOptions: { showToast?: boolean } = {}
        ): boolean => {
            const { showToast = showToastOnValidation } = validationOptions;

            // Clear previous errors
            clearAllErrors();

            // Run validation
            const errors = validationFn(formData);
            const hasErrors = Object.keys(errors).length > 0;

            if (hasErrors) {
                setFieldErrors(errors);

                if (showToast) {
                    const errorMessages = getAllFieldErrors(errors);

                    if (errorMessages.length > 0) {
                        const message = fieldErrorPrefix
                            ? `${fieldErrorPrefix}: ${errorMessages[0]}`
                            : errorMessages[0];
                        toast.error(message);
                    } else {
                        toast.error('Please check your input fields');
                    }
                }
            }

            return !hasErrors;
        },
        [clearAllErrors, showToastOnValidation, fieldErrorPrefix]
    );

    // Handle API errors
    const handleApiError = useCallback(
        (error: unknown, customMessage?: string) => {
            const { fieldErrors: apiFieldErrors, generalErrors } = parseAdminBackendErrors(error);

            // Set field errors for inline display
            setFieldErrors(apiFieldErrors);

            // Determine if toast should be shown
            const shouldShowToast = shouldShowApiErrorToast
                ? shouldShowApiErrorToast(error, generalErrors, apiFieldErrors)
                : showToastOnApiError;

            if (shouldShowToast) {
                if (customMessage) {
                    toast.error(customMessage);
                } else if (generalErrors.length > 0) {
                    // Show the first general error
                    toast.error(generalErrors[0]);
                } else if (Object.keys(apiFieldErrors).length > 0) {
                    // Show the first field error
                    const firstFieldError = Object.values(apiFieldErrors)[0];
                    if (firstFieldError && firstFieldError.length > 0) {
                        toast.error(firstFieldError[0]);
                    } else {
                        toast.error('Please check your input fields');
                    }
                } else {
                    // Try to extract error message from axios error
                    if (error && typeof error === 'object' && 'response' in error) {
                        const response = (error as any).response;
                        if (response?.data?.message) {
                            toast.error(response.data.message);
                        } else if (response?.data?.title) {
                            toast.error(response.data.title);
                        } else {
                            toast.error('An error occurred. Please try again.');
                        }
                    } else {
                        toast.error('An error occurred. Please try again.');
                    }
                }
            }
        },
        [showToastOnApiError, shouldShowApiErrorToast]
    );

    // Get error class for input styling
    const getErrorClass = useCallback(
        (fieldName: string, baseClass = ''): string => {
            const hasError = hasFieldErrorState(fieldName);
            const errorClass = hasError ? 'border-red-500 border-2' : '';
            return `${baseClass} ${errorClass}`.trim();
        },
        [hasFieldErrorState]
    );

    // Get all errors as array
    const getAllErrors = useCallback((): string[] => {
        return getAllFieldErrors(fieldErrors);
    }, [fieldErrors]);

    return {
        fieldErrors,
        setFieldErrors,
        clearAllErrors,
        clearFieldError,
        getFieldError: getFieldErrorMessage,
        hasFieldError: hasFieldErrorState,
        validateForm,
        handleApiError,
        getErrorClass,
        getAllErrors,
    };
};

// Utility function to create field change handler that clears errors
export const createFieldChangeHandler = <T = string>(
    fieldName: string,
    setValue: (value: T) => void,
    clearFieldError: (fieldName: string) => void
) => {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { value, type, checked } = e.target as HTMLInputElement;
        const newValue = type === 'checkbox' ? checked : value;
        setValue(newValue as T);
        clearFieldError(fieldName);
    };
};

// Utility function to create custom change handler (for Select components, etc.)
export const createCustomChangeHandler = <T = string>(
    fieldName: string,
    setValue: (value: T) => void,
    clearFieldError: (fieldName: string) => void
) => {
    return (value: T) => {
        setValue(value);
        clearFieldError(fieldName);
    };
};

// Pre-built error display component props
export interface ErrorDisplayProps {
    fieldName: string;
    getFieldError: (fieldName: string) => string | undefined;
    className?: string;
}

// Utility to get error display data (for use in JSX)
export const getErrorDisplayData = ({ fieldName, getFieldError, className = '' }: ErrorDisplayProps) => {
    const error = getFieldError(fieldName);

    if (!error) return null;

    return {
        error,
        className: `text-red-400 text-sm mt-1 ml-2 text-left ${className}`.trim(),
    };
};

export default useAdminValidation; 