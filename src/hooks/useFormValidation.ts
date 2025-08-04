import { useState, useCallback } from 'react';

// Validation rule types
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any, formData?: any) => string | null;
}

export interface ValidationErrors {
  [key: string]: string;
}

export interface TouchedFields {
  [key: string]: boolean;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

export interface UseFormValidationReturn {
  errors: ValidationErrors;
  touched: TouchedFields;
  validateField: (fieldName: string, value: any, formData?: any) => boolean;
  validateForm: (formData: any) => boolean;
  clearError: (fieldName: string) => void;
  clearAllErrors: () => void;
  setTouched: (fieldName: string) => void;
  setErrors: React.Dispatch<React.SetStateAction<ValidationErrors>>;
}

// Pre-defined validation functions
const validateRequired = (value: any): string | null => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return 'Trường này là bắt buộc';
  }
  return null;
};

const validateMinLength = (value: any, minLength: number): string | null => {
  if (value && typeof value === 'string' && value.length < minLength) {
    return `Phải có ít nhất ${minLength} ký tự`;
  }
  return null;
};

const validateMaxLength = (value: any, maxLength: number): string | null => {
  if (value && typeof value === 'string' && value.length > maxLength) {
    return `Không được quá ${maxLength} ký tự`;
  }
  return null;
};

const validatePattern = (value: any, pattern: RegExp): string | null => {
  if (value && typeof value === 'string' && !pattern.test(value)) {
    return 'Định dạng không hợp lệ';
  }
  return null;
};

// Pre-defined field validators
export const fieldValidators = {
  eventName: (value: any): string => {
    if (!value || value.trim() === '') return 'Tên sự kiện là bắt buộc';
    if (value.length < 3) return 'Tên sự kiện phải có ít nhất 3 ký tự';
    if (value.length > 100) return 'Tên sự kiện không được quá 100 ký tự';
    return '';
  },
  
  eventLocation: (value: any): string => {
    if (value && value.length > 200) return 'Địa điểm không được quá 200 ký tự';
    return '';
  },
  
  startAt: (value: any): string => {
    if (!value) return 'Thời gian bắt đầu là bắt buộc';
    if (new Date(value) <= new Date()) return 'Thời gian bắt đầu phải sau thời điểm hiện tại';
    return '';
  },
  
  endAt: (value: any, formData?: any): string => {
    if (!value) return 'Thời gian kết thúc là bắt buộc';
    if (formData?.startAt && new Date(value) <= new Date(formData.startAt)) {
      return 'Thời gian kết thúc phải sau thời gian bắt đầu';
    }
    return '';
  },
  
  bankAccount: (value: any): string => {
    if (value && !/^[0-9]{8,20}$/.test(value)) {
      return 'Số tài khoản phải từ 8-20 chữ số';
    }
    return '';
  },
  
  bankAccountName: (value: any): string => {
    if (value && (value.length < 2 || value.length > 50)) {
      return 'Tên tài khoản phải từ 2-50 ký tự';
    }
    return '';
  },
  
  bankName: (value: any): string => {
    if (value && (value.length < 2 || value.length > 50)) {
      return 'Tên ngân hàng phải từ 2-50 ký tự';
    }
    return '';
  },
  
  categoryIds: (value: any): string => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return 'Vui lòng chọn ít nhất một danh mục';
    }
    return '';
  }
};

export const useFormValidation = (rules?: ValidationRules): UseFormValidationReturn => {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouchedState] = useState<TouchedFields>({});

  // Validate single field using rules or predefined validators
  const validateField = useCallback((fieldName: string, value: any, formData?: any): boolean => {
    let error = '';

    // Use predefined validator if available
    if (fieldValidators[fieldName as keyof typeof fieldValidators]) {
      error = fieldValidators[fieldName as keyof typeof fieldValidators](value, formData);
    } 
    // Otherwise use rules if provided
    else if (rules && rules[fieldName]) {
      const rule = rules[fieldName];
      
      if (rule.required) {
        const requiredError = validateRequired(value);
        if (requiredError) {
          error = requiredError;
        }
      }
      
      if (!error && rule.minLength) {
        const minLengthError = validateMinLength(value, rule.minLength);
        if (minLengthError) {
          error = minLengthError;
        }
      }
      
      if (!error && rule.maxLength) {
        const maxLengthError = validateMaxLength(value, rule.maxLength);
        if (maxLengthError) {
          error = maxLengthError;
        }
      }
      
      if (!error && rule.pattern) {
        const patternError = validatePattern(value, rule.pattern);
        if (patternError) {
          error = patternError;
        }
      }
      
      if (!error && rule.custom) {
        const customError = rule.custom(value, formData);
        if (customError) {
          error = customError;
        }
      }
    }

    // Update errors state
    setErrors(prev => {
      if (error) {
        return { ...prev, [fieldName]: error };
      } else {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      }
    });

    return !error;
  }, [rules]);

  // Validate entire form
  const validateForm = useCallback((formData: any): boolean => {
    const newErrors: ValidationErrors = {};
    let hasError = false;

    // Validate each field in formData
    Object.keys(formData).forEach(fieldName => {
      const value = formData[fieldName];
      let error = '';

      // Use predefined validator if available
      if (fieldValidators[fieldName as keyof typeof fieldValidators]) {
        error = fieldValidators[fieldName as keyof typeof fieldValidators](value, formData);
      }
      // Otherwise use rules if provided
      else if (rules && rules[fieldName]) {
        const rule = rules[fieldName];
        
        if (rule.required) {
          const requiredError = validateRequired(value);
          if (requiredError) error = requiredError;
        }
        
        if (!error && rule.minLength) {
          const minLengthError = validateMinLength(value, rule.minLength);
          if (minLengthError) error = minLengthError;
        }
        
        if (!error && rule.maxLength) {
          const maxLengthError = validateMaxLength(value, rule.maxLength);
          if (maxLengthError) error = maxLengthError;
        }
        
        if (!error && rule.pattern) {
          const patternError = validatePattern(value, rule.pattern);
          if (patternError) error = patternError;
        }
        
        if (!error && rule.custom) {
          const customError = rule.custom(value, formData);
          if (customError) error = customError;
        }
      }

      if (error) {
        newErrors[fieldName] = error;
        hasError = true;
      }
    });

    setErrors(newErrors);
    return !hasError;
  }, [rules]);

  // Clear error for specific field
  const clearError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Set touched state for field
  const setTouched = useCallback((fieldName: string) => {
    setTouchedState(prev => ({ ...prev, [fieldName]: true }));
  }, []);

  return {
    errors,
    touched,
    validateField,
    validateForm,
    clearError,
    clearAllErrors,
    setTouched,
    setErrors
  };
};
