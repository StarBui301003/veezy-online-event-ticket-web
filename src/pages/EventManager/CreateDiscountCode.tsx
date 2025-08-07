import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventById } from '@/services/Event Manager/event.service';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import instance from '@/services/axios.customize';
import { AxiosError } from 'axios';
import { useTranslation } from 'react-i18next';
import { connectEventHub, onEvent } from '@/services/signalr.service';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';

interface Event {
  eventId: string;
  eventName: string;
}

interface CreateDiscountCodeData {
  eventId: string;
  code: string;
  discountType: number;
  value: number;
  minimum: number;
  maximum: number;
  maxUsage: number;
  expiredAt: string;
}

export default function CreateDiscountCode() {
  const { t } = useTranslation();
  const { getThemeClass } = useThemeClasses();
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<CreateDiscountCodeData>({
    eventId: eventId || '',
    code: '',
    discountType: 0,
    value: 0,
    minimum: 0,
    maximum: 0,
    maxUsage: 2147483647,
    expiredAt: '',
  });

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) {
        toast.error(t('eventIdRequired'));
        navigate('/event-manager/discount-codes');
        return;
      }

      try {
        const data = await getEventById(eventId);
        if (!data) {
          toast.error(t('eventNotFound'));
          navigate('/event-manager/discount-codes');
          return;
        }
        setEvent(data);
      } catch (err) {
        console.error('Failed to load event:', err);
        toast.error(t('failedToLoadEventDetails'));
        navigate('/event-manager/discount-codes');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, navigate, t]);

  // Setup realtime connection for discount code creation
  useEffect(() => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    connectEventHub(token || undefined);

    // Listen for discount code creation confirmations
    onEvent('DiscountCodeCreated', (data: any) => {
      if (data.eventId === eventId) {
        toast.success('Mã giảm giá đã được tạo thành công!');
        navigate(`/event-manager/discount-codes`);
      }
    });

    onEvent('DiscountCodeCreateFailed', (data: any) => {
      if (data.eventId === eventId) {
        toast.error('Không thể tạo mã giảm giá. Vui lòng thử lại!');
      }
    });
  }, [eventId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data
    if (!formData.code.trim()) {
      toast.error(t('discountCodeRequired'));
      return;
    }
    if (formData.value <= 0) {
      toast.error(t('discountValueMustBeGreaterThan0'));
      return;
    }
    if (formData.discountType === 0 && formData.value > 100) {
      toast.error(t('percentageDiscountCannotExceed100'));
      return;
    }
    if (!formData.expiredAt) {
      toast.error(t('expirationDateRequired'));
      return;
    }

    setLoading(true);

    try {
      const response = await instance.post('/api/DiscountCode', formData);
      if (response.data) {
        toast.success(t('discountCodeCreatedSuccessfully'));
        navigate('/event-manager/discount-codes');
      } else {
        throw new Error('No response data');
      }
    } catch (err) {
      console.error('Failed to create discount code:', err);
      if (err instanceof AxiosError) {
        if (err.response?.status === 404) {
          toast.error(t('eventNotFound'));
        } else if (err.response?.status === 400) {
          toast.error(err.response.data?.message || t('invalidDiscountCodeData'));
        } else {
          toast.error(t('failedToCreateDiscountCode'));
        }
      } else {
        toast.error(t('anUnexpectedErrorOccurred'));
      }
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
          {t('loading')}
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
          {t('createDiscountCode')}
        </h2>
        {event && (
          <h3
            className={cn(
              'text-xl font-bold mb-6 text-center',
              getThemeClass('text-blue-600', 'text-yellow-300')
            )}
          >
            {t('forEvent')}:{' '}
            <span className={cn(getThemeClass('text-purple-600', 'text-pink-200'))}>
              {event.eventName}
            </span>
          </h3>
        )}

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
              placeholder={t('enterDiscountCode')}
              required
            />
            <p className={cn('text-xs', getThemeClass('text-blue-600/70', 'text-pink-200/70'))}>
              {t('enterUniqueCodeForYourDiscount')}
            </p>
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
              <option value={0}>{t('percentageDiscount')}</option>
              <option value={1}>{t('fixedAmountDiscount')}</option>
            </select>
            <p className={cn('text-xs', getThemeClass('text-blue-600/70', 'text-pink-200/70'))}>
              {formData.discountType === 0
                ? t('discountWillBeAppliedAsAPercentageOfTheTotalAmount')
                : t('discountWillBeAppliedAsAFixedAmount')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="value" className={cn(getThemeClass('text-gray-700', 'text-white'))}>
              {formData.discountType === 0 ? t('discountPercentage') : t('discountAmount')}
            </Label>
            <Input
              id="value"
              type="number"
              min="0"
              step={formData.discountType === 0 ? '0.01' : '1'}
              value={formData.value || ''}
              onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
              className={cn(
                'border-2 focus:ring-2 focus:border-transparent transition-all duration-200',
                getThemeClass(
                  'bg-white border-blue-300 text-gray-900 placeholder-blue-500 focus:ring-blue-500',
                  'bg-[#1a0022]/80 border-pink-500/30 text-white placeholder-pink-400 focus:ring-pink-500'
                )
              )}
              placeholder={
                formData.discountType === 0 ? t('enterPercentage0100') : t('enterAmount')
              }
              required
            />
            <p className={cn('text-xs', getThemeClass('text-blue-600/70', 'text-pink-200/70'))}>
              {formData.discountType === 0
                ? t('enterAValueBetween0And100')
                : t('enterTheFixedAmountToBeDiscounted')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="minimum" className={cn(getThemeClass('text-gray-700', 'text-white'))}>
              {t('minimumOrderAmount')}
            </Label>
            <Input
              id="minimum"
              type="number"
              min="0"
              value={formData.minimum || ''}
              onChange={(e) => setFormData({ ...formData, minimum: Number(e.target.value) })}
              className={cn(
                'border-2 focus:ring-2 focus:border-transparent transition-all duration-200',
                getThemeClass(
                  'bg-white border-blue-300 text-gray-900 placeholder-blue-500 focus:ring-blue-500',
                  'bg-[#1a0022]/80 border-pink-500/30 text-white placeholder-pink-400 focus:ring-pink-500'
                )
              )}
              placeholder={t('enterMinimumOrderAmount')}
              required
            />
            <p className={cn('text-xs', getThemeClass('text-blue-600/70', 'text-pink-200/70'))}>
              {t('minimumOrderAmountRequiredToApplyThisDiscount')}
            </p>
          </div>

          {formData.discountType === 0 && (
            <div className="space-y-2">
              <Label htmlFor="maximum" className={cn(getThemeClass('text-gray-700', 'text-white'))}>
                {t('maximumDiscountAmount')}
              </Label>
              <Input
                id="maximum"
                type="number"
                min="0"
                value={formData.maximum || ''}
                onChange={(e) => setFormData({ ...formData, maximum: Number(e.target.value) })}
                className={cn(
                  'border-2 focus:ring-2 focus:border-transparent transition-all duration-200',
                  getThemeClass(
                    'bg-white border-blue-300 text-gray-900 placeholder-blue-500 focus:ring-blue-500',
                    'bg-[#1a0022]/80 border-pink-500/30 text-white placeholder-pink-400 focus:ring-pink-500'
                  )
                )}
                placeholder={t('enterMaximumDiscountAmount0ForNoLimit')}
                required
              />
              <p className={cn('text-xs', getThemeClass('text-blue-600/70', 'text-pink-200/70'))}>
                {t('maximumAmountThatCanBeDiscounted0ForNoLimit')}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="maxUsage" className={cn(getThemeClass('text-gray-700', 'text-white'))}>
              {t('maximumUsage')}
            </Label>
            <Input
              id="maxUsage"
              type="number"
              min="1"
              value={formData.maxUsage || ''}
              onChange={(e) => setFormData({ ...formData, maxUsage: Number(e.target.value) })}
              className={cn(
                'border-2 focus:ring-2 focus:border-transparent transition-all duration-200',
                getThemeClass(
                  'bg-white border-blue-300 text-gray-900 placeholder-blue-500 focus:ring-blue-500',
                  'bg-[#1a0022]/80 border-pink-500/30 text-white placeholder-pink-400 focus:ring-pink-500'
                )
              )}
              placeholder={t('enterMaximumUsageCount')}
              required
            />
            <p className={cn('text-xs', getThemeClass('text-blue-600/70', 'text-pink-200/70'))}>
              {t('maximumNumberOfTimesThisCodeCanBeUsed')}
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
                  'bg-[#1a0022]/80 border-pink-500/30 text-white focus:ring-pink-500 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer'
                )
              )}
              required
            />
            <p className={cn('text-xs', getThemeClass('text-blue-600/70', 'text-pink-200/70'))}>
              {t('whenThisDiscountCodeWillExpire')}
            </p>
          </div>

          <div className="flex gap-4 pt-4">
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
              {loading ? t('creating') : t('createDiscountCode')}
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
