import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaTicketAlt,
  FaMoneyBill,
  FaHashtag,
  FaCalendarAlt,
  FaSortNumericUp,
  FaExchangeAlt,
} from 'react-icons/fa';
import { createTicket } from '@/services/Event Manager/event.service';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { onNotification } from '@/services/signalr.service';
import { toast } from 'react-toastify';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';

const defaultTicket = {
  name: '',
  description: '',
  price: '',
  quantity: '',
  saleStartTime: '',
  saleEndTime: '',
  maxTicketsPerOrder: '',
};

export default function CreateTicket() {
  const { t } = useTranslation();
  const { getThemeClass } = useThemeClasses();
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState({ ...defaultTicket });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showBankError, setShowBankError] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Setup realtime listeners using global connections
  useEffect(() => {
    // Notification hub connection is managed globally in App.tsx

    // Listen for ticket creation confirmations
    onNotification('OnTicketCreated', (data: { eventId: string }) => {
      if (data.eventId === eventId) {
        toast.success(t('ticketCreatedSuccessfully'));
        navigate(`/event-manager/events/${eventId}/tickets`);
      }
    });

    onNotification('OnTicketCreateFailed', (data: { eventId: string }) => {
      if (data.eventId === eventId) {
        toast.error(t('cannotCreateTicket'));
      }
    });
  }, [eventId, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Prevent double submit
    
    // Reset states
    setLoading(true);
    setError(null);
    setSuccess(null);
    setShowBankError(false);
    setFieldErrors({});

    try {
      const errors: Record<string, string> = {};

      // Validate each field
      if (!form.name.trim()) {
        errors.name = t('ticketNameEmpty');
      }
      
      if (!form.description.trim()) {
        errors.description = t('ticketDescriptionEmpty');
      }
      
      const priceValue = Number(form.price);
      if (!form.price || isNaN(priceValue) || priceValue < 0) {
        errors.price = t('ticketPriceInvalid');
      } else if (priceValue > 0 && priceValue < 10000) {
        errors.price = t('ticketPriceMustBeAtLeast10000VND');
      }
      
      const quantityValue = Number(form.quantity);
      if (!form.quantity || isNaN(quantityValue) || quantityValue < 1) {
        errors.quantity = t('ticketQuantityInvalid');
      }
      
      if (!form.saleStartTime) {
        errors.saleStartTime = t('pleaseSelectSaleStartTime');
      }
      
      if (!form.saleEndTime) {
        errors.saleEndTime = t('pleaseSelectSaleEndTime');
      }
      
      if (form.saleStartTime && form.saleEndTime && form.saleStartTime >= form.saleEndTime) {
        errors.saleEndTime = t('ticketSaleEndTimeInvalid');
      }
      
      const maxTicketsValue = Number(form.maxTicketsPerOrder);
      if (!form.maxTicketsPerOrder || isNaN(maxTicketsValue) || maxTicketsValue < 1) {
        errors.maxTicketsPerOrder = t('maxTicketsPerOrderMustBeAtLeast1');
      }
      
      if (!eventId) {
        errors.general = t('eventNotFound');
      }

      // If there are validation errors, show them and stop
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setLoading(false);
        return;
      }

      const ticketPayload = {
        eventId,
        name: form.name,
        description: form.description,
        price: Number(form.price),
        quantity: Number(form.quantity),
        saleStartTime: form.saleStartTime,
        saleEndTime: form.saleEndTime,
        maxTicketsPerOrder: Number(form.maxTicketsPerOrder),
        isTransferable: false,
      };

      const ticket = await createTicket(ticketPayload);

      // Debug: Log the API response
      console.log('CreateTicket API Response:', ticket);
      console.log('Response type:', typeof ticket);
      console.log('Response keys:', ticket ? Object.keys(ticket) : 'null');

      // Handle bank account error
      if (ticket && ticket.success === false && ticket.message?.toLowerCase().includes('bank')) {
        setError(ticket.message);
        setShowBankError(true);
        setLoading(false); // Reset loading state
        return;
      }

      // Handle API response errors - check multiple possible response structures
      if (ticket && (ticket.success === false || ticket.flag === false || ticket.code >= 400)) {
        const errorMessage = ticket.message || ticket.error || t('ticketCreationFailed');
        
        // Check if it's a specific field validation error
        if (errorMessage.includes('price must be at least 10,000 VND')) {
          setFieldErrors({ price: t('ticketPriceMustBeAtLeast10000VND') });
        } else {
          setError(errorMessage);
        }
        setLoading(false);
        return;
      }

      // Check for successful response - handle multiple possible success structures
      if (ticket && (ticket.success === true || ticket.flag === true || ticket.code === 200 || ticket.id || ticket.ticketId)) {
        setSuccess(t('ticketCreatedSuccess'));
        setTimeout(() => {
          navigate('/event-manager/tickets/manage');
        }, 1000);
      } else {
        // Debug: Log when falling to this case
        console.log('Falling to default error case. Ticket object:', ticket);
        console.log('Response structure analysis:', {
          hasSuccess: ticket && 'success' in ticket,
          hasFlag: ticket && 'flag' in ticket,
          hasCode: ticket && 'code' in ticket,
          hasId: ticket && 'id' in ticket,
          hasTicketId: ticket && 'ticketId' in ticket
        });
        setError(t('ticketCreationFailed'));
      }
    } catch (err: unknown) {
      console.error('CreateTicket catch block - Full error:', err);
      
      // Try to extract error message from different error structures
      let errorMessage = t('ticketCreationFailed');
      
      if (err && typeof err === 'object') {
        // Check if it's an Axios error with response
        if ('response' in err && err.response) {
          const response = err.response as { data?: unknown; status?: number; headers?: Record<string, string> };
          console.log('Error response object:', response);
          
          if (response.data) {
            console.log('Error response data:', response.data);
            
            // Try to extract message from different possible structures
            if (typeof response.data === 'string') {
              errorMessage = response.data;
            } else if (response.data && typeof response.data === 'object' && 'message' in response.data) {
              errorMessage = (response.data as { message: string }).message;
            } else if (response.data && typeof response.data === 'object' && 'error' in response.data) {
              errorMessage = (response.data as { error: string }).error;
            } else if (response.data && typeof response.data === 'object' && 'title' in response.data) {
              errorMessage = (response.data as { title: string }).title;
            }
          }
          
          console.log('Response status:', response.status);
          console.log('Response headers:', response.headers);
        }
        
        // Check if it's a network error
        if ('message' in err && err.message && typeof err.message === 'string') {
          console.log('Error message:', err.message);
          if (err.message.includes('Network Error') || err.message.includes('Failed to fetch')) {
            errorMessage = t('networkConnectionError');
          }
        }
      }
      
      // Handle specific API validation errors
      if (errorMessage.includes('price must be at least 10,000 VND')) {
        setFieldErrors({ price: t('ticketPriceMustBeAtLeast10000VND') });
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={cn(
        'w-full min-h-screen flex items-center justify-center py-0 px-0',
        getThemeClass(
          'bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100',
          'bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e]'
        )
      )}
    >
      <div className="w-full flex justify-center items-center">
        <form
          onSubmit={handleSubmit}
          className={cn(
            'w-full max-w-5xl rounded-3xl shadow-2xl border-2 p-16 space-y-10 animate-fade-in my-12 mx-4',
            getThemeClass(
              'bg-white/95 border-blue-200 shadow-lg',
              'bg-gradient-to-br from-[#2d0036] via-[#3a0ca3]/80 to-[#ff008e]/80 border-pink-500/30'
            )
          )}
          style={{
            boxShadow: getThemeClass('0 0 80px 0 #3b82f688', '0 0 80px 0 #ff008e88')
          }}
        >
          <div className="flex items-center gap-3 mb-8">
            <FaTicketAlt
              className={cn(
                'text-4xl drop-shadow-glow',
                getThemeClass('text-blue-500', 'text-pink-400')
              )}
            />
            <h2
              className={cn(
                'text-4xl font-extrabold bg-clip-text text-transparent tracking-wide uppercase',
                getThemeClass(
                  'bg-gradient-to-r from-blue-600 to-purple-600',
                  'bg-gradient-to-r from-pink-400 to-yellow-400'
                )
              )}
            >
              {t('createNewTicketType')}
            </h2>
          </div>

          {/* Các trường nhập liệu */}
          <div className="space-y-2">
            <label
              className={cn(
                'font-bold flex items-center gap-2',
                getThemeClass('text-blue-600', 'text-pink-300')
              )}
            >
              <FaHashtag /> {t('ticketName')}
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className={cn(
                'w-full p-4 rounded-xl border-2 focus:ring-2 focus:border-transparent transition-all duration-200',
                fieldErrors.name
                  ? 'border-red-500 focus:ring-red-500'
                  : getThemeClass(
                      'bg-white border-blue-300 text-gray-900 placeholder-blue-500 focus:ring-blue-500',
                      'bg-[#1a0022]/80 border-pink-500/30 text-white placeholder-pink-400 focus:ring-pink-500'
                    )
              )}
              placeholder={t('enterTicketNameExample')}
              required
            />
            {fieldErrors.name && (
              <p className="text-red-500 text-sm mt-1 font-medium">{fieldErrors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <label
              className={cn(
                'font-bold flex items-center gap-2',
                getThemeClass('text-blue-600', 'text-pink-300')
              )}
            >
              <FaTicketAlt /> {t('ticketDescription')}
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className={cn(
                'w-full p-4 rounded-xl border-2 focus:ring-2 focus:border-transparent transition-all duration-200',
                fieldErrors.description
                  ? 'border-red-500 focus:ring-red-500'
                  : getThemeClass(
                      'bg-white border-blue-300 text-gray-900 placeholder-blue-500 focus:ring-blue-500',
                      'bg-[#1a0022]/80 border-pink-500/30 text-white placeholder-pink-400 focus:ring-pink-500'
                    )
              )}
              placeholder={t('enterTicketDescription')}
              required
            />
            {fieldErrors.description && (
              <p className="text-red-500 text-sm mt-1 font-medium">{fieldErrors.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <label
              className={cn(
                'font-bold flex items-center gap-2',
                getThemeClass('text-blue-600', 'text-pink-300')
              )}
            >
              <FaMoneyBill /> {t('ticketPrice')} (VNĐ)
            </label>
            <input
              name="price"
              type="number"
              min={0}
              value={form.price}
              onChange={handleChange}
              className={cn(
                'w-full p-4 rounded-xl border-2 focus:ring-2 focus:border-transparent transition-all duration-200',
                fieldErrors.price
                  ? 'border-red-500 focus:ring-red-500'
                  : getThemeClass(
                      'bg-white border-blue-300 text-gray-900 placeholder-blue-500 focus:ring-blue-500',
                      'bg-[#1a0022]/80 border-pink-500/30 text-white placeholder-pink-400 focus:ring-pink-500'
                    )
              )}
              placeholder={t('enterTicketPrice')}
              required
            />
            {fieldErrors.price && (
              <p className="text-red-500 text-sm mt-1 font-medium">{fieldErrors.price}</p>
            )}
          </div>

          <div className="space-y-2">
            <label
              className={cn(
                'font-bold flex items-center gap-2',
                getThemeClass('text-blue-600', 'text-pink-300')
              )}
            >
              <FaSortNumericUp /> {t('ticketQuantity')}
            </label>
            <input
              name="quantity"
              type="number"
              min={1}
              value={form.quantity}
              onChange={handleChange}
              className={cn(
                'w-full p-4 rounded-xl border-2 focus:ring-2 focus:border-transparent transition-all duration-200',
                fieldErrors.quantity
                  ? 'border-red-500 focus:ring-red-500'
                  : getThemeClass(
                      'bg-white border-blue-300 text-gray-900 placeholder-blue-500 focus:ring-blue-500',
                      'bg-[#1a0022]/80 border-pink-500/30 text-white placeholder-pink-400 focus:ring-pink-500'
                    )
              )}
              placeholder={t('enterTicketQuantity')}
              required
            />
            {fieldErrors.quantity && (
              <p className="text-red-500 text-sm mt-1 font-medium">{fieldErrors.quantity}</p>
            )}
          </div>

          <div className="space-y-2">
            <label
              className={cn(
                'font-bold flex items-center gap-2',
                getThemeClass('text-blue-600', 'text-pink-300')
              )}
            >
              <FaCalendarAlt /> {t('ticketSaleStartTime')}
            </label>
            <input
              name="saleStartTime"
              type="datetime-local"
              value={form.saleStartTime}
              onChange={handleChange}
              className={cn(
                'w-full p-4 rounded-xl border-2 focus:ring-2 focus:border-transparent transition-all duration-200',
                fieldErrors.saleStartTime
                  ? 'border-red-500 focus:ring-red-500'
                  : getThemeClass(
                      'bg-white border-blue-300 text-gray-900 focus:ring-blue-500',
                      'bg-[#1a0022]/80 border-pink-500/30 text-white focus:ring-pink-500'
                    )
              )}
              required
            />
            {fieldErrors.saleStartTime && (
              <p className="text-red-500 text-sm mt-1 font-medium">{fieldErrors.saleStartTime}</p>
            )}
          </div>

          <div className="space-y-2">
            <label
              className={cn(
                'font-bold flex items-center gap-2',
                getThemeClass('text-blue-600', 'text-pink-300')
              )}
            >
              <FaCalendarAlt /> {t('ticketSaleEndTime')}
            </label>
            <input
              name="saleEndTime"
              type="datetime-local"
              value={form.saleEndTime}
              onChange={handleChange}
              className={cn(
                'w-full p-4 rounded-xl border-2 focus:ring-2 focus:border-transparent transition-all duration-200',
                fieldErrors.saleEndTime
                  ? 'border-red-500 focus:ring-red-500'
                  : getThemeClass(
                      'bg-white border-blue-300 text-gray-900 focus:ring-blue-500',
                      'bg-[#1a0022]/80 border-pink-500/30 text-white focus:ring-pink-500'
                    )
              )}
              required
            />
            {fieldErrors.saleEndTime && (
              <p className="text-red-500 text-sm mt-1 font-medium">{fieldErrors.saleEndTime}</p>
            )}
          </div>

          <div className="space-y-2">
            <label
              className={cn(
                'font-bold flex items-center gap-2',
                getThemeClass('text-blue-600', 'text-pink-300')
              )}
            >
              <FaExchangeAlt /> {t('ticketMaxPerOrder')}
            </label>
            <input
              name="maxTicketsPerOrder"
              type="number"
              min={1}
              value={form.maxTicketsPerOrder}
              onChange={handleChange}
              className={cn(
                'w-full p-4 rounded-xl border-2 focus:ring-2 focus:border-transparent transition-all duration-200',
                fieldErrors.maxTicketsPerOrder
                  ? 'border-red-500 focus:ring-red-500'
                  : getThemeClass(
                      'bg-white border-blue-300 text-gray-900 placeholder-blue-500 focus:ring-blue-500',
                      'bg-[#1a0022]/80 border-pink-500/30 text-white placeholder-pink-400 focus:ring-pink-500'
                    )
              )}
              placeholder={t('enterTicketMaxPerOrder')}
              required
            />
            {fieldErrors.maxTicketsPerOrder && (
              <p className="text-red-500 text-sm mt-1 font-medium">{fieldErrors.maxTicketsPerOrder}</p>
            )}
          </div>

          {error && showBankError && (
            <div
              className={cn(
                'rounded-lg px-4 py-3 font-bold text-center shadow-lg mt-2 border-2',
                getThemeClass(
                  'bg-yellow-50 border-yellow-400 text-yellow-800',
                  'bg-yellow-50 border-yellow-400 text-yellow-800'
                )
              )}
            >
              <div className="flex flex-col items-center gap-2">
                <AlertTriangle className="w-8 h-8 text-yellow-500 mb-1" />
                <div className="text-base font-semibold mb-2">{t('missingBankInfo')}</div>
                {/* Only show the main warning, not the error text again */}
                <button
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 mt-2"
                  onClick={() => navigate(`/event-manager/edit/${eventId}`)}
                >
                  {t('goToEditEvent')}
                </button>
              </div>
            </div>
          )}
          {error && !showBankError && (
            <div
              className={cn(
                'rounded-lg px-4 py-3 font-bold text-center shadow-lg mt-2',
                getThemeClass('bg-red-100 text-red-700', 'bg-red-100 text-red-700')
              )}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              className={cn(
                'rounded-lg px-4 py-3 font-bold text-center shadow-lg',
                getThemeClass('bg-green-100 text-green-700', 'bg-green-100 text-green-700')
              )}
            >
              {success}
            </div>
          )}

          <button
            type="submit"
            className={cn(
              'w-full py-4 mt-4 text-xl font-extrabold text-white rounded-2xl shadow-xl transition-all duration-200 tracking-widest uppercase drop-shadow-glow',
              getThemeClass(
                'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600',
                'bg-gradient-to-r from-pink-500 to-yellow-400 hover:from-pink-600 hover:to-yellow-500'
              )
            )}
            disabled={loading}
          >
            <FaTicketAlt className="inline mr-2" />
            {loading ? t('creatingTicket') : t('createTicketNow')}
          </button>
        </form>
      </div>
    </div>
  );
}
