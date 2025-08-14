import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { createDiscountCode } from '@/services/Admin/discountCode.service';
import { getApprovedEvents } from '@/services/Admin/event.service';
import { toast } from 'react-toastify';
import type { DiscountCodeCreateInput } from '@/types/Admin/discountCode';
import Select from 'react-select';
import {
  Select as UISelect,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { FaSpinner } from 'react-icons/fa';
import { validateDiscountCodeForm } from '@/utils/validation';
import {
  useAdminValidation,
  createFieldChangeHandler,
  createCustomChangeHandler,
} from '@/hooks/use-admin-validation';
import { formatCurrency } from '@/utils/format';
import { useThemeClasses } from '@/hooks/useThemeClasses';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export const CreateDiscountCodeModal = ({ open, onClose, onCreated }: Props) => {
  const [form, setForm] = useState<DiscountCodeCreateInput>({
    eventId: '',
    code: '',
    discountType: 0,
    value: null,
    minimum: null,
    maximum: null,
    maxUsage: 1,
    expiredAt: '',
  });
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<{ eventId: string; eventName: string }[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(() =>
    document.documentElement.classList.contains('dark')
  );

  // Use theme classes
  const { getProfileInputClass } = useThemeClasses();

  // Listen for theme changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          setIsDarkMode(document.documentElement.classList.contains('dark'));
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // Use validation hook
  const { validateForm, handleApiError, getFieldError, getErrorClass, clearFieldError } =
    useAdminValidation({
      showToastOnValidation: false, // Only show inline errors, no toast for validation
      showToastOnApiError: true, // Keep toast for API errors
    });

  useEffect(() => {
    // Gọi API lấy danh sách event khi mở modal
    if (open) {
      getApprovedEvents({ page: 1, pageSize: 5 })
        .then((res) => {
          setEvents(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            res.data.items.map((e: any) => ({
              eventId: e.eventId,
              eventName: e.eventName,
            }))
          );
        })
        .catch(() => setEvents([]));
    }
  }, [open]);

  // Field change handlers with error clearing
  const handleEventChange = createCustomChangeHandler(
    'eventId',
    (value: string) => {
      setForm((prev) => ({ ...prev, eventId: value }));
    },
    clearFieldError
  );

  const handleCodeChange = createFieldChangeHandler(
    'code',
    (value: string) => {
      setForm((prev) => ({ ...prev, code: value }));
    },
    clearFieldError
  );

  const handleDiscountTypeChange = createCustomChangeHandler(
    'discountType',
    (value: string) => {
      setForm((prev) => ({ ...prev, discountType: Number(value) }));
    },
    clearFieldError
  );

  const handleValueChange = createFieldChangeHandler(
    'value',
    (value: string) => {
      setForm((prev) => ({ ...prev, value: value === '' ? null : Number(value) }));
    },
    clearFieldError
  );

  const handleMinimumChange = createFieldChangeHandler(
    'minimum',
    (value: string) => {
      setForm((prev) => ({ ...prev, minimum: value === '' ? null : Number(value) }));
      // Clear maximum error as well since they're related
      clearFieldError('maximum');
    },
    clearFieldError
  );

  const handleMaximumChange = createFieldChangeHandler(
    'maximum',
    (value: string) => {
      setForm((prev) => ({ ...prev, maximum: value === '' ? null : Number(value) }));
      // Clear minimum error as well since they're related
      clearFieldError('minimum');
    },
    clearFieldError
  );

  const handleMaxUsageChange = createFieldChangeHandler(
    'maxUsage',
    (value: string) => {
      setForm((prev) => ({ ...prev, maxUsage: Number(value) }));
    },
    clearFieldError
  );

  const handleExpiredAtChange = createFieldChangeHandler(
    'expiredAt',
    (value: string) => {
      setForm((prev) => ({ ...prev, expiredAt: value }));
    },
    clearFieldError
  );

  const handleCreate = async () => {
    // Validate form using comprehensive validation
    const isValid = validateForm(form, validateDiscountCodeForm);

    if (!isValid) {
      return;
    }

    setLoading(true);
    try {
      // Build payload, only include fields if they have values
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = {
        eventId: form.eventId,
        code: form.code,
        discountType: form.discountType,
        value: form.value,
        expiredAt: form.expiredAt,
      };
      if (form.minimum !== null && form.minimum !== undefined) payload.minimum = form.minimum;
      if (form.maximum !== null && form.maximum !== undefined) payload.maximum = form.maximum;
      if (form.maxUsage > 0 && form.maxUsage !== 2147483647) payload.maxUsage = form.maxUsage;

      await createDiscountCode(payload);
      toast.success('Discount code created successfully!');
      setForm({
        eventId: '',
        code: '',
        discountType: 0,
        value: null,
        minimum: null,
        maximum: null,
        maxUsage: 1,
        expiredAt: '',
      });
      onClose();
      if (onCreated) onCreated(); // Only call after success
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      handleApiError(err, 'Failed to create discount code!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white dark:bg-gray-800 p-0 shadow-lg rounded-xl border-0 dark:border-0">
        <div className="p-6 border-b border-gray-200 dark:border-gray-600">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800 dark:text-gray-200">
              Create Discount Code
            </DialogTitle>
          </DialogHeader>
        </div>
        <div className="p-6 space-y-6 max-h-[50vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Event
            </label>
            <Select
              options={events.map((event) => ({
                value: event.eventId,
                label: event.eventName,
              }))}
              value={events
                .map((event) => ({
                  value: event.eventId,
                  label: event.eventName,
                }))
                .find((option) => option.value === form.eventId)}
              onChange={(selectedOption) => handleEventChange(selectedOption?.value || '')}
              placeholder="Select event"
              isDisabled={loading}
              isSearchable={true}
              classNamePrefix="react-select"
              styles={{
                control: (provided, state) => ({
                  ...provided,
                  backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                  borderColor: getFieldError('eventId')
                    ? '#ef4444'
                    : state.isFocused
                    ? '#3b82f6'
                    : isDarkMode
                    ? '#4b5563'
                    : '#d1d5db',
                  '&:hover': {
                    borderColor: getFieldError('eventId')
                      ? '#ef4444'
                      : isDarkMode
                      ? '#6b7280'
                      : '#9ca3af',
                  },
                  minHeight: '40px',
                  borderRadius: '6px',
                  boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
                }),
                menu: (provided) => ({
                  ...provided,
                  backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                  border: `1px solid ${isDarkMode ? '#4b5563' : '#d1d5db'}`,
                  borderRadius: '6px',
                  boxShadow:
                    '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  zIndex: 9999,
                }),
                option: (provided, state) => ({
                  ...provided,
                  backgroundColor: state.isSelected
                    ? '#3b82f6'
                    : state.isFocused
                    ? isDarkMode
                      ? '#374151'
                      : '#f3f4f6'
                    : 'transparent',
                  color: state.isSelected ? 'white' : isDarkMode ? '#f9fafb' : '#111827',
                  '&:hover': {
                    backgroundColor: state.isSelected
                      ? '#3b82f6'
                      : isDarkMode
                      ? '#374151'
                      : '#f3f4f6',
                  },
                }),
                singleValue: (provided) => ({
                  ...provided,
                  color: isDarkMode ? '#f9fafb' : '#111827',
                }),
                input: (provided) => ({
                  ...provided,
                  color: isDarkMode ? '#f9fafb' : '#111827',
                }),
                placeholder: (provided) => ({
                  ...provided,
                  color: isDarkMode ? '#9ca3af' : '#6b7280',
                }),
                menuList: (provided) => ({
                  ...provided,
                  backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                }),
                noOptionsMessage: (provided) => ({
                  ...provided,
                  color: isDarkMode ? '#9ca3af' : '#6b7280',
                }),
                loadingMessage: (provided) => ({
                  ...provided,
                  color: isDarkMode ? '#9ca3af' : '#6b7280',
                }),
              }}
            />
            {getFieldError('eventId') && (
              <div className="text-red-400 text-sm mt-1 ml-2">{getFieldError('eventId')}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Code
            </label>
            <input
              className={getErrorClass(
                'code',
                `border rounded px-3 py-2 w-full transition-colors ${getProfileInputClass()}`
              )}
              name="code"
              value={form.code}
              onChange={handleCodeChange}
              disabled={loading}
              placeholder="Enter code (e.g., SAVE20)"
            />
            {getFieldError('code') && (
              <div className="text-red-400 text-sm mt-1 ml-2">{getFieldError('code')}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Discount Type
            </label>
            <UISelect
              value={String(form.discountType)}
              onValueChange={handleDiscountTypeChange}
              disabled={loading}
            >
              <SelectTrigger
                className={getErrorClass(
                  'discountType',
                  'border rounded px-3 py-2 w-full transition-colors text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
                <SelectItem
                  value="0"
                  className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Percentage
                </SelectItem>
                <SelectItem
                  value="1"
                  className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Amount
                </SelectItem>
                <SelectItem
                  value="3"
                  className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Other
                </SelectItem>
              </SelectContent>
            </UISelect>
            {getFieldError('discountType') && (
              <div className="text-red-400 text-sm mt-1 ml-2">{getFieldError('discountType')}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Value {form.discountType === 0 ? '(%)' : '(VND)'}
            </label>
            <input
              type="number"
              className={getErrorClass(
                'value',
                'border rounded px-3 py-2 w-full transition-colors text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
              )}
              name="value"
              value={form.value || ''}
              onChange={handleValueChange}
              disabled={loading}
              min={0}
              step={form.discountType === 0 ? 0.01 : 1000}
              placeholder={
                form.discountType === 0
                  ? 'Enter percentage (0-100)'
                  : `Enter amount (e.g., ${formatCurrency(50000)})`
              }
            />
            {getFieldError('value') && (
              <div className="text-red-400 text-sm mt-1 ml-2">{getFieldError('value')}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Minimum Amount (VND){' '}
              <span className="text-gray-400 dark:text-gray-500">(optional)</span>
            </label>
            <input
              type="number"
              className={getErrorClass(
                'minimum',
                'border rounded px-3 py-2 w-full transition-colors text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
              )}
              name="minimum"
              value={form.minimum || ''}
              onChange={handleMinimumChange}
              disabled={loading}
              min={0}
              step={1000}
              placeholder={`Enter minimum amount (e.g., ${formatCurrency(100000)})`}
            />
            {getFieldError('minimum') && (
              <div className="text-red-400 text-sm mt-1 ml-2">{getFieldError('minimum')}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Maximum Discount (VND){' '}
              <span className="text-gray-400 dark:text-gray-500">(optional)</span>
            </label>
            <input
              type="number"
              className={getErrorClass(
                'maximum',
                'border rounded px-3 py-2 w-full transition-colors text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
              )}
              name="maximum"
              value={form.maximum || ''}
              onChange={handleMaximumChange}
              disabled={loading}
              min={0}
              step={1000}
              placeholder={`Enter maximum discount amount (e.g., ${formatCurrency(50000)})`}
            />
            {getFieldError('maximum') && (
              <div className="text-red-400 text-sm mt-1 ml-2">{getFieldError('maximum')}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Max Usage
            </label>
            <input
              type="number"
              className={getErrorClass(
                'maxUsage',
                'border rounded px-3 py-2 w-full transition-colors text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
              )}
              name="maxUsage"
              value={form.maxUsage}
              onChange={handleMaxUsageChange}
              disabled={loading}
              min={1}
              step={1}
              placeholder="Enter maximum usage count"
            />
            {getFieldError('maxUsage') && (
              <div className="text-red-400 text-sm mt-1 ml-2">{getFieldError('maxUsage')}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Expired At
            </label>
            <input
              type="datetime-local"
              className={getErrorClass(
                'expiredAt',
                'border rounded px-3 py-2 w-full transition-colors text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
              )}
              name="expiredAt"
              value={form.expiredAt}
              onChange={handleExpiredAtChange}
              disabled={loading}
            />
            {getFieldError('expiredAt') && (
              <div className="text-red-400 text-sm mt-1 ml-2">{getFieldError('expiredAt')}</div>
            )}
          </div>
        </div>
        <div className="p-4">
          <DialogFooter>
            <button
              className="border-2 border-red-500 bg-red-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-white hover:text-red-500 hover:border-red-500 mr-2"
              onClick={onClose}
              disabled={loading}
              type="button"
            >
              Cancel
            </button>
            <button
              className="border-2 border-[#24b4fb] bg-[#24b4fb] rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-[#0071e2] flex items-center justify-center gap-2"
              onClick={handleCreate}
              disabled={loading}
              type="button"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDiscountCodeModal;
