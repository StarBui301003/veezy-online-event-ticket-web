/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { updateTicket, getTicketsByEvent } from '@/services/Event Manager/event.service';
import {
  FaTicketAlt,
  FaMoneyBill,
  FaHashtag,
  FaCalendarAlt,
  FaSortNumericUp,
  FaExchangeAlt,
  FaSave,
} from 'react-icons/fa';
import type { TicketForm as BaseTicketForm } from '@/types/ticket';
import { useTranslation } from 'react-i18next';
import { onNotification } from '@/services/signalr.service';
import { toast } from 'react-toastify';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';

export interface TicketFormWithId extends BaseTicketForm {
  ticketId: string;
}

export default function EditTicket() {
  const { t } = useTranslation();
  const { getThemeClass } = useThemeClasses();
  const { eventId, ticketId } = useParams<{ eventId: string; ticketId: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<TicketFormWithId | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lấy thông tin vé hiện tại
  useEffect(() => {
    if (!eventId || !ticketId) return;
    (async () => {
      setLoading(true);
      try {
        const tickets = await getTicketsByEvent(eventId);
        const ticket = tickets.find((t: TicketFormWithId) => t.ticketId === ticketId);
        if (ticket) {
          const toInputDate = (d: string) => (d ? new Date(d).toISOString().slice(0, 16) : '');
          setForm({
            ticketId: ticket.ticketId,
            name: ticket.ticketName,
            description: ticket.ticketDescription,
            price: ticket.ticketPrice,
            quantity: ticket.quantityAvailable,
            saleStartTime: toInputDate(ticket.startSellAt || ticket.saleStartTime),
            saleEndTime: toInputDate(ticket.endSellAt || ticket.saleEndTime),
            maxTicketsPerOrder: ticket.maxTicketsPerOrder ?? 1, // đảm bảo luôn có giá trị
          });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId, ticketId]);

  // Setup realtime connection for ticket updates using global connections
  useEffect(() => {
    // Listen for ticket update confirmations
    onNotification('OnTicketUpdated', (data: { ticketId: string }) => {
      if (data.ticketId === ticketId) {
        toast.success(t('ticketUpdatedSuccessfully'));
        navigate(`/event-manager/events/${eventId}/tickets`);
      }
    });

    onNotification('OnTicketUpdateFailed', (data: { ticketId: string }) => {
      if (data.ticketId === ticketId) {
        toast.error(t('cannotUpdateTicket'));
      }
    });
  }, [eventId, ticketId, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm((prev: TicketFormWithId | null) => {
      if (!prev) return null;
      return {
        ...prev,
        [name]: type === 'number' ? Number(value) : value,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Chặn double submit
    setError(null);
    // Validate
    if (!form?.name?.trim()) return setError(t('ticketNameEmpty'));
    if (!form?.description?.trim()) return setError(t('ticketDescriptionEmpty'));
    if (!form?.price || form.price < 0) return setError(t('ticketPriceInvalid'));
    if (!form?.quantity || form.quantity < 1) return setError(t('ticketQuantityInvalid'));
    if (!form?.saleStartTime || !form.saleEndTime) return setError(t('ticketSaleTimeInvalid'));
    if (form.saleStartTime >= form.saleEndTime) return setError(t('ticketSaleEndTimeInvalid'));
    if (!eventId || !ticketId) return setError(t('ticketEventNotFound'));

    try {
      setLoading(true);
      await updateTicket(ticketId, {
        eventId,
        name: form.name,
        description: form.description,
        price: Number(form.price),
        quantity: Number(form.quantity),
        saleStartTime: form.saleStartTime,
        saleEndTime: form.saleEndTime,
        maxTicketsPerOrder: Number(form.maxTicketsPerOrder),
      });
      navigate(-1);
    } catch (err: any) {
      setError(err?.response?.data?.message || t('ticketUpdateFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (loading || !form) {
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
        <div className={cn('text-lg', getThemeClass('text-blue-600', 'text-pink-400'))}>
          {t('ticketLoadingData')}
        </div>
      </div>
    );
  }

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
              {t('editTicket')}
            </h2>
          </div>

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
                getThemeClass(
                  'bg-white border-blue-300 text-gray-900 placeholder-blue-500 focus:ring-blue-500',
                  'bg-[#1a0022]/80 border-pink-500/30 text-white placeholder-pink-400 focus:ring-pink-500'
                )
              )}
              placeholder={t('enterTicketName')}
              required
            />
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
                getThemeClass(
                  'bg-white border-blue-300 text-gray-900 placeholder-blue-500 focus:ring-blue-500',
                  'bg-[#1a0022]/80 border-pink-500/30 text-white placeholder-pink-400 focus:ring-pink-500'
                )
              )}
              placeholder={t('enterTicketDescription')}
              required
            />
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
                getThemeClass(
                  'bg-white border-blue-300 text-gray-900 placeholder-blue-500 focus:ring-blue-500',
                  'bg-[#1a0022]/80 border-pink-500/30 text-white placeholder-pink-400 focus:ring-pink-500'
                )
              )}
              placeholder={t('enterTicketPrice')}
              required
            />
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
                getThemeClass(
                  'bg-white border-blue-300 text-gray-900 placeholder-blue-500 focus:ring-blue-500',
                  'bg-[#1a0022]/80 border-pink-500/30 text-white placeholder-pink-400 focus:ring-pink-500'
                )
              )}
              placeholder={t('enterTicketQuantity')}
              required
            />
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
                getThemeClass(
                  'bg-white border-blue-300 text-gray-900 focus:ring-blue-500',
                  'bg-[#1a0022]/80 border-pink-500/30 text-white focus:ring-pink-500'
                )
              )}
              required
            />
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
                getThemeClass(
                  'bg-white border-blue-300 text-gray-900 focus:ring-blue-500',
                  'bg-[#1a0022]/80 border-pink-500/30 text-white focus:ring-pink-500'
                )
              )}
              required
            />
          </div>
          <div className="space-y-2">
            <label
              className={cn(
                'font-bold flex items-center gap-2',
                getThemeClass('text-blue-600', 'text-pink-300')
              )}
            >
              <FaExchangeAlt /> {t('ticketMaxTicketsPerOrder')}
            </label>
            <input
              name="maxTicketsPerOrder"
              type="number"
              min={1}
              value={form.maxTicketsPerOrder}
              onChange={handleChange}
              className={cn(
                'w-full p-4 rounded-xl border-2 focus:ring-2 focus:border-transparent transition-all duration-200',
                getThemeClass(
                  'bg-white border-blue-300 text-gray-900 placeholder-blue-500 focus:ring-blue-500',
                  'bg-[#1a0022]/80 border-pink-500/30 text-white placeholder-pink-400 focus:ring-pink-500'
                )
              )}
              placeholder={t('enterTicketMaxTicketsPerOrder')}
              required
            />
          </div>

          {error && (
            <div
              className={cn(
                'rounded-lg px-4 py-3 font-bold text-center shadow-lg',
                getThemeClass('bg-red-100 text-red-700', 'bg-red-100 text-red-700')
              )}
            >
              {error}
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
            <FaSave className="inline mr-2" />
            {t('saveChanges')}
          </button>
        </form>
      </div>
    </div>
  );
}
