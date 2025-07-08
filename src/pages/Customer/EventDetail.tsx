import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CalendarDays, MapPin, Ticket, ShoppingCart, AlertCircle, CheckCircle, MinusCircle, PlusCircle } from "lucide-react";
import { getEventById, getTicketsByEvent, validateDiscountCode } from "@/services/Event Manager/event.service";
import { toast } from "react-toastify";
import CommentSection from "@/components/Customer/CommentSection";
import { connectCommentHub, onComment } from '@/services/signalr.service';

interface EventDetailData {
  eventId: string;
  eventName: string;
  eventCoverImageUrl: string;
  eventDescription: string;
  startAt: string;
  endAt: string;
  tags: string[];
  categoryIds: string[];
  eventLocation: string;
  isApproved: number;
  isCancelled: boolean;
  contents: { imageUrl?: string; description?: string; position: number }[];
}

interface TicketData {
  ticketId: string;
  ticketName: string;
  ticketPrice: number;
  quantityAvailable: number;
  maxTicketsPerOrder?: number;
}

interface SelectedTicket {
  ticketId: string;
  quantity: number;
  ticketName: string;
  ticketPrice: number;
}

const EventDetail = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventDetailData | null>(null);
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<Record<string, SelectedTicket>>({});
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [showDetail, setShowDetail] = useState(true);
  const [showTickets, setShowTickets] = useState(true);
  const [discountCode, setDiscountCode] = useState("");
  const [discountValidation, setDiscountValidation] = useState<{ success: boolean; message: string; discountAmount?: number } | null>(null);
  const [validatingDiscount, setValidatingDiscount] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);

  let customerId = '';
  try {
    const accStr = localStorage.getItem('account');
    if (accStr) {
      const accObj = JSON.parse(accStr);
      customerId = accObj.userId || '';
    }
  } catch {
    // Ignore JSON parse errors, fallback to empty customerId
    customerId = '';
  }

  useEffect(() => {
    if (!eventId) {
      setError("Không tìm thấy ID sự kiện.");
      setLoadingEvent(false);
      setLoadingTickets(false);
      return;
    }

    const fetchEventData = async () => {
      setLoadingEvent(true);
      setError(null);
      try {
        const eventData = await getEventById(eventId);
        if (eventData && eventData.isApproved === 1 && !eventData.isCancelled) {
          setEvent(eventData);
        } else {
          setError("Sự kiện không tồn tại, chưa được duyệt hoặc đã bị hủy.");
          setEvent(null);
        }
      } catch {
        setError("Không thể tải thông tin sự kiện. Vui lòng thử lại.");
        setEvent(null);
      } finally {
        setLoadingEvent(false);
      }
    };

    const fetchTicketData = async () => {
      setLoadingTickets(true);
      try {
        const ticketData = await getTicketsByEvent(eventId);
        setTickets(ticketData || []);
      } catch {
        setTickets([]);
      } finally {
        setLoadingTickets(false);
      }
    };

    fetchEventData();
    fetchTicketData();
  }, [eventId]);

  useEffect(() => {
    connectCommentHub('http://localhost:5004/commentHub');
    // Lắng nghe realtime SignalR cho comment
    const reloadComment = () => {
      // Nếu có component CommentSection, nên expose hàm refetch comment qua ref hoặc context
      // Hoặc có thể reload toàn bộ trang nếu cần
      // window.location.reload();
    };
    onComment('OnCommentCreated', reloadComment);
    onComment('OnCommentUpdated', reloadComment);
    onComment('OnCommentDeleted', reloadComment);
  }, []);

  const handleQuantityChange = (ticket: TicketData, quantity: number) => {
    const newQuantity = Math.max(0, Math.min(quantity, ticket.quantityAvailable));
    setSelectedTickets((prev) => {
      const updated = { ...prev };
      if (newQuantity === 0) {
        delete updated[ticket.ticketId];
      } else {
        updated[ticket.ticketId] = {
          ticketId: ticket.ticketId,
          quantity: newQuantity,
          ticketName: ticket.ticketName,
          ticketPrice: typeof ticket.ticketPrice === "number" ? ticket.ticketPrice : Number(ticket.ticketPrice) || 0,
        };
      }
      return updated;
    });
  };

  const calculateTotalAmount = () => {
    return Object.values(selectedTickets).reduce(
      (total, item) => {
        const price = typeof item.ticketPrice === "number" ? item.ticketPrice : Number(item.ticketPrice) || 0;
        return total + price * item.quantity;
      },
      0
    );
  };

  const handleCreateOrder = async () => {
    if (!eventId || Object.keys(selectedTickets).length === 0) {
      toast.warn("Vui lòng chọn ít nhất một vé.");
      return;
    }
    if (!customerId) {
      toast.error("Không tìm thấy thông tin khách hàng. Vui lòng đăng nhập lại.");
      return;
    }

    // Kiểm tra giới hạn maxTicketsPerOrder cho từng vé
    for (const ticket of tickets) {
      const selected = selectedTickets[ticket.ticketId];
      if (selected) {
        const maxPerOrder = ticket.maxTicketsPerOrder || ticket.quantityAvailable;
        if (selected.quantity > maxPerOrder) {
          toast.error(`Bạn chỉ được mua tối đa ${maxPerOrder} vé cho loại "${ticket.ticketName}".`);
          return;
        }
      }
    }

    // Lưu thông tin checkout vào localStorage
    const checkoutData = {
      eventId,
      eventName: event?.eventName || '',
      eventTime: `${event ? new Date(event.startAt).toLocaleString('vi-VN') : ''} - ${event ? new Date(event.endAt).toLocaleString('vi-VN') : ''}`,
      customerId,
      items: Object.values(selectedTickets).map(st => ({
        ticketId: st.ticketId,
        ticketName: st.ticketName,
        ticketPrice: st.ticketPrice,
        quantity: st.quantity,
      })),
      discountCode: discountCode.trim() || undefined,
      discountAmount: appliedDiscount,
    };
    localStorage.setItem('checkout', JSON.stringify(checkoutData));
    toast.success(<>Chuyển sang xác nhận đơn! <CheckCircle className="inline w-5 h-5 ml-1"/></>);
    localStorage.setItem('lastEventId', eventId);
    navigate('/confirm-order');
    setIsCreatingOrder(false);
  };

  const handleValidateDiscount = async () => {
    if (!discountCode.trim()) {
      setDiscountValidation({ success: false, message: "Vui lòng nhập mã giảm giá." });
      setAppliedDiscount(0);
      return;
    }
    setValidatingDiscount(true);
    setDiscountValidation(null);
    setAppliedDiscount(0);
    try {
      const orderAmount = calculateTotalAmount();
      const res = await validateDiscountCode(String(eventId), discountCode.trim(), orderAmount);
      if (res && res.flag && res.data) {
        setDiscountValidation({ success: true, message: res.message || "Mã giảm giá hợp lệ!", discountAmount: res.data.discountAmount });
        setAppliedDiscount(res.data.discountAmount || 0);
      } else {
        setDiscountValidation({ success: false, message: res.message || "Mã giảm giá không hợp lệ." });
        setAppliedDiscount(0);
      }
    } catch (err) {
      setDiscountValidation({ success: false, message: err?.response?.data?.message || "Mã giảm giá không hợp lệ." });
      setAppliedDiscount(0);
    } finally {
      setValidatingDiscount(false);
    }
  };

  const isEventEnded = event && new Date() > new Date(event.endAt);

  if (loadingEvent) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
        <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-center items-center min-h-screen bg-red-50 p-8 text-center"
      >
        <AlertCircle className="w-20 h-20 text-red-500 mb-6" />
        <h2 className="text-3xl font-semibold text-red-700 mb-4">Đã xảy ra lỗi</h2>
        <p className="text-red-600 text-lg">{error}</p>
        <button
          onClick={() => navigate("/")}
          className="mt-8 px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-all duration-300"
        >
          Về trang chủ
        </button>
      </motion.div>
    );
  }

  if (!event) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <p className="text-xl text-gray-500">Không tìm thấy thông tin sự kiện.</p>
      </div>
    );
  }

  const totalAmount = Math.max(0, calculateTotalAmount() - appliedDiscount);
  const selectedItemsCount = Object.values(selectedTickets).reduce((sum, item) => sum + item.quantity, 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white pt-20 pb-12"
    >
      <div className="container mx-auto px-4 lg:px-8">
        {/* Event Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative rounded-3xl shadow-2xl overflow-hidden mb-12 h-[300px] md:h-[400px] lg:h-[500px]"
        >
          <img
            src={event.eventCoverImageUrl || "https://via.placeholder.com/1200x500/334155/94a3b8?text=Event+Cover"}
            alt={event.eventName}
            className="w-full h-full object-cover "
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full">
            <motion.h1
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-3xl md:text-5xl font-bold text-white mb-2 shadow-text"
            >
              {event.eventName}
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="flex flex-wrap items-center text-purple-300 space-x-4 text-sm md:text-base mb-2"
            >
              <span className="flex items-center"><CalendarDays className="w-5 h-5 mr-2" /> {new Date(event.startAt).toLocaleDateString('vi-VN')} - {new Date(event.endAt).toLocaleDateString('vi-VN')}</span>
              <span className="flex items-center"><MapPin className="w-5 h-5 mr-2" /> {event.eventLocation}</span>
            </motion.div>
            {event.tags && event.tags.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
                className="flex flex-wrap gap-2 mt-1"
              >
                {event.tags.map((tag, index) => (
                  <motion.span
                    key={index}
                    whileHover={{ scale: 1.1, backgroundColor: '#a78bfa' }}
                    className="px-3 py-1 bg-purple-600 text-xs text-white rounded-full shadow-md cursor-pointer transition-colors"
                  >
                    {tag}
                  </motion.span>
                ))}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Main Content: Details & Tickets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Left Column: Event Description */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="lg:col-span-2 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 p-6 md:p-8 rounded-xl shadow-xl"
          >
            <button
              onClick={() => setShowDetail(v => !v)}
              className="w-full flex justify-between items-center text-lg font-semibold text-purple-300 mb-4 focus:outline-none bg-slate-900/60 px-4 py-2 rounded-lg"
            >
              Chi tiết sự kiện
              <span>{showDetail ? "▲" : "▼"}</span>
            </button>
            {showDetail && (
              Array.isArray(event.contents) && event.contents.length > 0 ? (
                <div className="flex flex-col gap-8">
                  {event.contents
                    .sort((a, b) => a.position - b.position)
                    .map((section, idx) => (
                      <div key={idx} className="flex flex-col md:flex-row gap-4 items-start bg-slate-700 rounded-lg p-4 shadow-md">
                        {section.imageUrl && (
                          <img
                            src={section.imageUrl}
                            alt={section.description?.slice(0, 30) || `section-${idx}`}
                            className="w-full md:w-64 h-48 object-cover rounded-lg mb-2 md:mb-0"
                          />
                        )}
                        {section.description && (
                          <div className="prose prose-invert max-w-none text-slate-200 text-base" dangerouslySetInnerHTML={{ __html: section.description }} />
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed">
                  <p>Không có mô tả cho sự kiện này.</p>
                </div>
              )
            )}

            {/* ====== COMMENT SECTION START ====== */}
            <CommentSection eventId={event.eventId} />
            {/* ====== COMMENT SECTION END ====== */}

          </motion.div>

          {/* Right Column: Tickets & Order */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="lg:col-span-1 space-y-6"
          >
            {isEventEnded && (
              <div className="text-center text-red-500 font-bold text-lg my-4">
                Sự kiện đã kết thúc, không thể mua vé.
              </div>
            )}
            <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 p-6 md:p-8 rounded-xl shadow-xl">
              <button
                onClick={() => setShowTickets(v => !v)}
                className="w-full flex justify-between items-center text-2xl font-semibold text-teal-300 mb-6 border-b-2 border-teal-700 pb-3 focus:outline-none bg-slate-900/60 px-4 py-2 rounded-lg"
              >
                <span className="flex items-center"><Ticket className="w-7 h-7 mr-3" /> Mua vé</span>
                <span>{showTickets ? "▲" : "▼"}</span>
              </button>
              {showTickets && (
                isEventEnded ? (
                  <div className="text-center text-red-400 py-8 font-semibold">Không thể mua vé vì sự kiện đã kết thúc.</div>
                ) : loadingTickets ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
                  </div>
                ) : tickets.length === 0 ? (
                  <p className="text-slate-400 text-center py-4">Hiện chưa có vé nào cho sự kiện này.</p>
                ) : (
                  <div className="space-y-5">
                    {tickets.map((ticket, index) => {
                      const quantity = selectedTickets[ticket.ticketId]?.quantity || 0;
                      const price = typeof ticket.ticketPrice === "number" ? ticket.ticketPrice : Number(ticket.ticketPrice) || 0;
                      const subtotal = price * quantity;
                      const maxPerOrder = ticket.maxTicketsPerOrder || ticket.quantityAvailable;
                      const canIncrease = quantity < Math.min(ticket.quantityAvailable, maxPerOrder);
                      return (
                        <motion.div
                          key={ticket.ticketId}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                          className="p-5 bg-slate-700 rounded-lg shadow-lg hover:shadow-purple-500/30 transition-shadow duration-300"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-semibold text-white">{ticket.ticketName}</h3>
                            <p className="text-xl font-bold text-teal-300">
                              {price.toLocaleString('vi-VN')} VNĐ
                            </p>
                          </div>
                          <p className="text-xs text-slate-400 mb-3">
                            Còn lại: {ticket.quantityAvailable - quantity} vé
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-3">
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleQuantityChange(ticket, quantity - 1)}
                                disabled={quantity === 0}
                                className="p-2 rounded-full bg-purple-600 hover:bg-purple-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                              >
                                <MinusCircle className="w-5 h-5 text-white" />
                              </motion.button>
                              <motion.span
                                key={quantity}
                                initial={{ scale: 1.2, color: '#fbbf24' }}
                                animate={{ scale: 1, color: '#fff' }}
                                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                                className="text-lg font-medium w-10 text-center"
                              >
                                {quantity}
                              </motion.span>
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleQuantityChange(ticket, quantity + 1)}
                                disabled={!canIncrease}
                                className="p-2 rounded-full bg-purple-600 hover:bg-purple-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                              >
                                <PlusCircle className="w-5 h-5 text-white" />
                              </motion.button>
                            </div>
                            <motion.div
                              key={subtotal}
                              initial={{ scale: 1.15, color: '#34d399' }}
                              animate={{ scale: 1, color: '#a7f3d0' }}
                              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                              className="text-base font-semibold min-w-[90px] text-right"
                            >
                              {subtotal > 0 ? `${subtotal.toLocaleString('vi-VN')} VNĐ` : ''}
                            </motion.div>
                          </div>
                          {!canIncrease && (
                            <div className="text-xs text-red-400 mt-1">
                              Đã đạt giới hạn số vé mua tối đa ({maxPerOrder} vé/lần)
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )
              )}
            </div>

            {/* Order Summary & Action */}
            {Object.keys(selectedTickets).length > 0 && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4 }}
                  className="bg-slate-800 p-6 rounded-xl shadow-xl overflow-hidden"
                >
                  <h3 className="text-xl font-semibold text-amber-400 mb-4 border-b border-amber-700 pb-2">Tóm tắt đơn hàng</h3>
                  <div className="space-y-2 mb-4">
                    {Object.values(selectedTickets).map(item => {
                      const price = typeof item.ticketPrice === "number" ? item.ticketPrice : Number(item.ticketPrice) || 0;
                      return (
                        <div key={item.ticketId} className="flex justify-between text-sm text-slate-300">
                          <span>{item.ticketName} (x{item.quantity})</span>
                          <span>{price * item.quantity > 0 ? (price * item.quantity).toLocaleString('vi-VN') : 0} VNĐ</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="border-t border-slate-700 pt-4 mb-4">
                    <motion.div
                      key={totalAmount}
                      initial={{ scale: 1.15, color: '#fbbf24' }}
                      animate={{ scale: 1, color: '#fde68a' }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="flex justify-between items-center text-lg font-bold"
                    >
                      <span className="text-slate-200">Tổng cộng:</span>
                      <span className="text-amber-400 text-2xl">{typeof totalAmount === "number"
                        ? totalAmount.toLocaleString('vi-VN')
                        : Number(totalAmount || 0).toLocaleString('vi-VN')} VNĐ</span>
                    </motion.div>
                  </div>
                  <div className="mb-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="border border-purple-300 rounded px-3 py-2 text-sm w-full text-black"
                        placeholder="Nhập mã giảm giá (nếu có)"
                        value={discountCode}
                        onChange={e => { setDiscountCode(e.target.value); setDiscountValidation(null); setAppliedDiscount(0); }}
                        disabled={validatingDiscount}
                      />
                      <button
                        type="button"
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded disabled:opacity-60"
                        onClick={handleValidateDiscount}
                        disabled={validatingDiscount || !discountCode.trim()}
                      >
                        {validatingDiscount ? <Loader2 className="w-4 h-4 animate-spin" /> : "Áp dụng"}
                      </button>
                    </div>
                    {discountValidation && (
                      <div className={`mt-2 text-sm ${discountValidation.success ? "text-green-400" : "text-red-400"}`}>
                        {discountValidation.message}
                        {discountValidation.success && appliedDiscount > 0 && (
                          <span> (-{appliedDiscount.toLocaleString('vi-VN')} VNĐ)</span>
                        )}
                      </div>
                    )}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.03, boxShadow: "0px 0px 15px rgba(56, 189, 248, 0.5)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreateOrder}
                    disabled={isCreatingOrder || totalAmount === 0}
                    className="w-full mt-2 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:from-sky-600 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isCreatingOrder ? (
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    ) : (
                      <ShoppingCart className="w-6 h-6 mr-2" />
                    )}
                    {isCreatingOrder ? "Đang xử lý..." : `Thanh toán (${selectedItemsCount} vé)`}
                  </motion.button>
                </motion.div>
              </AnimatePresence>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default EventDetail;
