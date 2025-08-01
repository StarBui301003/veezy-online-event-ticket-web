import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { updateDiscountCode } from '@/services/Admin/discountCode.service';
import type { DiscountCodeUpdateInput } from '@/types/Admin/discountCode';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { FaSpinner } from 'react-icons/fa';
import { validateEditDiscountCodeForm } from '@/utils/validation';
import {
  useAdminValidation,
  createFieldChangeHandler,
  createCustomChangeHandler,
} from '@/hooks/use-admin-validation';
import { toast } from 'react-toastify';
import { formatCurrency } from '@/utils/format';

interface Props {
  discount: (DiscountCodeUpdateInput & { discountId: string }) | null;
  onClose: () => void;
  onUpdated?: () => void;
}

export const EditDiscountCodeModal = ({ discount, onClose, onUpdated }: Props) => {
  const [form, setForm] = useState<DiscountCodeUpdateInput>({
    code: discount?.code || '',
    discountType: discount?.discountType || 0,
    value: discount?.value || null,
    minimum: discount?.minimum || null,
    maximum: discount?.maximum || null,
    maxUsage: discount?.maxUsage || 1,
    expiredAt: discount?.expiredAt || '',
  });
  const [loading, setLoading] = useState(false);

  // Use validation hook
  const { validateForm, handleApiError, getFieldError, getErrorClass, clearFieldError } =
    useAdminValidation({
      showToastOnValidation: false, // Only show inline errors, no toast for validation
      showToastOnApiError: true, // Keep toast for API errors
    });

  // Field change handlers with error clearing
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

  const handleEdit = async () => {
    // Validate form using comprehensive validation
    const isValid = validateForm(form, validateEditDiscountCodeForm);

    if (!isValid) {
      return;
    }

    setLoading(true);
    try {
      await updateDiscountCode(discount!.discountId, form);
      toast.success('Discount code updated successfully!');
      if (onUpdated) onUpdated();
      onClose();
    } catch (error: unknown) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  if (!discount) return null;

  return (
    <Dialog open={!!discount} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white p-0 shadow-lg">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>Edit Discount Code</DialogTitle>
          </DialogHeader>
        </div>
        <div className="space-y-3 p-4 pt-0">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Code</label>
            <input
              className={getErrorClass('code', 'border rounded px-2 py-1 w-full')}
              value={form.code}
              onChange={handleCodeChange}
              disabled={loading}
              placeholder="Enter discount code"
            />
            {getFieldError('code') && (
              <div className="text-red-400 text-sm mt-1 ml-2 text-left">
                {getFieldError('code')}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Discount Type</label>
            <Select
              value={String(form.discountType)}
              onValueChange={handleDiscountTypeChange}
              disabled={loading}
            >
              <SelectTrigger
                className={getErrorClass(
                  'discountType',
                  'border-gray-200 border rounded px-2 py-1 w-full'
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Percentage</SelectItem>
                <SelectItem value="1">Amount</SelectItem>
                <SelectItem value="3">Other</SelectItem>
              </SelectContent>
            </Select>
            {getFieldError('discountType') && (
              <div className="text-red-400 text-sm mt-1 ml-2 text-left">
                {getFieldError('discountType')}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Value {form.discountType === 0 ? '(%)' : '(VND)'}
            </label>
            <input
              type="number"
              className={getErrorClass('value', 'border rounded px-2 py-1 w-full')}
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
              <div className="text-red-400 text-sm mt-1 ml-2 text-left">
                {getFieldError('value')}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Minimum Amount (VND) <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="number"
              className={getErrorClass('minimum', 'border rounded px-2 py-1 w-full')}
              value={form.minimum || ''}
              onChange={handleMinimumChange}
              disabled={loading}
              min={0}
              step={1000}
              placeholder={`Enter minimum amount (e.g., ${formatCurrency(100000)})`}
            />
            {getFieldError('minimum') && (
              <div className="text-red-400 text-sm mt-1 ml-2 text-left">
                {getFieldError('minimum')}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Maximum Discount (VND) <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="number"
              className={getErrorClass('maximum', 'border rounded px-2 py-1 w-full')}
              value={form.maximum || ''}
              onChange={handleMaximumChange}
              disabled={loading}
              min={0}
              step={1000}
              placeholder={`Enter maximum discount amount (e.g., ${formatCurrency(50000)})`}
            />
            {getFieldError('maximum') && (
              <div className="text-red-400 text-sm mt-1 ml-2 text-left">
                {getFieldError('maximum')}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Max Usage</label>
            <input
              type="number"
              className={getErrorClass('maxUsage', 'border rounded px-2 py-1 w-full')}
              value={form.maxUsage}
              onChange={handleMaxUsageChange}
              disabled={loading}
              min={1}
              step={1}
              placeholder="Enter maximum usage count"
            />
            {getFieldError('maxUsage') && (
              <div className="text-red-400 text-sm mt-1 ml-2 text-left">
                {getFieldError('maxUsage')}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Expired At</label>
            <input
              type="datetime-local"
              className={getErrorClass('expiredAt', 'border rounded px-2 py-1 w-full')}
              value={form.expiredAt}
              onChange={handleExpiredAtChange}
              disabled={loading}
            />
            {getFieldError('expiredAt') && (
              <div className="text-red-400 text-sm mt-1 ml-2 text-left">
                {getFieldError('expiredAt')}
              </div>
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
              onClick={handleEdit}
              disabled={loading}
              type="button"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Updating...
                </>
              ) : (
                'Update'
              )}
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditDiscountCodeModal;
