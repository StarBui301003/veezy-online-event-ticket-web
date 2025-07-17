import { useState, ChangeEvent } from 'react';
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
import {
  validateDiscountCode,
  validatePositiveNumber,
  validateFutureDate,
} from '@/utils/validation';
import { toast } from 'react-toastify';

interface Props {
  discount: (DiscountCodeUpdateInput & { discountId: string }) | null;
  onClose: () => void;
  onUpdated?: () => void;
}

export const EditDiscountCodeModal = ({ discount, onClose, onUpdated }: Props) => {
  const [form, setForm] = useState<DiscountCodeUpdateInput>({
    code: discount.code,
    discountType: discount.discountType,
    value: discount.value,
    minimum: discount.minimum,
    maximum: discount.maximum,
    maxUsage: discount.maxUsage,
    expiredAt: discount.expiredAt,
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : name === 'discountType' ? Number(value) : value,
    }));
  };

  const handleEdit = async () => {
    // Validation
    const codeValidation = validateDiscountCode(form.code);
    if (!codeValidation.isValid) {
      toast.error(codeValidation.errorMessage!);
      return;
    }

    const valueValidation = validatePositiveNumber(form.value, 'Value');
    if (!valueValidation.isValid) {
      toast.error(valueValidation.errorMessage!);
      return;
    }

    const expiredAtValidation = validateFutureDate(form.expiredAt, 'Expired At');
    if (!expiredAtValidation.isValid) {
      toast.error(expiredAtValidation.errorMessage!);
      return;
    }

    if (form.minimum > 0) {
      const minValidation = validatePositiveNumber(form.minimum, 'Minimum');
      if (!minValidation.isValid) {
        toast.error(minValidation.errorMessage!);
        return;
      }
    }

    if (form.maximum > 0) {
      const maxValidation = validatePositiveNumber(form.maximum, 'Maximum');
      if (!maxValidation.isValid) {
        toast.error(maxValidation.errorMessage!);
        return;
      }

      if (form.minimum > 0 && form.maximum <= form.minimum) {
        toast.error('Maximum must be greater than minimum!');
        return;
      }
    }

    const maxUsageValidation = validatePositiveNumber(form.maxUsage, 'Max Usage');
    if (!maxUsageValidation.isValid) {
      toast.error(maxUsageValidation.errorMessage!);
      return;
    }

    setLoading(true);
    try {
      // Gửi toàn bộ trường về BE
      await updateDiscountCode(discount.discountId, {
        code: form.code,
        discountType: form.discountType,
        value: form.value,
        minimum: form.minimum,
        maximum: form.maximum,
        maxUsage: form.maxUsage,
        expiredAt: form.expiredAt,
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      onUpdated && onUpdated();
      onClose();
    } finally {
      setLoading(false);
    }
  };

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
              name="code"
              className="border rounded px-2 py-1 w-full"
              value={form.code}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Discount Type</label>
            <Select
              value={String(form.discountType)}
              onValueChange={(val) => setForm((prev) => ({ ...prev, discountType: Number(val) }))}
            >
              <SelectTrigger className=" border-gray-200 border rounded px-2 py-1 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Percentage</SelectItem>
                <SelectItem value="1">Amount</SelectItem>
                <SelectItem value="3">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Value</label>
            <input
              name="value"
              type="number"
              className="border rounded px-2 py-1 w-full"
              value={form.value}
              onChange={handleInputChange}
              min={0}
              step={0.01}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Minimum</label>
            <input
              name="minimum"
              type="number"
              className="border rounded px-2 py-1 w-full"
              value={form.minimum}
              onChange={handleInputChange}
              min={0}
              step={0.01}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Maximum</label>
            <input
              name="maximum"
              type="number"
              className="border rounded px-2 py-1 w-full"
              value={form.maximum}
              onChange={handleInputChange}
              min={0}
              step={0.01}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Max Usage</label>
            <input
              name="maxUsage"
              type="number"
              className="border rounded px-2 py-1 w-full"
              value={form.maxUsage}
              onChange={handleInputChange}
              min={1}
              step={1}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Expired At</label>
            <input
              name="expiredAt"
              type="datetime-local"
              className="border rounded px-2 py-1 w-full"
              value={form.expiredAt}
              onChange={handleInputChange}
            />
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
              className="border-2 border-[#24b4fb] bg-[#24b4fb] rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-[#0071e2]"
              onClick={handleEdit}
              disabled={loading}
              type="button"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <FaSpinner className="animate-spin" />
                  Editing...
                </div>
              ) : (
                'Edit'
              )}
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditDiscountCodeModal;
