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

// ===== ADMIN VALIDATION FUNCTIONS =====

// Amount validation for discount codes (minimum/maximum)
export const validateAmount = (amount: number, fieldName: string, isRequired = false): ValidationResult => {
  if (!isRequired && (amount === 0 || amount === null || amount === undefined)) {
    return { isValid: true };
  }

  if (isRequired && (amount === 0 || amount === null || amount === undefined)) {
    return { isValid: false, errorMessage: `${fieldName} is required` };
  }

  if (amount < 0) {
    return { isValid: false, errorMessage: `${fieldName} must be greater than or equal to 0` };
  }

  if (amount > 999999999) {
    return { isValid: false, errorMessage: `${fieldName} cannot exceed 999,999,999` };
  }

  return { isValid: true };
};

// Special validation for minimum and maximum amount relationship
export const validateMinMaxAmount = (minimum: number, maximum: number): ValidationResult => {
  // If both are 0 or not set, it's valid
  if ((!minimum || minimum === 0) && (!maximum || maximum === 0)) {
    return { isValid: true };
  }

  // If only minimum is set, it's valid
  if (minimum > 0 && (!maximum || maximum === 0)) {
    return { isValid: true };
  }

  // If only maximum is set, it's valid
  if ((!minimum || minimum === 0) && maximum > 0) {
    return { isValid: true };
  }

  // If both are set, maximum must be greater than minimum
  if (minimum > 0 && maximum > 0) {
    if (maximum <= minimum) {
      return { isValid: false, errorMessage: 'Maximum amount must be greater than minimum amount' };
    }
  }

  return { isValid: true };
};

// Category name validation
export const validateCategoryName = (name: string): ValidationResult => {
  if (!name || !name.trim()) {
    return { isValid: false, errorMessage: 'Category name is required' };
  }

  if (name.length < 2) {
    return { isValid: false, errorMessage: 'Category name must be at least 2 characters long' };
  }

  if (name.length > 50) {
    return { isValid: false, errorMessage: 'Category name cannot exceed 50 characters' };
  }

  return { isValid: true };
};

// Event name validation
export const validateEventName = (name: string): ValidationResult => {
  if (!name || !name.trim()) {
    return { isValid: false, errorMessage: 'Event name is required' };
  }

  if (name.length < 3) {
    return { isValid: false, errorMessage: 'Event name must be at least 3 characters long' };
  }

  if (name.length > 100) {
    return { isValid: false, errorMessage: 'Event name cannot exceed 100 characters' };
  }

  return { isValid: true };
};

// Description validation
export const validateDescription = (description: string, fieldName = 'Description', minLength = 10, maxLength = 1000): ValidationResult => {
  if (!description || !description.trim()) {
    return { isValid: false, errorMessage: `${fieldName} is required` };
  }

  if (description.length < minLength) {
    return { isValid: false, errorMessage: `${fieldName} must be at least ${minLength} characters long` };
  }

  if (description.length > maxLength) {
    return { isValid: false, errorMessage: `${fieldName} cannot exceed ${maxLength} characters` };
  }

  return { isValid: true };
};

// Usage count validation
export const validateUsageCount = (count: number, fieldName = 'Usage count'): ValidationResult => {
  if (count <= 0) {
    return { isValid: false, errorMessage: `${fieldName} must be greater than 0` };
  }

  if (count > 999999) {
    return { isValid: false, errorMessage: `${fieldName} cannot exceed 999,999` };
  }

  return { isValid: true };
};

// Discount percentage validation
export const validateDiscountPercentage = (percentage: number): ValidationResult => {
  if (percentage <= 0) {
    return { isValid: false, errorMessage: 'Discount percentage must be greater than 0' };
  }

  if (percentage > 100) {
    return { isValid: false, errorMessage: 'Discount percentage cannot exceed 100%' };
  }

  return { isValid: true };
};

// News title validation
export const validateNewsTitle = (title: string): ValidationResult => {
  if (!title || !title.trim()) {
    return { isValid: false, errorMessage: 'News title is required' };
  }

  if (title.length < 5) {
    return { isValid: false, errorMessage: 'News title must be at least 5 characters long' };
  }

  if (title.length > 150) {
    return { isValid: false, errorMessage: 'News title cannot exceed 150 characters' };
  }

  return { isValid: true };
};

// Comment content validation
export const validateCommentContent = (content: string): ValidationResult => {
  if (!content || !content.trim()) {
    return { isValid: false, errorMessage: 'Comment content is required' };
  }

  if (content.length < 1) {
    return { isValid: false, errorMessage: 'Comment content cannot be empty' };
  }

  if (content.length > 2000) {
    return { isValid: false, errorMessage: 'Comment content cannot exceed 2000 characters' };
  }

  return { isValid: true };
};

// Select field validation
export const validateSelect = (value: string | number, fieldName: string): ValidationResult => {
  if (!value && value !== 0) {
    return { isValid: false, errorMessage: `${fieldName} is required` };
  }

  return { isValid: true };
};

// File validation
export const validateFile = (file: File | null, fieldName: string, isRequired = false, allowedTypes?: string[], maxSizeMB = 5): ValidationResult => {
  if (!file) {
    if (isRequired) {
      return { isValid: false, errorMessage: `${fieldName} is required` };
    }
    return { isValid: true };
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { isValid: false, errorMessage: `${fieldName} size cannot exceed ${maxSizeMB}MB` };
  }

  // Check file type
  if (allowedTypes && allowedTypes.length > 0) {
    const fileType = file.type.toLowerCase();
    const isAllowed = allowedTypes.some(type => fileType.includes(type.toLowerCase()));
    if (!isAllowed) {
      return { isValid: false, errorMessage: `${fieldName} must be one of: ${allowedTypes.join(', ')}` };
    }
  }

  return { isValid: true };
};

// URL validation
export const validateUrl = (url: string, fieldName = 'URL', isRequired = false): ValidationResult => {
  if (!url || !url.trim()) {
    if (isRequired) {
      return { isValid: false, errorMessage: `${fieldName} is required` };
    }
    return { isValid: true };
  }

  try {
    new URL(url);
    return { isValid: true };
  } catch {
    return { isValid: false, errorMessage: `${fieldName} must be a valid URL` };
  }
};

// Date range validation
export const validateDateRange = (startDate: string, endDate: string): ValidationResult => {
  if (!startDate || !endDate) {
    return { isValid: false, errorMessage: 'Both start date and end date are required' };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();

  if (start >= end) {
    return { isValid: false, errorMessage: 'End date must be after start date' };
  }

  if (start < now) {
    return { isValid: false, errorMessage: 'Start date cannot be in the past' };
  }

  return { isValid: true };
};

// ===== ADMIN FORM VALIDATION HELPERS =====

// Comprehensive discount code validation
export const validateDiscountCodeForm = (formData: {
  eventId: string;
  code: string;
  discountType: number;
  value: number;
  minimum: number;
  maximum: number;
  maxUsage: number;
  expiredAt: string;
}): FieldErrors => {
  const errors: FieldErrors = {};

  // Event selection
  const eventValidation = validateSelect(formData.eventId, 'Event');
  if (!eventValidation.isValid) {
    errors.eventId = [eventValidation.errorMessage!];
  }

  // Discount code
  const codeValidation = validateDiscountCode(formData.code);
  if (!codeValidation.isValid) {
    errors.code = [codeValidation.errorMessage!];
  }

  // Value validation based on discount type
  if (formData.discountType === 0) { // Percentage
    const percentageValidation = validateDiscountPercentage(formData.value);
    if (!percentageValidation.isValid) {
      errors.value = [percentageValidation.errorMessage!];
    }
  } else { // Amount
    const amountValidation = validateAmount(formData.value, 'Discount value', true);
    if (!amountValidation.isValid) {
      errors.value = [amountValidation.errorMessage!];
    }
  }

  // Minimum amount
  const minimumValidation = validateAmount(formData.minimum, 'Minimum amount');
  if (!minimumValidation.isValid) {
    errors.minimum = [minimumValidation.errorMessage!];
  }

  // Maximum amount
  const maximumValidation = validateAmount(formData.maximum, 'Maximum amount');
  if (!maximumValidation.isValid) {
    errors.maximum = [maximumValidation.errorMessage!];
  }

  // Min-Max relationship
  const minMaxValidation = validateMinMaxAmount(formData.minimum, formData.maximum);
  if (!minMaxValidation.isValid) {
    errors.maximum = [minMaxValidation.errorMessage!];
  }

  // Max usage
  const maxUsageValidation = validateUsageCount(formData.maxUsage, 'Max usage');
  if (!maxUsageValidation.isValid) {
    errors.maxUsage = [maxUsageValidation.errorMessage!];
  }

  // Expiry date
  const expiredAtValidation = validateFutureDate(formData.expiredAt, 'Expiry date');
  if (!expiredAtValidation.isValid) {
    errors.expiredAt = [expiredAtValidation.errorMessage!];
  }

  return errors;
};

// Category form validation
export const validateCategoryForm = (formData: {
  categoryName: string;
  description: string;
}): FieldErrors => {
  const errors: FieldErrors = {};

  const nameValidation = validateCategoryName(formData.categoryName);
  if (!nameValidation.isValid) {
    errors.categoryName = [nameValidation.errorMessage!];
  }

  const descValidation = validateDescription(formData.description, 'Description', 5, 500);
  if (!descValidation.isValid) {
    errors.description = [descValidation.errorMessage!];
  }

  return errors;
};

// News form validation
export const validateNewsForm = (formData: {
  title: string;
  content: string;
  summary?: string;
}): FieldErrors => {
  const errors: FieldErrors = {};

  const titleValidation = validateNewsTitle(formData.title);
  if (!titleValidation.isValid) {
    errors.title = [titleValidation.errorMessage!];
  }

  const contentValidation = validateDescription(formData.content, 'Content', 20, 5000);
  if (!contentValidation.isValid) {
    errors.content = [contentValidation.errorMessage!];
  }

  if (formData.summary) {
    const summaryValidation = validateDescription(formData.summary, 'Summary', 10, 200);
    if (!summaryValidation.isValid) {
      errors.summary = [summaryValidation.errorMessage!];
    }
  }

  return errors;
};

// Create admin form validation
export const validateCreateAdminForm = (formData: {
  username: string;
  email: string;
  phone: string;
  password: string;
  fullName: string;
  dateOfBirth: string;
  gender: number;
}): FieldErrors => {
  const errors: FieldErrors = {};

  // Username validation
  const usernameValidation = validateUsername(formData.username);
  if (!usernameValidation.isValid) {
    errors.username = [usernameValidation.errorMessage!];
  }

  // Email validation
  const emailValidation = validateEmail(formData.email);
  if (!emailValidation.isValid) {
    errors.email = [emailValidation.errorMessage!];
  }

  // Phone validation
  const phoneValidation = validatePhone(formData.phone);
  if (!phoneValidation.isValid) {
    errors.phone = [phoneValidation.errorMessage!];
  }

  // Password validation
  const passwordValidation = validatePassword(formData.password);
  if (!passwordValidation.isValid) {
    errors.password = [passwordValidation.errorMessage!];
  }

  // Full name validation
  const fullNameValidation = validateFullName(formData.fullName);
  if (!fullNameValidation.isValid) {
    errors.fullName = [fullNameValidation.errorMessage!];
  }

  // Date of birth validation
  const dobValidation = validateDateOfBirth(formData.dateOfBirth);
  if (!dobValidation.isValid) {
    errors.dateOfBirth = [dobValidation.errorMessage!];
  }

  return errors;
};

// Edit discount code form validation
export const validateEditDiscountCodeForm = (formData: {
  code: string;
  discountType: number;
  value: number;
  minimum: number;
  maximum: number;
  maxUsage: number;
  expiredAt: string;
}): FieldErrors => {
  const errors: FieldErrors = {};

  // Discount code
  const codeValidation = validateDiscountCode(formData.code);
  if (!codeValidation.isValid) {
    errors.code = [codeValidation.errorMessage!];
  }

  // Value validation based on discount type
  if (formData.discountType === 0) { // Percentage
    const percentageValidation = validateDiscountPercentage(formData.value);
    if (!percentageValidation.isValid) {
      errors.value = [percentageValidation.errorMessage!];
    }
  } else { // Amount
    const amountValidation = validateAmount(formData.value, 'Discount value', true);
    if (!amountValidation.isValid) {
      errors.value = [amountValidation.errorMessage!];
    }
  }

  // Minimum amount
  const minimumValidation = validateAmount(formData.minimum, 'Minimum amount');
  if (!minimumValidation.isValid) {
    errors.minimum = [minimumValidation.errorMessage!];
  }

  // Maximum amount
  const maximumValidation = validateAmount(formData.maximum, 'Maximum amount');
  if (!maximumValidation.isValid) {
    errors.maximum = [maximumValidation.errorMessage!];
  }

  // Min-Max relationship
  const minMaxValidation = validateMinMaxAmount(formData.minimum, formData.maximum);
  if (!minMaxValidation.isValid) {
    errors.maximum = [minMaxValidation.errorMessage!];
  }

  // Max usage
  const maxUsageValidation = validateUsageCount(formData.maxUsage, 'Max usage');
  if (!maxUsageValidation.isValid) {
    errors.maxUsage = [maxUsageValidation.errorMessage!];
  }

  // Expiry date
  const expiredAtValidation = validateFutureDate(formData.expiredAt, 'Expiry date');
  if (!expiredAtValidation.isValid) {
    errors.expiredAt = [expiredAtValidation.errorMessage!];
  }

  return errors;
};

// Edit category form validation
export const validateEditCategoryForm = (formData: {
  categoryName: string;
  categoryDescription: string;
}): FieldErrors => {
  const errors: FieldErrors = {};

  const nameValidation = validateCategoryName(formData.categoryName);
  if (!nameValidation.isValid) {
    errors.categoryName = [nameValidation.errorMessage!];
  }

  const descValidation = validateDescription(formData.categoryDescription, 'Description', 5, 500);
  if (!descValidation.isValid) {
    errors.categoryDescription = [descValidation.errorMessage!];
  }

  return errors;
};

// Create news form validation
export const validateCreateNewsForm = (formData: {
  newsTitle: string;
  newsDescription: string;
  newsContent: string;
  imageUrl: string;
  eventId?: string;
}): FieldErrors => {
  const errors: FieldErrors = {};

  // Title validation
  const titleValidation = validateNewsTitle(formData.newsTitle);
  if (!titleValidation.isValid) {
    errors.newsTitle = [titleValidation.errorMessage!];
  }

  // Description validation
  const descValidation = validateDescription(formData.newsDescription, 'Description', 10, 500);
  if (!descValidation.isValid) {
    errors.newsDescription = [descValidation.errorMessage!];
  }

  // Content validation
  const contentValidation = validateDescription(formData.newsContent, 'Content', 20, 5000);
  if (!contentValidation.isValid) {
    errors.newsContent = [contentValidation.errorMessage!];
  }

  // Image validation
  const imageValidation = validateRequired(formData.imageUrl, 'Image');
  if (!imageValidation.isValid) {
    errors.imageUrl = [imageValidation.errorMessage!];
  }

  // Event validation (optional field)
  if (formData.eventId) {
    const eventValidation = validateSelect(formData.eventId, 'Event');
    if (!eventValidation.isValid) {
      errors.eventId = [eventValidation.errorMessage!];
    }
  }

  return errors;
};

// ===== ENHANCED BACKEND ERROR PARSING FOR ADMIN =====

// Enhanced field mapping for admin forms
const mapAdminBackendFieldToFrontend = (backendField: string): string => {
  const fieldMapping: { [key: string]: string } = {
    // Discount Code fields
    'EventId': 'eventId',
    'Code': 'code',
    'DiscountType': 'discountType',
    'Value': 'value',
    'Minimum': 'minimum',
    'Maximum': 'maximum',
    'MaxUsage': 'maxUsage',
    'ExpiredAt': 'expiredAt',

    // Category fields
    'CategoryName': 'categoryName',
    'Description': 'description',

    // Event fields
    'EventName': 'eventName',
    'EventDescription': 'eventDescription',
    'StartAt': 'startAt',
    'EndAt': 'endAt',

    // News fields
    'Title': 'title',
    'Content': 'content',
    'Summary': 'summary',

    // User fields
    'Username': 'username',
    'Email': 'email',
    'Password': 'password',
    'FullName': 'fullName',
    'Phone': 'phone',
    'DateOfBirth': 'dateOfBirth',

    // Generic fields
    'Name': 'name',
    'Id': 'id',
  };

  return fieldMapping[backendField] || backendField.toLowerCase();
};

// Enhanced backend error parsing for admin forms
export const parseAdminBackendErrors = (error: unknown): BackendErrorResponse => {
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

  // Handle ASP.NET Core ValidationProblemDetails format
  if ('errors' in responseData && typeof (responseData as { errors?: unknown }).errors === 'object') {
    const errors = (responseData as { errors: Record<string, unknown> }).errors;
    const fieldErrors: FieldErrors = {};

    Object.entries(errors).forEach(([backendFieldName, messages]) => {
      const frontendFieldName = mapAdminBackendFieldToFrontend(backendFieldName);
      if (Array.isArray(messages)) {
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

  // Handle Admin API error format with enhanced field mapping
  if ('message' in responseData && typeof (responseData as { message?: unknown }).message === 'string') {
    const errorMessage = (responseData as { message: string }).message;
    const fieldErrors: FieldErrors = {};
    const generalErrors: string[] = [];

    const errors = errorMessage.split(';').map(err => err.trim()).filter(err => err.length > 0);

    errors.forEach(errorMsg => {
      let mapped = false;

      // Enhanced field mapping for admin forms
      const fieldMappings = [
        { keywords: ['event', 'eventid'], field: 'eventId' },
        { keywords: ['code', 'discount code'], field: 'code' },
        { keywords: ['value', 'discount value'], field: 'value' },
        { keywords: ['minimum', 'min'], field: 'minimum' },
        { keywords: ['maximum', 'max'], field: 'maximum' },
        { keywords: ['usage', 'maxusage', 'max usage'], field: 'maxUsage' },
        { keywords: ['expired', 'expiry', 'expiredat'], field: 'expiredAt' },
        { keywords: ['category', 'categoryname'], field: 'categoryName' },
        { keywords: ['title'], field: 'title' },
        { keywords: ['content'], field: 'content' },
        { keywords: ['summary'], field: 'summary' },
        { keywords: ['description'], field: 'description' },
        { keywords: ['username'], field: 'username' },
        { keywords: ['email'], field: 'email' },
        { keywords: ['password'], field: 'password' },
        { keywords: ['full name', 'fullname'], field: 'fullName' },
        { keywords: ['phone'], field: 'phone' },
        { keywords: ['date of birth', 'dateofbirth', 'age'], field: 'dateOfBirth' },
      ];

      for (const mapping of fieldMappings) {
        if (mapping.keywords.some(keyword => errorMsg.toLowerCase().includes(keyword))) {
          fieldErrors[mapping.field] = [errorMsg];
          mapped = true;
          break;
        }
      }

      if (!mapped) {
        generalErrors.push(errorMsg);
      }
    });

    return {
      fieldErrors,
      generalErrors,
    };
  }

  // Fallback
  const message = (responseData as { message?: string; title?: string }).message ||
    (responseData as { message?: string; title?: string }).title ||
    'An error occurred';
  return {
    fieldErrors: {},
    generalErrors: [message],
  };
};

