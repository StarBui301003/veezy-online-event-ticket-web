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
import { onNotification } from '@/services/signalr.service';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';
import { FieldErrors, validateDiscountCodeForm  } from '@/utils/validation';
import 'react-datepicker/dist/react-datepicker.css';

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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formData, setFormData] = useState<CreateDiscountCodeData>({
    eventId: eventId || '',
    code: '',
    discountType: 0,
    value: 0,
    minimum: 0,
    maximum: 0,
    maxUsage: 1,
    expiredAt: '',
  });

  // Helper function to get field error message
  const getFieldError = (fieldName: string): string | undefined => {
    return fieldErrors[fieldName]?.[0];
  };

  // Helper function to check if field has error
  const hasFieldError = (fieldName: string): boolean => {
    return !!fieldErrors[fieldName];
  };

  // Handle input change with validation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'discountType' || name === 'value' || name === 'minimum' || name === 'maximum' || name === 'maxUsage'
        ? Number(value)
        : value
    }));
    
    // Clear error when user types
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

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
    // Listen for discount code creation confirmations using global connections
    onNotification('OnDiscountCodeCreated', (data: any) => {
      if (data.eventId === eventId) {
        toast.success('Mã giảm giá đã được tạo thành công!');
        navigate(`/event-manager/discount-codes`);
      }
    });

    onNotification('OnDiscountCodeCreateFailed', (data: any) => {
      if (data.eventId === eventId) {
        toast.error('Không thể tạo mã giảm giá. Vui lòng thử lại!');
      }
    });
  }, [eventId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset previous errors
    setFieldErrors({});
    
    try {
      // Validate form data
      const errors = validateDiscountCodeForm({
        ...formData,
        eventId: eventId || ''
      });
      
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        // Scroll to first error
        const firstError = Object.keys(errors)[0];
        document.getElementById(firstError)?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'center'
        });
        return;
      }

      setLoading(true);
      
      // Prepare the request data
      const requestData = {
        ...formData,
        eventId: eventId || '',
        // Ensure numeric values are properly converted
        value: Number(formData.value),
        minimum: Number(formData.minimum),
        maximum: Number(formData.maximum),
        maxUsage: Number(formData.maxUsage)
      };

      const response = await instance.post('/api/DiscountCode/create-discount-code', requestData);
      
      if (response.data.success) {
        toast.success('Đang tạo mã giảm giá...', {
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        });
        // Wait for signalR confirmation
      } else {
        throw new Error(response.data.message || 'Failed to create discount code');
      }
    } catch (error) {
      console.error('Error creating discount code:', error);
      
      if (error instanceof AxiosError) {
        // Handle backend validation errors
        if (error.response?.status === 400 && error.response.data?.fieldErrors) {
          const backendErrors = error.response.data.fieldErrors;
          const formattedErrors: FieldErrors = {};
          
          // Map backend field names to frontend field names
          Object.keys(backendErrors).forEach(key => {
            const frontendKey = key.charAt(0).toLowerCase() + key.slice(1);
            formattedErrors[frontendKey] = backendErrors[key];
          });
          
          setFieldErrors(formattedErrors);
          
          // Scroll to first error
          const firstError = Object.keys(formattedErrors)[0];
          if (firstError) {
            setTimeout(() => {
              document.getElementById(firstError)?.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
              });
            }, 100);
          }
          
          return;
        }
        
        // Handle other API errors
        const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi tạo mã giảm giá';
        toast.error(errorMessage, {
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        });
      } else {
        // Handle non-API errors
        toast.error('Có lỗi xảy ra khi tạo mã giảm giá. Vui lòng thử lại sau.', {
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        });
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
              name="code"
              type="text"
              value={formData.code}
              onChange={handleInputChange}
              className={cn(
                'border-2 focus:ring-2 focus:border-transparent transition-all duration-200',
                getThemeClass(
                  'bg-white border-blue-300 text-gray-900 placeholder-blue-500 focus:ring-blue-500',
                  'bg-[#1a0022]/80 border-pink-500/30 text-white placeholder-pink-400 focus:ring-pink-500'
                ),
                hasFieldError('code') ? 'border-red-500' : ''
              )}
              placeholder={t('enterDiscountCode')}
              required
            />
            {hasFieldError('code') && (
              <p className="mt-1 text-sm text-red-600">{getFieldError('code')}</p>
            )}
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
              name="discountType"
              value={formData.discountType}
              onChange={handleInputChange}
              className={cn(
                'w-full p-3 rounded-xl border-2 focus:ring-2 focus:border-transparent transition-all duration-200',
                getThemeClass(
                  'bg-white border-blue-300 text-gray-900 focus:ring-blue-500',
                  'bg-[#1a0022]/80 border-pink-500/30 text-white focus:ring-pink-500'
                ),
                hasFieldError('discountType') ? 'border-red-500' : ''
              )}
              required
            >
              <option value={0}>{t('percentageDiscount')}</option>
              <option value={1}>{t('fixedAmountDiscount')}</option>
            </select>
            {hasFieldError('discountType') && (
              <p className="mt-1 text-sm text-red-600">{getFieldError('discountType')}</p>
            )}
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
              name="value"
              type="number"
              min="0"
              step={formData.discountType === 0 ? '0.01' : '1'}
              value={formData.value || ''}
              onChange={handleInputChange}
              className={cn(
                'border-2 focus:ring-2 focus:border-transparent transition-all duration-200',
                getThemeClass(
                  'bg-white border-blue-300 text-gray-900 placeholder-blue-500 focus:ring-blue-500',
                  'bg-[#1a0022]/80 border-pink-500/30 text-white placeholder-pink-400 focus:ring-pink-500'
                ),
                hasFieldError('value') ? 'border-red-500' : ''
              )}
              placeholder={
                formData.discountType === 0 ? t('enterPercentage0100') : t('enterAmount')
              }
              required
            />
            {hasFieldError('value') && (
              <p className="mt-1 text-sm text-red-600">{getFieldError('value')}</p>
            )}
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
              name="minimum"
              type="number"
              min="0"
              value={formData.minimum || ''}
              onChange={handleInputChange}
              className={cn(
                'border-2 focus:ring-2 focus:border-transparent transition-all duration-200',
                getThemeClass(
                  'bg-white border-blue-300 text-gray-900 placeholder-blue-500 focus:ring-blue-500',
                  'bg-[#1a0022]/80 border-pink-500/30 text-white placeholder-pink-400 focus:ring-pink-500'
                ),
                hasFieldError('minimum') ? 'border-red-500' : ''
              )}
              placeholder={t('enterMinimumOrderAmount')}
              required
            />
            {hasFieldError('minimum') && (
              <p className="mt-1 text-sm text-red-600">{getFieldError('minimum')}</p>
            )}
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
                name="maximum"
                type="number"
                min="0"
                value={formData.maximum || ''}
                onChange={handleInputChange}
                className={cn(
                  'border-2 focus:ring-2 focus:border-transparent transition-all duration-200',
                  getThemeClass(
                    'bg-white border-blue-300 text-gray-900 placeholder-blue-500 focus:ring-blue-500',
                    'bg-[#1a0022]/80 border-pink-500/30 text-white placeholder-pink-400 focus:ring-pink-500'
                  ),
                  hasFieldError('maximum') ? 'border-red-500' : ''
                )}
                placeholder={t('enterMaximumDiscountAmount0ForNoLimit')}
                required
              />
              {hasFieldError('maximum') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError('maximum')}</p>
              )}
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
              name="maxUsage"
              type="number"
              min="1"
              value={formData.maxUsage || ''}
              onChange={handleInputChange}
              className={cn(
                'border-2 focus:ring-2 focus:border-transparent transition-all duration-200',
                getThemeClass(
                  'bg-white border-blue-300 text-gray-900 placeholder-blue-500 focus:ring-blue-500',
                  'bg-[#1a0022]/80 border-pink-500/30 text-white placeholder-pink-400 focus:ring-pink-500'
                ),
                hasFieldError('maxUsage') ? 'border-red-500' : ''
              )}
              placeholder={t('enterMaximumUsageCount')}
              required
            />
            {hasFieldError('maxUsage') && (
              <p className="mt-1 text-sm text-red-600">{getFieldError('maxUsage')}</p>
            )}
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
              name="expiredAt"
              type="datetime-local"
              value={formData.expiredAt}
              onChange={handleInputChange}
              className={cn(
                'border-2 focus:ring-2 focus:border-transparent transition-all duration-200',
                getThemeClass(
                  'bg-white border-blue-300 text-gray-900 focus:ring-blue-500 [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer',
                  'bg-[#1a0022]/80 border-pink-500/30 text-white focus:ring-pink-500 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer'
                ),
                hasFieldError('expiredAt') ? 'border-red-500' : ''
              )}
              required
            />
            {hasFieldError('expiredAt') && (
              <p className="mt-1 text-sm text-red-600">{getFieldError('expiredAt')}</p>
            )}
            <p className={cn('text-xs', getThemeClass('text-blue-600/70', 'text-pink-200/70'))}>
              {t('whenThisDiscountCodeWillExpire')}
            </p>
          </div>

          <div className="flex gap-4 pt-4">
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
          </div>
        </form>
      </div>
    </div>
  );
}
