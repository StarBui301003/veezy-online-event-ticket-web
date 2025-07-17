// Replace with the correct import or define the type if missing
import { CreateEventData } from "@/types/event";


export const validateEventForm = (formData: CreateEventData): string[] | null => {
  const errors: string[] = [];
  const now = new Date();
  const start = new Date(formData.startAt);
  const end = new Date(formData.endAt);

  // Kiểm tra ngày
  if (start < now) errors.push("Ngày bắt đầu không được nằm trong quá khứ.");
  if (end < now) errors.push("Ngày kết thúc không được nằm trong quá khứ.");
  if (end <= start) errors.push("Ngày kết thúc phải sau ngày bắt đầu.");

  // Kiểm tra các trường bắt buộc
  if (!formData.eventName.trim()) errors.push("Tên sự kiện là bắt buộc.");
  if (!formData.eventDescription.trim()) errors.push("Mô tả sự kiện là bắt buộc.");
  if (formData.categoryIds.length === 0) errors.push("Cần chọn ít nhất một danh mục.");
  if (!formData.eventCoverImageUrl && formData.contents.every(content => !content.imageUrl)) {
    errors.push("Cần tải lên ít nhất một ảnh (ảnh bìa hoặc ảnh nội dung).");
  }

  return errors.length > 0 ? errors : null;
};

// Email validation using RFC 5322 standard (simplified)
const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Vietnamese phone number: starts with 0 or +84, followed by 9 digits
const phoneRegex = /^(\+84|0)[1-9][0-9]{8}$/;

// Username: 3-30 characters, alphanumeric and underscores only
const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;

// Full name: 2-50 characters, letters, spaces, and Vietnamese diacritics
const fullNameRegex = /^[\p{L}\s]{2,50}$/u;

// Password: at least 8 characters, must contain uppercase, lowercase, number, and special character
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export const validateEmail = (email: string): ValidationResult => {
  if (!email || !email.trim()) {
    return { isValid: false, errorMessage: 'Email is required' };
  }

  if (email.length > 254) {
    return { isValid: false, errorMessage: 'Email cannot exceed 254 characters' };
  }

  if (!emailRegex.test(email)) {
    return { isValid: false, errorMessage: 'Invalid email format' };
  }

  return { isValid: true };
};

export const validatePassword = (password: string): ValidationResult => {
  if (!password || !password.trim()) {
    return { isValid: false, errorMessage: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, errorMessage: 'Password must be at least 8 characters long' };
  }

  if (password.length > 128) {
    return { isValid: false, errorMessage: 'Password cannot exceed 128 characters' };
  }

  if (!passwordRegex.test(password)) {
    return { isValid: false, errorMessage: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)' };
  }

  return { isValid: true };
};

export const validatePhone = (phone: string): ValidationResult => {
  if (!phone || !phone.trim()) {
    return { isValid: true }; // Phone is optional
  }

  if (!phoneRegex.test(phone)) {
    return { isValid: false, errorMessage: 'Invalid Vietnamese phone number format. Please use format: 0xxxxxxxxx or +84xxxxxxxxx' };
  }

  return { isValid: true };
};

export const validateUsername = (username: string): ValidationResult => {
  if (!username || !username.trim()) {
    return { isValid: false, errorMessage: 'Username is required' };
  }

  if (!usernameRegex.test(username)) {
    return { isValid: false, errorMessage: 'Username must be 3-30 characters long and contain only letters, numbers, and underscores' };
  }

  return { isValid: true };
};

export const validateFullName = (fullName: string): ValidationResult => {
  if (!fullName || !fullName.trim()) {
    return { isValid: false, errorMessage: 'Full name is required' };
  }

  if (!fullNameRegex.test(fullName)) {
    return { isValid: false, errorMessage: 'Full name must be 2-50 characters long and contain only letters and spaces' };
  }

  return { isValid: true };
};

export const validateDateOfBirth = (dateOfBirth: string): ValidationResult => {
  if (!dateOfBirth || !dateOfBirth.trim()) {
    return { isValid: true }; // Date of birth is optional
  }

  const date = new Date(dateOfBirth);
  const today = new Date();

  if (date > today) {
    return { isValid: false, errorMessage: 'Date of birth cannot be in the future' };
  }

  const age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    const adjustedAge = age - 1;
    if (adjustedAge < 13) {
      return { isValid: false, errorMessage: 'You must be at least 13 years old to register' };
    }
  } else if (age < 13) {
    return { isValid: false, errorMessage: 'You must be at least 13 years old to register' };
  }

  if (age > 120) {
    return { isValid: false, errorMessage: 'Invalid date of birth' };
  }

  return { isValid: true };
};

export const validateRequired = (value: string, fieldName: string): ValidationResult => {
  if (!value || !value.trim()) {
    return { isValid: false, errorMessage: `${fieldName} is required` };
  }
  return { isValid: true };
};

export const validateMinLength = (value: string, minLength: number, fieldName: string): ValidationResult => {
  if (!value || value.length < minLength) {
    return { isValid: false, errorMessage: `${fieldName} must be at least ${minLength} characters long` };
  }
  return { isValid: true };
};

export const validateMaxLength = (value: string, maxLength: number, fieldName: string): ValidationResult => {
  if (value && value.length > maxLength) {
    return { isValid: false, errorMessage: `${fieldName} cannot exceed ${maxLength} characters` };
  }
  return { isValid: true };
};

export const validateNumber = (value: string, fieldName: string): ValidationResult => {
  if (!value || !value.trim()) {
    return { isValid: false, errorMessage: `${fieldName} is required` };
  }

  const num = Number(value);
  if (isNaN(num) || num < 0) {
    return { isValid: false, errorMessage: `${fieldName} must be a valid positive number` };
  }

  return { isValid: true };
};

export const validatePositiveNumber = (value: number, fieldName: string): ValidationResult => {
  if (value <= 0) {
    return { isValid: false, errorMessage: `${fieldName} must be greater than 0` };
  }
  return { isValid: true };
};

export const validateDateTime = (value: string, fieldName: string): ValidationResult => {
  if (!value || !value.trim()) {
    return { isValid: false, errorMessage: `${fieldName} is required` };
  }

  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return { isValid: false, errorMessage: `${fieldName} must be a valid date` };
  }

  return { isValid: true };
};

export const validateFutureDate = (value: string, fieldName: string): ValidationResult => {
  if (!value || !value.trim()) {
    return { isValid: false, errorMessage: `${fieldName} is required` };
  }

  const date = new Date(value);
  const now = new Date();

  if (date <= now) {
    return { isValid: false, errorMessage: `${fieldName} must be in the future` };
  }

  return { isValid: true };
};

export const validateDiscountCode = (code: string): ValidationResult => {
  if (!code || !code.trim()) {
    return { isValid: false, errorMessage: 'Discount code is required' };
  }

  if (code.length < 3 || code.length > 20) {
    return { isValid: false, errorMessage: 'Discount code must be 3-20 characters long' };
  }

  if (!/^[A-Z0-9]+$/.test(code)) {
    return { isValid: false, errorMessage: 'Discount code must contain only uppercase letters and numbers' };
  }

  return { isValid: true };
};

export const validateRejectionReason = (reason: string): ValidationResult => {
  if (!reason || !reason.trim()) {
    return { isValid: false, errorMessage: 'Rejection reason is required' };
  }

  if (reason.length < 10) {
    return { isValid: false, errorMessage: 'Rejection reason must be at least 10 characters long' };
  }

  if (reason.length > 500) {
    return { isValid: false, errorMessage: 'Rejection reason cannot exceed 500 characters' };
  }

  return { isValid: true };
};

export const validateRegistration = (
  username: string,
  email: string,
  password: string,
  fullName: string,
  phone?: string,
  dateOfBirth?: string
): string[] => {
  const errors: string[] = [];

  const usernameValidation = validateUsername(username);
  if (!usernameValidation.isValid) {
    errors.push(usernameValidation.errorMessage!);
  }

  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    errors.push(emailValidation.errorMessage!);
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    errors.push(passwordValidation.errorMessage!);
  }

  const fullNameValidation = validateFullName(fullName);
  if (!fullNameValidation.isValid) {
    errors.push(fullNameValidation.errorMessage!);
  }

  if (phone) {
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.isValid) {
      errors.push(phoneValidation.errorMessage!);
    }
  }

  if (dateOfBirth) {
    const dobValidation = validateDateOfBirth(dateOfBirth);
    if (!dobValidation.isValid) {
      errors.push(dobValidation.errorMessage!);
    }
  }

  return errors;
};

export const validateProfileUpdate = (
  fullName: string,
  email: string,
  phone?: string,
  dateOfBirth?: string
): string[] => {
  const errors: string[] = [];

  const fullNameValidation = validateFullName(fullName);
  if (!fullNameValidation.isValid) {
    errors.push(fullNameValidation.errorMessage!);
  }

  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    errors.push(emailValidation.errorMessage!);
  }

  if (phone) {
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.isValid) {
      errors.push(phoneValidation.errorMessage!);
    }
  }

  if (dateOfBirth) {
    const dobValidation = validateDateOfBirth(dateOfBirth);
    if (!dobValidation.isValid) {
      errors.push(dobValidation.errorMessage!);
    }
  }

  return errors;
};

// Utility functions for handling backend errors
export interface FieldErrors {
  [key: string]: string[];
}

interface BackendErrorResponse {
  fieldErrors: FieldErrors;
  generalErrors: string[];
}

// Map backend field names to frontend field names
const mapBackendFieldToFrontend = (backendField: string): string => {
  const fieldMapping: { [key: string]: string } = {
    'Username': 'username',
    'Email': 'email',
    'Password': 'password',
    'FullName': 'fullname',
    'Phone': 'phone',
    'DateOfBirth': 'dateofbirth',
  };

  return fieldMapping[backendField] || backendField.toLowerCase();
};

export const parseBackendErrors = (error: unknown): BackendErrorResponse => {
  const defaultResponse: BackendErrorResponse = {
    fieldErrors: {},
    generalErrors: [],
  };

  if (!error || typeof error !== 'object') {
    return defaultResponse;
  }

  // Handle axios error
  let responseData = null;
  if ('response' in error && error.response && typeof error.response === 'object') {
    responseData = (error.response as { data?: unknown }).data;
  } else if ('data' in error && error.data) {
    responseData = (error as { data: unknown }).data;
  }

  if (!responseData || typeof responseData !== 'object') {
    return {
      fieldErrors: {},
      generalErrors: ['An unexpected error occurred'],
    };
  }

  // Handle ASP.NET Core ValidationProblemDetails format: {type, title, status, errors, traceId}
  if ('errors' in responseData && typeof (responseData as { errors?: unknown }).errors === 'object') {
    const errors = (responseData as { errors: Record<string, unknown> }).errors;
    const fieldErrors: FieldErrors = {};

    Object.entries(errors).forEach(([backendFieldName, messages]) => {
      const frontendFieldName = mapBackendFieldToFrontend(backendFieldName);
      if (Array.isArray(messages)) {
        // Take the first error message for each field for cleaner display
        fieldErrors[frontendFieldName] = [messages[0]];
      } else if (typeof messages === 'string') {
        fieldErrors[frontendFieldName] = [messages];
      }
    });

    return {
      fieldErrors,
      generalErrors: [],
    };
  }

  // Handle IdentityService ApiResponse format: {flag, code, message, data}
  if ('message' in responseData && typeof (responseData as { message?: unknown }).message === 'string') {
    const errorMessage = (responseData as { message: string }).message;
    const fieldErrors: FieldErrors = {};
    const generalErrors: string[] = [];

    // Split multiple errors by semicolon
    const errors = errorMessage.split(';').map(err => err.trim()).filter(err => err.length > 0);

    errors.forEach(errorMsg => {
      // Map error messages to specific fields based on keywords
      let mapped = false;

      // Username errors
      if (errorMsg.toLowerCase().includes('username')) {
        fieldErrors.username = [errorMsg];
        mapped = true;
      }
      // Email errors
      else if (errorMsg.toLowerCase().includes('email')) {
        fieldErrors.email = [errorMsg];
        mapped = true;
      }
      // Password errors
      else if (errorMsg.toLowerCase().includes('password')) {
        fieldErrors.password = [errorMsg];
        mapped = true;
      }
      // Full name errors
      else if (errorMsg.toLowerCase().includes('full name') || errorMsg.toLowerCase().includes('fullname')) {
        fieldErrors.fullname = [errorMsg];
        mapped = true;
      }
      // Phone errors
      else if (errorMsg.toLowerCase().includes('phone')) {
        fieldErrors.phone = [errorMsg];
        mapped = true;
      }
      // Date of birth errors
      else if (errorMsg.toLowerCase().includes('date of birth') || errorMsg.toLowerCase().includes('dateofbirth') || errorMsg.toLowerCase().includes('age')) {
        fieldErrors.dateofbirth = [errorMsg];
        mapped = true;
      }

      // If error couldn't be mapped to a specific field, add to general errors
      if (!mapped) {
        generalErrors.push(errorMsg);
      }
    });

    return {
      fieldErrors,
      generalErrors,
    };
  }

  // Fallback: treat the whole response as a general error
  const message = (responseData as { message?: string; title?: string }).message ||
    (responseData as { message?: string; title?: string }).title ||
    'An error occurred';
  return {
    fieldErrors: {},
    generalErrors: [message],
  };
};

export const getFieldError = (fieldErrors: FieldErrors, fieldName: string): string | undefined => {
  // Try to find error by exact field name first, then by lowercase
  const errors = fieldErrors[fieldName] || fieldErrors[fieldName.toLowerCase()];
  return errors && errors.length > 0 ? errors[0] : undefined;
};

export const hasFieldError = (fieldErrors: FieldErrors, fieldName: string): boolean => {
  // Try to find error by exact field name first, then by lowercase
  const errors = fieldErrors[fieldName] || fieldErrors[fieldName.toLowerCase()];
  return errors && errors.length > 0;
};

export const getAllFieldErrors = (fieldErrors: FieldErrors): string[] => {
  const allErrors: string[] = [];
  Object.values(fieldErrors).forEach(errors => {
    if (Array.isArray(errors)) {
      allErrors.push(...errors);
    }
  });
  return allErrors;
};
