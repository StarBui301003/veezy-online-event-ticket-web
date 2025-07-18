# Admin Validation System Template Guide

## ✅ **Inline Errors Only + Selective API Toast**

Bây giờ admin forms đã được cấu hình để:
- ✅ **Chỉ hiện inline errors đỏ** (không có validation toast)
- ✅ **Toast selective cho API errors** (có thể customize)

## Basic Configuration

```typescript
const { validateForm, handleApiError, getFieldError, getErrorClass, clearFieldError } =
  useAdminValidation({
    showToastOnValidation: false, // Only show inline errors, no toast for validation
    showToastOnApiError: true, // Keep toast for API errors
  });
```

## Advanced Configuration - Selective API Error Toast

### Example 1: Only show toast for network errors
```typescript
const { validateForm, handleApiError, getFieldError, getErrorClass, clearFieldError } =
  useAdminValidation({
    showToastOnValidation: false,
    showToastOnApiError: true,
    shouldShowApiErrorToast: (error, generalErrors, fieldErrors) => {
      // Only show toast if it's a network error or server error
      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = (error as any).code;
        return errorCode >= 500; // Only server errors
      }
      return false; // Don't show toast for validation errors (400)
    }
  });
```

### Example 2: Only show toast for specific error messages
```typescript
const { validateForm, handleApiError, getFieldError, getErrorClass, clearFieldError } =
  useAdminValidation({
    showToastOnValidation: false,
    showToastOnApiError: true,
    shouldShowApiErrorToast: (error, generalErrors, fieldErrors) => {
      // Only show toast for specific critical errors
      const criticalMessages = [
        'server error',
        'database connection',
        'service unavailable',
        'timeout'
      ];
      
      return generalErrors.some(msg => 
        criticalMessages.some(critical => 
          msg.toLowerCase().includes(critical)
        )
      );
    }
  });
```

### Example 3: Never show toast for field validation errors
```typescript
const { validateForm, handleApiError, getFieldError, getErrorClass, clearFieldError } =
  useAdminValidation({
    showToastOnValidation: false,
    showToastOnApiError: true,
    shouldShowApiErrorToast: (error, generalErrors, fieldErrors) => {
      // Don't show toast if there are field errors (these show inline)
      if (Object.keys(fieldErrors).length > 0) {
        return false;
      }
      // Only show toast for general system errors
      return generalErrors.length > 0;
    }
  });
```

## Current Behavior

🎯 **Với cấu hình hiện tại:**
- ✅ Validation errors → **Chỉ hiện inline đỏ** (không toast)
- ✅ API field errors → **Hiện inline đỏ** + toast optional
- ✅ API general errors → **Hiện toast** (customizable)
- ✅ Success actions → **Hiện success toast**

## Template for New Admin Forms

```typescript
import { useState } from 'react';
import { toast } from 'react-toastify';
import { validateYourForm } from '@/utils/validation';
import {
  useAdminValidation,
  createFieldChangeHandler,
  createCustomChangeHandler,
} from '@/hooks/use-admin-validation';

export const YourAdminModal = ({ open, onClose, onCreated }: Props) => {
  const [form, setForm] = useState({
    field1: '',
    field2: '',
  });
  const [loading, setLoading] = useState(false);

  // Use validation hook - inline errors only, selective API toast
  const { validateForm, handleApiError, getFieldError, getErrorClass, clearFieldError } =
    useAdminValidation({
      showToastOnValidation: false, // Only show inline errors
      showToastOnApiError: true, // Keep toast for API errors
      // Optional: Add custom filter for API errors
      shouldShowApiErrorToast: (error, generalErrors, fieldErrors) => {
        // Customize which API errors show toast
        return generalErrors.length > 0 && Object.keys(fieldErrors).length === 0;
      }
    });

  // Field change handlers
  const handleField1Change = createFieldChangeHandler(
    'field1',
    (value: string) => setForm(prev => ({ ...prev, field1: value })),
    clearFieldError
  );

  const handleSubmit = async () => {
    // Validate form - only shows inline errors
    const isValid = validateForm(form, validateYourForm);
    if (!isValid) return;

    setLoading(true);
    try {
      await yourApiCall(form);
      toast.success('Success message'); // Always show success
      onClose();
      if (onCreated) onCreated();
    } catch (error: unknown) {
      handleApiError(error); // Uses selective toast logic
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <div>
          <input
            className={getErrorClass('field1', 'border px-3 py-2 rounded w-full')}
            value={form.field1}
            onChange={handleField1Change}
            disabled={loading}
          />
          {getFieldError('field1') && (
            <div className="text-red-400 text-sm mt-1 ml-2 text-left">
              {getFieldError('field1')}
            </div>
          )}
        </div>
        <button onClick={handleSubmit}>Submit</button>
      </DialogContent>
    </Dialog>
  );
};
```

