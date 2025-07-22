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
import {
  Select,
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
import { useTranslation } from 'react-i18next';

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
    value: 0,
    minimum: 0,
    maximum: 0,
    maxUsage: 1,
    expiredAt: '',
  });
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<{ eventId: string; eventName: string }[]>([]);

  const { t } = useTranslation();

  // Use validation hook
  const { validateForm, handleApiError, getFieldError, getErrorClass, clearFieldError } =
    useAdminValidation({
      showToastOnValidation: false, // Only show inline errors, no toast for validation
      showToastOnApiError: true, // Keep toast for API errors
    });

  useEffect(() => {
    // Gọi API lấy danh sách event khi mở modal
    if (open) {
      getApprovedEvents({ page: 1, pageSize: 100 })
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
      setForm((prev) => ({ ...prev, value: Number(value) }));
    },
    clearFieldError
  );

  const handleMinimumChange = createFieldChangeHandler(
    'minimum',
    (value: string) => {
      setForm((prev) => ({ ...prev, minimum: Number(value) }));
      // Clear maximum error as well since they're related
      clearFieldError('maximum');
    },
    clearFieldError
  );

  const handleMaximumChange = createFieldChangeHandler(
    'maximum',
    (value: string) => {
      setForm((prev) => ({ ...prev, maximum: Number(value) }));
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
      // Build payload, only include fields if > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = {
        eventId: form.eventId,
        code: form.code,
        discountType: form.discountType,
        value: form.value,
        expiredAt: form.expiredAt,
      };
      if (form.minimum > 0) payload.minimum = form.minimum;
      if (form.maximum > 0) payload.maximum = form.maximum;
      if (form.maxUsage > 0 && form.maxUsage !== 2147483647) payload.maxUsage = form.maxUsage;

      await createDiscountCode(payload);
      toast.success('Discount code created successfully!');
      setForm({
        eventId: '',
        code: '',
        discountType: 0,
        value: 0,
        minimum: 0,
        maximum: 0,
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
      <DialogContent className="max-w-md bg-white p-0 shadow-lg">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>{t('createDiscountCode')}</DialogTitle>
          </DialogHeader>
        </div>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto p-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">{t('event')}</label>
            <Select onValueChange={handleEventChange} disabled={loading} value={form.eventId}>
              <SelectTrigger
                className={getErrorClass(
                  'eventId',
                  'border-gray-200 w-full border px-3 py-2 rounded'
                )}
              >
                <SelectValue placeholder={t('selectEvent')} />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.eventId} value={event.eventId.toString()}>
                    {event.eventName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {getFieldError('eventId') && (
              <div className="text-red-400 text-sm mt-1 ml-2">{getFieldError('eventId')}</div>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">{t('code')}</label>
            <input
              className={getErrorClass('code', 'border px-3 py-2 rounded w-full')}
              name="code"
              value={form.code}
              onChange={handleCodeChange}
              disabled={loading}
              placeholder={t('enterCode')}
            />
            {getFieldError('code') && (
              <div className="text-red-400 text-sm mt-1 ml-2">{getFieldError('code')}</div>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">{t('discountType')}</label>
            <Select
              value={String(form.discountType)}
              onValueChange={handleDiscountTypeChange}
              disabled={loading}
            >
              <SelectTrigger
                className={getErrorClass(
                  'discountType',
                  'border-gray-200 border px-3 py-2 rounded w-full'
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">{t('percentage')}</SelectItem>
                <SelectItem value="1">{t('amount')}</SelectItem>
                <SelectItem value="3">{t('other')}</SelectItem>
              </SelectContent>
            </Select>
            {getFieldError('discountType') && (
              <div className="text-red-400 text-sm mt-1 ml-2">{getFieldError('discountType')}</div>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">{t('value')} {form.discountType === 0 ? '(%)' : '(VND)'}</label>
            <input
              className={getErrorClass('value', 'border px-3 py-2 rounded w-full')}
              name="value"
              type="number"
              value={form.value}
              onChange={handleValueChange}
              disabled={loading}
              min={0}
              max={form.discountType === 0 ? 100 : undefined}
              step={form.discountType === 0 ? 1 : 1000}
              placeholder={form.discountType === 0 ? t('enterPercentage') : t('enterAmount')}
            />
            {getFieldError('value') && (
              <div className="text-red-400 text-sm mt-1 ml-2">{getFieldError('value')}</div>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {t('minimumAmount')} (VND) <span className="text-gray-400">{t('optional')}</span>
            </label>
            <input
              className={getErrorClass('minimum', 'border px-3 py-2 rounded w-full')}
              name="minimum"
              type="number"
              value={form.minimum}
              onChange={handleMinimumChange}
              disabled={loading}
              min={0}
              step={1000}
              placeholder={t('minimumOrderAmount')}
            />
            {getFieldError('minimum') && (
              <div className="text-red-400 text-sm mt-1 ml-2">{getFieldError('minimum')}</div>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {t('maximumDiscount')} (VND) <span className="text-gray-400">{t('optional')}</span>
            </label>
            <input
              className={getErrorClass('maximum', 'border px-3 py-2 rounded w-full')}
              name="maximum"
              type="number"
              value={form.maximum}
              onChange={handleMaximumChange}
              disabled={loading}
              min={0}
              step={1000}
              placeholder={t('maximumDiscountAmount')}
            />
            {getFieldError('maximum') && (
              <div className="text-red-400 text-sm mt-1 ml-2">{getFieldError('maximum')}</div>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">{t('maxUsage')}</label>
            <input
              className={getErrorClass('maxUsage', 'border px-3 py-2 rounded w-full')}
              name="maxUsage"
              type="number"
              value={form.maxUsage}
              onChange={handleMaxUsageChange}
              disabled={loading}
              min={1}
              step={1}
              placeholder={t('maximumNumberOfUses')}
            />
            {getFieldError('maxUsage') && (
              <div className="text-red-400 text-sm mt-1 ml-2">{getFieldError('maxUsage')}</div>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">{t('expiredAt')}</label>
            <input
              className={getErrorClass('expiredAt', 'border px-3 py-2 rounded w-full')}
              name="expiredAt"
              type="datetime-local"
              value={form.expiredAt}
              onChange={handleExpiredAtChange}
              disabled={loading}
            />
            {getFieldError('expiredAt') && (
              <div className="text-red-400 text-sm mt-1 ml-2">{getFieldError('expiredAt')}</div>
            )}
          </div>
        </div>
        <div className="p-4 flex justify-end gap-2">
          <DialogFooter>
            <button
              className="border-2 border-red-500 bg-red-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-white hover:text-red-500 hover:border-red-500"
              onClick={onClose}
              disabled={loading}
              type="button"
            >
              {t('cancel')}
            </button>
            <button
              className="border-2 border-[#24b4fb] bg-[#24b4fb] rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-[#0071e2]"
              onClick={handleCreate}
              disabled={loading}
              type="button"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <FaSpinner className="animate-spin" />
                  {t('creating')}
                </div>
              ) : (
                t('create')
              )}
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDiscountCodeModal;
