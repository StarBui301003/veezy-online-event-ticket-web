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
import { connectTicketHub, onTicket } from "@/services/signalr.service";
import { toast } from "react-toastify";

const defaultTicket = {
  name: '',
  description: '',
  price: 0,
  quantity: 1,
  saleStartTime: '',
  saleEndTime: '',
  maxTicketsPerOrder: 1,
};

export default function CreateTicket() {
  const { t } = useTranslation();
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState({ ...defaultTicket });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showBankError, setShowBankError] = useState(false);

  // Setup realtime connection for ticket creation
  useEffect(() => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    connectTicketHub(token || undefined);
    
    // Listen for ticket creation confirmations
    onTicket('TicketCreated', (data: any) => {
      if (data.eventId === eventId) {
        toast.success('Vé đã được tạo thành công!');
        navigate(`/event-manager/events/${eventId}/tickets`);
      }
    });

    onTicket('TicketCreateFailed', (data: any) => {
      if (data.eventId === eventId) {
        toast.error('Không thể tạo vé. Vui lòng thử lại!');
      }
    });
  }, [eventId, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Chặn double submit
    setLoading(true);
    setError(null);
    setSuccess(null);
    setShowBankError(false);
    
    // Validate
    if (!form.name.trim()) return setError(t('ticketNameEmpty'));
    if (!form.price || form.price < 0) return setError(t('ticketPriceInvalid'));
    if (!form.quantity || form.quantity < 1) return setError(t('ticketQuantityInvalid'));
    if (!form.saleStartTime || !form.saleEndTime)
      return setError(t('ticketSaleTimeInvalid'));
    if (form.saleStartTime >= form.saleEndTime)
      return setError(t('ticketSaleEndTimeInvalid'));
    if (!eventId) return setError(t('eventNotFound'));
    if (!form.description.trim()) return setError(t('ticketDescriptionEmpty'));

    try {
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

      const ticket = await createTicket(ticketPayload); // Gọi API tạo vé

      // Nếu API trả về lỗi thiếu thông tin tài khoản ngân hàng
      if (ticket && ticket.success === false && ticket.message && ticket.message.toLowerCase().includes('bank')) {
        setError(ticket.message);
        setShowBankError(true);
        return;
      }

      if (ticket) {
        setSuccess(t('ticketCreatedSuccess'));
        setTimeout(() => {
          navigate('/event-manager/tickets/manage');
        }, 1000);
      } else {
        setError(t('ticketCreationFailed'));
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data) {
        setError(err.response.data.message as string || t('ticketCreationFailed'));
      } else {
        setError(t('ticketCreationFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e] py-0 px-0">
      <div className="w-full flex justify-center items-center">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-5xl bg-gradient-to-br from-[#2d0036] via-[#3a0ca3]/80 to-[#ff008e]/80 rounded-3xl shadow-2xl border-2 border-pink-500/30 p-16 space-y-10 animate-fade-in my-12 mx-4"
          style={{ boxShadow: '0 0 80px 0 #ff008e88' }}
        >
          <div className="flex items-center gap-3 mb-8">
            <FaTicketAlt className="text-4xl text-pink-400 drop-shadow-glow" />
            <h2 className="text-4xl font-extrabold bg-gradient-to-r from-pink-400 to-yellow-400 bg-clip-text text-transparent tracking-wide uppercase">
              {t('createNewTicketType')}
            </h2>
          </div>

          {/* Các trường nhập liệu */}
          <div className="space-y-2">
            <label className="font-bold text-pink-300 flex items-center gap-2">
              <FaHashtag /> {t('ticketName')}
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full p-4 rounded-xl bg-[#1a0022]/80 border-2 border-pink-500/30 text-white placeholder-pink-400 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
              placeholder={t('enterTicketNameExample')}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="font-bold text-pink-300 flex items-center gap-2">
              <FaTicketAlt /> {t('ticketDescription')}
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full p-4 rounded-xl bg-[#1a0022]/80 border-2 border-pink-500/30 text-white placeholder-pink-400 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
              placeholder={t('enterTicketDescription')}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="font-bold text-pink-300 flex items-center gap-2">
              <FaMoneyBill /> {t('ticketPrice')} (VNĐ)
            </label>
            <input
              name="price"
              type="number"
              min={0}
              value={form.price}
              onChange={handleChange}
              className="w-full p-4 rounded-xl bg-[#1a0022]/80 border-2 border-pink-500/30 text-white placeholder-pink-400 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
              placeholder={t('enterTicketPrice')}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="font-bold text-pink-300 flex items-center gap-2">
              <FaSortNumericUp /> {t('ticketQuantity')}
            </label>
            <input
              name="quantity"
              type="number"
              min={1}
              value={form.quantity}
              onChange={handleChange}
              className="w-full p-4 rounded-xl bg-[#1a0022]/80 border-2 border-pink-500/30 text-white placeholder-pink-400 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
              placeholder={t('enterTicketQuantity')}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="font-bold text-pink-300 flex items-center gap-2">
              <FaCalendarAlt /> {t('ticketSaleStartTime')}
            </label>
            <input
              name="saleStartTime"
              type="datetime-local"
              value={form.saleStartTime}
              onChange={handleChange}
              className="w-full p-4 rounded-xl bg-[#1a0022]/80 border-2 border-pink-500/30 text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="font-bold text-pink-300 flex items-center gap-2">
              <FaCalendarAlt /> {t('ticketSaleEndTime')}
            </label>
            <input
              name="saleEndTime"
              type="datetime-local"
              value={form.saleEndTime}
              onChange={handleChange}
              className="w-full p-4 rounded-xl bg-[#1a0022]/80 border-2 border-pink-500/30 text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="font-bold text-pink-300 flex items-center gap-2">
              <FaExchangeAlt /> {t('ticketMaxPerOrder')}
            </label>
            <input
              name="maxTicketsPerOrder"
              type="number"
              min={1}
              value={form.maxTicketsPerOrder}
              onChange={handleChange}
              className="w-full p-4 rounded-xl bg-[#1a0022]/80 border-2 border-pink-500/30 text-white placeholder-pink-400 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
              placeholder={t('enterTicketMaxPerOrder')}
              required
            />
          </div>

          {error && showBankError && (
            <div className="rounded-lg px-4 py-3 font-bold text-center shadow-lg mt-2 bg-yellow-50 border-2 border-yellow-400 text-yellow-800">
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
            <div className="rounded-lg px-4 py-3 font-bold text-center shadow-lg mt-2 bg-red-100 text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-100 text-green-700 rounded-lg px-4 py-3 font-bold text-center shadow-lg">
              {success}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 mt-4 text-xl font-extrabold bg-gradient-to-r from-pink-500 to-yellow-400 hover:from-pink-600 hover:to-yellow-500 text-white rounded-2xl shadow-xl transition-all duration-200 tracking-widest uppercase drop-shadow-glow"
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