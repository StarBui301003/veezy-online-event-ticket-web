/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { updateTicket, getTicketsByEvent } from '@/services/Event Manager/event.service';
import {
  FaTicketAlt,
  FaImage,
  FaMoneyBill,
  FaHashtag,
  FaCalendarAlt,
  FaSortNumericUp,
  FaExchangeAlt,
  FaSave,
} from 'react-icons/fa';
import type { TicketForm as BaseTicketForm } from '@/types/ticket';
import { useTranslation } from 'react-i18next';

export interface TicketFormWithId extends BaseTicketForm {
  ticketId: string;
}

export default function EditTicket() {
  const { t } = useTranslation();
  const { eventId, ticketId } = useParams<{ eventId: string; ticketId: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<TicketFormWithId | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Lấy thông tin vé hiện tại
        useEffect(() => {
      if (!eventId || !ticketId) return;
      (async () => {
        setLoading(true);
        try {
          const tickets = await getTicketsByEvent(eventId);
          const ticket = tickets.find((t: TicketFormWithId) => t.ticketId === ticketId);
          if (ticket) {
            const toInputDate = (d: string) =>
              d ? new Date(d).toISOString().slice(0, 16) : "";
            setForm({
              ticketId: ticket.ticketId,
              name: ticket.ticketName,
              description: ticket.ticketDescription,
              price: ticket.ticketPrice,
              quantity: ticket.quantityAvailable,
              saleStartTime: toInputDate(ticket.startSellAt || ticket.saleStartTime),
              saleEndTime: toInputDate(ticket.endSellAt || ticket.saleEndTime),
              maxTicketsPerOrder: ticket.maxTicketsPerOrder ?? 1, // đảm bảo luôn có giá trị
              isTransferable: ticket.isTransferable,
              imageUrl: "",
            });
          }
        } finally {
          setLoading(false);
        }
      })();
    }, [eventId, ticketId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm((prev: TicketFormWithId | null) => {
      if (!prev) return null;
      return {
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      };
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Nếu có uploadImage thì dùng, còn không thì dùng URL.createObjectURL
    // const url = await uploadImage(file);
    const url = URL.createObjectURL(file);
    setForm((prev: TicketFormWithId | null) => {
      if (!prev) return null;
      return { ...prev, imageUrl: url };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Chặn double submit
    setError(null);
    setSuccess(null);

    // Validate
    if (!form?.name?.trim()) return setError(t('ticketNameEmpty'));
    if (!form?.description?.trim()) return setError(t('ticketDescriptionEmpty'));
    if (!form?.price || form.price < 0) return setError(t('ticketPriceInvalid'));
    if (!form?.quantity || form.quantity < 1) return setError(t('ticketQuantityInvalid'));
    if (!form?.saleStartTime || !form.saleEndTime)
      return setError(t('ticketSaleTimeInvalid'));
    if (form.saleStartTime >= form.saleEndTime)
      return setError(t('ticketSaleEndTimeInvalid'));
    if (!eventId || !ticketId) return setError(t('ticketEventNotFound'));

    try {
           // ...existing code...
      await updateTicket(ticketId, {
        eventId,
        name: form.name,
        description: form.description,
        price: Number(form.price),
        quantity: Number(form.quantity),
        saleStartTime: form.saleStartTime,
        saleEndTime: form.saleEndTime,
        maxTicketsPerOrder: Number(form.maxTicketsPerOrder),
        isTransferable: form.isTransferable,
        imageUrl: form.imageUrl, // giữ ảnh cũ nếu chưa chọn ảnh mới
      });
      setSuccess(t('ticketUpdateSuccess'));
      setTimeout(() => navigate(-1), 1200);
    } catch (err: any) {
      setError(err?.response?.data?.message || t('ticketUpdateFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (loading || !form) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e]">
        <div className="text-pink-400 text-lg">{t('ticketLoadingData')}</div>
      </div>
    );
  }

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
              {t('editTicket')}
            </h2>
          </div>

          <div className="space-y-2">
            <label className="font-bold text-pink-300 flex items-center gap-2">
              <FaHashtag /> {t('ticketName')}
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full p-4 rounded-xl bg-[#1a0022]/80 border-2 border-pink-500/30 text-white placeholder-pink-400 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
              placeholder={t('enterTicketName')}
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
              <FaExchangeAlt /> {t('ticketMaxTicketsPerOrder')}
            </label>
                       <input
              name="maxTicketsPerOrder"
              type="number"
              min={1}
              value={form.maxTicketsPerOrder}
              onChange={handleChange}
              className="w-full p-4 rounded-xl bg-[#1a0022]/80 border-2 border-pink-500/30 text-white placeholder-pink-400 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
              placeholder={t('enterTicketMaxTicketsPerOrder')}
              required
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              name="isTransferable"
              type="checkbox"
              checked={form.isTransferable}
              onChange={handleChange}
              id="isTransferable"
              className="w-5 h-5 accent-pink-500 rounded"
            />
            <label
              htmlFor="isTransferable"
              className="font-bold text-pink-300 flex items-center gap-2"
            >
              {t('ticketTransferable')}
            </label>
          </div>
          <div className="space-y-2">
            <label className="font-bold text-pink-300 flex items-center gap-2">
              <FaImage /> {t('ticketImage')} (tùy chọn)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                id="ticket-image"
                className="hidden"
                onChange={handleImageChange}
              />
              <label
                htmlFor="ticket-image"
                className="bg-gradient-to-r from-pink-500 to-yellow-400 hover:from-pink-600 hover:to-yellow-500 text-white px-4 py-2 rounded-lg cursor-pointer transition-all duration-200 font-bold shadow-lg"
              >
                {t('chooseImage')}
              </label>
                            
                            {form.imageUrl && (
                <img
                  src={form.imageUrl}
                  alt="ticket"
                  className="h-16 w-24 object-cover rounded-xl border-2 border-pink-400 shadow-lg"
                />
              )}
            </div>
          </div>
          {error && (
            <div className="bg-red-100 text-red-700 rounded-lg px-4 py-3 font-bold text-center shadow-lg">
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
            <FaSave className="inline mr-2" />
            {t('saveChanges')}
          </button>
        </form>
      </div>
    </div>
  );
}
