import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getDiscountCodeById, updateDiscountCode } from '@/services/Event Manager/event.service';
import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';

interface DiscountCode {
  discountId: string;
  eventId: string;
  eventName: string;
  code: string;
  discountType: number;
  value: number;
  minimum: number;
  maximum: number;
  maxUsage: number;
  usedCount: number;
  expiredAt: string;
  isExpired: boolean;
}

export default function EditDiscountCode() {
  const { t } = useTranslation();
  const { getThemeClass } = useThemeClasses();
  const { discountId } = useParams<{ discountId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [discountCode, setDiscountCode] = useState<DiscountCode | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    discountType: 0,
    value: 0,
    minimum: 0,
    maximum: 0,
    maxUsage: 2147483647,
    expiredAt: '',
  });

  useEffect(() => {
    const fetchDiscountCode = async () => {
      if (!discountId) {
        toast.error(t('discountCodeIdRequired'));
        navigate('/event-manager/discount-codes');
        return;
      }

      try {
        const data = await getDiscountCodeById(discountId);
        if (!data) {
          toast.error(t('discountCodeNotFound'));
          navigate('/event-manager/discount-codes');
          return;
        }

        setDiscountCode(data);
        setFormData({
          code: data.code,
          discountType: data.discountType,
          value: data.value,
          minimum: data.minimum,
          maximum: data.maximum,
          maxUsage: data.maxUsage,
          expiredAt: format(parseISO(data.expiredAt), "yyyy-MM-dd'T'HH:mm"),
        });
      } catch (err) {
        console.error('Failed to load discount code:', err);
        toast.error(t('failedToLoadDiscountCode'));
        navigate('/event-manager/discount-codes');
      } finally {
        setLoading(false);
      }
    };

    fetchDiscountCode();
  }, [discountId, navigate, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!discountId || !discountCode) {
      toast.error(t('invalidDiscountCode'));
      return;
    }

    // Validation
    if (!formData.code.trim()) {
      toast.error(t('discountCodeRequired'));
      return;
    }
    if (formData.value <= 0) {
      toast.error(t('discountValueMustBePositive'));
      return;
    }
    if (formData.discountType === 0 && formData.value > 100) {
      toast.error(t('percentageCannotExceed100'));
      return;
    }
    if (!formData.expiredAt) {
      toast.error(t('expirationDateRequired'));
      return;
    }

    setLoading(true);

    try {
      const response = await updateDiscountCode(discountId, formData);
      if (response) {
        toast.success(t('discountCodeUpdated'));
        navigate('/event-manager/discount-codes');
      }
    } catch (err) {
      console.error('Failed to update discount code:', err);
      toast.error(t('failedToUpdateDiscountCode'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        className={cn(
          'w-full min-h-screen flex items-center justify-center',
          getThemeClass(
            'bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100',
            'bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e]'
          )
        )}
      >
        <div className={cn('text-xl', getThemeClass('text-blue-600', 'text-white'))}>
          {t('loading')}...
        </div>
      </div>
    );
  }

  if (!discountCode) {
    return (
      <div
        className={cn(
          'w-full min-h-screen flex items-center justify-center',
          getThemeClass(
            'bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100',
            'bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e]'
          )
        )}
      >
        <div className={cn('text-xl', getThemeClass('text-blue-600', 'text-white'))}>
          {t('discountCodeNotFound')}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'w-full min-h-screen flex items-center justify-center py-10',
        getThemeClass(
          'bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100',
          'bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e]'
        )
      )}
    >
      <div
        className={cn(
          'w-full max-w-2xl mx-auto rounded-2xl shadow-2xl p-8',
          getThemeClass('bg-white/95 border border-gray-200 shadow-lg', 'bg-[#2d0036]/80')
        )}
      >
        <h2
          className={cn(
            'text-2xl font-extrabold bg-clip-text text-transparent mb-6 uppercase tracking-wide text-center',
            getThemeClass(
              'bg-gradient-to-r from-blue-600 to-purple-600',
              'bg-gradient-to-r from-pink-400 to-yellow-400'
            )
          )}
        >
          {t('editDiscountCode')}
        </h2>

        <h3
          className={cn(
            'text-xl font-bold mb-6 text-center',
            getThemeClass('text-blue-600', 'text-yellow-300')
          )}
        >
          {t('forEvent')}:{' '}
          <span className={cn(getThemeClass('text-purple-600', 'text-pink-200'))}>
            {discountCode.eventName}
          </span>
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="code" className={cn(getThemeClass('text-gray-700', 'text-white'))}>
              {t('discountCode')}
            </Label>
            <Input
              id="code"
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className={cn(
                'border-2 focus:ring-2 focus:border-transparent transition-all duration-200',
                getThemeClass(
                  'bg-white border-blue-300 text-gray-900 placeholder-blue-500 focus:ring-blue-500',
                  'bg-[#1a0022]/80 border-pink-500/30 text-white placeholder-pink-400 focus:ring-pink-500'
                )
              )}
              placeholder="SUMMER20"
              required
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="discountType"
              className={cn(getThemeClass('text-gray-700', 'text-white'))}
            >
              {t('discountType')}
            </Label>
            <select
              id="discountType"
              value={formData.discountType}
              onChange={(e) => setFormData({ ...formData, discountType: Number(e.target.value) })}
              className={cn(
                'w-full p-3 rounded-xl border-2 focus:ring-2 focus:border-transparent transition-all duration-200',
                getThemeClass(
                  'bg-white border-blue-300 text-gray-900 focus:ring-blue-500',
                  'bg-[#1a0022]/80 border-pink-500/30 text-white focus:ring-pink-500'
                )
              )}
              required
            >
              <option value={0}>{t('percentage')}</option>
              <option value={1}>{t('fixedAmount')}</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="value" className={cn(getThemeClass('text-gray-700', 'text-white'))}>
              {formData.discountType === 0 ? t('percentage') : t('fixedAmount')}
            </Label>
            <Input
              id="value"
              type="number"
              min="0"
              step={formData.discountType === 0 ? '0.01' : '1'}
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
              className={cn(
                'border-2 focus:ring-2 focus:border-transparent transition-all duration-200',
                getThemeClass(
                  'bg-white border-blue-300 text-gray-900 placeholder-blue-500 focus:ring-blue-500',
                  'bg-[#1a0022]/80 border-pink-500/30 text-white placeholder-pink-400 focus:ring-pink-500'
                )
              )}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="minimum" className={cn(getThemeClass('text-gray-700', 'text-white'))}>
              {t('minOrderAmount')}
            </Label>
            <Input
              id="minimum"
              type="number"
              min="0"
              value={formData.minimum}
              onChange={(e) => setFormData({ ...formData, minimum: Number(e.target.value) })}
              className={cn(
                'border-2 focus:ring-2 focus:border-transparent transition-all duration-200',
                getThemeClass(
                  'bg-white border-blue-300 text-gray-900 placeholder-blue-500 focus:ring-blue-500',
                  'bg-[#1a0022]/80 border-pink-500/30 text-white placeholder-pink-400 focus:ring-pink-500'
                )
              )}
              required
            />
          </div>

          {formData.discountType === 0 && (
            <div className="space-y-2">
              <Label htmlFor="maximum" className={cn(getThemeClass('text-gray-700', 'text-white'))}>
                {t('maxDiscountAmount')}
              </Label>
              <Input
                id="maximum"
                type="number"
                min="0"
                value={formData.maximum}
                onChange={(e) => setFormData({ ...formData, maximum: Number(e.target.value) })}
                className={cn(
                  'border-2 focus:ring-2 focus:border-transparent transition-all duration-200',
                  getThemeClass(
                    'bg-white border-blue-300 text-gray-900 placeholder-blue-500 focus:ring-blue-500',
                    'bg-[#1a0022]/80 border-pink-500/30 text-white placeholder-pink-400 focus:ring-pink-500'
                  )
                )}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="maxUsage" className={cn(getThemeClass('text-gray-700', 'text-white'))}>
              {t('maxUsage')}
            </Label>
            <Input
              id="maxUsage"
              type="number"
              min="1"
              value={formData.maxUsage === 2147483647 ? '' : formData.maxUsage}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxUsage: e.target.value ? Number(e.target.value) : 2147483647,
                })
              }
              className={cn(
                'border-2 focus:ring-2 focus:border-transparent transition-all duration-200',
                getThemeClass(
                  'bg-white border-blue-300 text-gray-900 placeholder-blue-500 focus:ring-blue-500',
                  'bg-[#1a0022]/80 border-pink-500/30 text-white placeholder-pink-400 focus:ring-pink-500'
                )
              )}
            />
            <p className={cn('text-xs', getThemeClass('text-blue-600/70', 'text-pink-200'))}>
              {t('leaveBlankForUnlimited')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiredAt" className={cn(getThemeClass('text-gray-700', 'text-white'))}>
              {t('expirationDate')}
            </Label>
            <Input
              id="expiredAt"
              type="datetime-local"
              value={formData.expiredAt}
              onChange={(e) => setFormData({ ...formData, expiredAt: e.target.value })}
              className={cn(
                'border-2 focus:ring-2 focus:border-transparent transition-all duration-200',
                getThemeClass(
                  'bg-white border-blue-300 text-gray-900 focus:ring-blue-500 [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer',
                  'bg-[#1a0022]/80 border-pink-500/30 text-white focus:ring-pink-500 [&::-webkit-calendar-picker-indicator]:invert'
                )
              )}
              required
            />
            {discountCode.isExpired && (
              <p className={cn('text-xs', getThemeClass('text-red-600', 'text-red-400'))}>
                {t('currentlyExpired')}
              </p>
            )}
          </div>

          <div className="pt-4 flex gap-4">
            <Button
              type="submit"
              className={cn(
                'flex-1 text-white',
                getThemeClass(
                  'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600',
                  'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                )
              )}
              disabled={loading}
            >
              {loading ? t('updating') : t('updateDiscountCode')}
            </Button>
            <Button
              type="button"
              onClick={() => navigate('/event-manager/discount-codes')}
              className={cn(
                'flex-1 text-white',
                getThemeClass('bg-gray-600 hover:bg-gray-700', 'bg-gray-600 hover:bg-gray-700')
              )}
            >
              {t('cancel')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
