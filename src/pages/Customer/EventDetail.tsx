/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import {
  Loader2,
  CalendarDays,
  MapPin,
  Ticket,
  ShoppingCart,
  AlertCircle,
  CheckCircle,
  MinusCircle,
  PlusCircle,
  MoreVertical,
  Flag,
} from 'lucide-react';
import {
  getEventById,
  getTicketsByEvent,
  validateDiscountCode,
  createOrderWithFace,
  getHomeEvents,
  getAIRecommendedEvents,
} from '@/services/Event Manager/event.service';
import { toast } from 'react-toastify';
import CommentSection from '@/components/Customer/CommentSection';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import ReportModal from '@/components/Customer/ReportModal';
import FaceCapture from '@/components/common/FaceCapture';
import { Camera } from 'lucide-react';
import { connectCommentHub, onComment } from '@/services/signalr.service';
import EventManagerInfoFollow from '@/components/Customer/EventManagerInfoFollow';
import { followEvent, unfollowEvent } from '@/services/follow.service';
import { useTranslation } from 'react-i18next';
import { EventChatAssistant } from '@/components/Customer/EventChatAssistant';
import { NO_IMAGE } from '@/assets/img';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import { Pagination, Navigation } from 'swiper/modules';
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
  createdBy: string; // userId của event manager
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

// Định nghĩa lại EventData nếu chưa có
interface EventData {
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
  isActive: boolean;
}

const EventDetail = () => {
  const { t } = useTranslation();
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
  const [discountCode, setDiscountCode] = useState('');
  const [discountValidation, setDiscountValidation] = useState<{
    success: boolean;
    message: string;
    discountAmount?: number;
  } | null>(null);
  const [validatingDiscount, setValidatingDiscount] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [reportModal, setReportModal] = useState<{ type: 'event' | 'comment'; id: string } | null>(
    null
  );
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [faceLoading, setFaceLoading] = useState(false);
  const [faceError, setFaceError] = useState('');
  const [isFollowingEvent, setIsFollowingEvent] = useState(false);
  const [loadingFollowEvent, setLoadingFollowEvent] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const [events, setEvents] = useState<EventData[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  let customerId = '';
  try {
    const accStr = localStorage.getItem('account');
    if (accStr) {
      const accObj = JSON.parse(accStr);
      // Nếu là LoginResponse lưu thẳng, lấy account.userId
      if (accObj.account && accObj.account.userId) {
        customerId = accObj.account.userId;
      } else if (accObj.userId) {
        customerId = accObj.userId;
      }
    }
  } catch {
    customerId = '';
  }

  const location = useLocation();
  useEffect(() => {
    return () => setReportModal(null);
  }, [location]);

  useEffect(() => {
    if (!eventId) {
      setError(t('eventIdNotFound'));
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
          setError(t('eventNotFoundOrCancelled'));
          setEvent(null);
        }
      } catch {
        setError(t('failedToLoadEventInfo'));
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
    setLoadingEvents(true);
    // Kiểm tra đăng nhập
    const accStr = localStorage.getItem('account');
    let isLoggedIn = false;
    if (accStr) {
      try {
        const accObj = JSON.parse(accStr);
        isLoggedIn = !!(accObj?.userId || accObj?.account?.userId);
      } catch {
        isLoggedIn = false;
      }
    }
    const fetchEvents = async () => {
      if (isLoggedIn) {
        // Nếu đã đăng nhập, gọi AI recommend
        try {
          const res = await getAIRecommendedEvents();
          const aiEvents = (res.data || []).filter((event: EventData) => event.eventId !== eventId);
          setEvents(aiEvents);
        } catch (error: unknown) {
          let msg = 'Lỗi khi lấy sự kiện đề xuất từ AI';
          if (typeof error === 'object' && error !== null) {
            if ('response' in error && typeof (error as any).response?.data?.message === 'string') {
              msg = (error as any).response.data.message;
            } else if ('message' in error && typeof (error as any).message === 'string') {
              msg = (error as any).message;
            }
          }
          toast.error(msg);
          setEvents([]);
        } finally {
          setLoadingEvents(false);
        }
      } else {
        // Nếu chưa đăng nhập, gọi getHomeEvents như cũ
        getHomeEvents()
          .then((fetchedEvents) => {
            const activeEvents = (fetchedEvents || []).filter(
              (event: EventData) => event.isActive === true && event.eventId !== eventId
            );
            setEvents(activeEvents);
          })
          .catch(() => setEvents([]))
          .finally(() => setLoadingEvents(false));
      }
    };
    fetchEvents();
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
          ticketPrice:
            typeof ticket.ticketPrice === 'number'
              ? ticket.ticketPrice
              : Number(ticket.ticketPrice) || 0,
        };
      }
      return updated;
    });
  };

  const calculateTotalAmount = () => {
    return Object.values(selectedTickets).reduce((total, item) => {
      const price =
        typeof item.ticketPrice === 'number' ? item.ticketPrice : Number(item.ticketPrice) || 0;
      return total + price * item.quantity;
    }, 0);
  };

  const handleCreateOrder = async () => {
    if (!eventId || Object.keys(selectedTickets).length === 0) {
      toast.warn(t('pleaseSelectAtLeastOneTicket'));
      return;
    }
    if (!customerId) {
      toast.error(t('customerInfoNotFound'));
      return;
    }

    // Kiểm tra giới hạn maxTicketsPerOrder cho từng vé
    for (const ticket of tickets) {
      const selected = selectedTickets[ticket.ticketId];
      if (selected) {
        const maxPerOrder = ticket.maxTicketsPerOrder || ticket.quantityAvailable;
        if (selected.quantity > maxPerOrder) {
          toast.error(t('maxTicketsPerOrderError', { maxPerOrder }));
          return;
        }
      }
    }

    // Lưu thông tin checkout vào localStorage
    const checkoutData = {
      eventId,
      eventName: event?.eventName || '',
      eventTime: `${event ? new Date(event.startAt).toLocaleString('vi-VN') : ''} - ${
        event ? new Date(event.endAt).toLocaleString('vi-VN') : ''
      }`,
      customerId,
      items: Object.values(selectedTickets).map((st) => ({
        ticketId: st.ticketId,
        ticketName: st.ticketName,
        ticketPrice: st.ticketPrice,
        quantity: st.quantity,
      })),
      discountCode: discountCode.trim() || undefined,
      discountAmount: appliedDiscount,
    };
    localStorage.setItem('checkout', JSON.stringify(checkoutData));
    toast.success(
      <>
        Chuyển sang xác nhận đơn! <CheckCircle className="inline w-5 h-5 ml-1" />
      </>
    );
    localStorage.setItem('lastEventId', eventId);
    navigate('/confirm-order');
    setIsCreatingOrder(false);
  };

  const handleValidateDiscount = async () => {
    if (!discountCode.trim()) {
      setDiscountValidation({ success: false, message: t('pleaseEnterDiscountCode') });
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
        setDiscountValidation({
          success: true,
          message: res.message || t('discountCodeValid'),
          discountAmount: res.data.discountAmount,
        });
        setAppliedDiscount(res.data.discountAmount || 0);
      } else {
        setDiscountValidation({ success: false, message: res.message || t('discountCodeInvalid') });
        setAppliedDiscount(0);
      }
    } catch (err) {
      setDiscountValidation({
        success: false,
        message: err?.response?.data?.message || t('discountCodeInvalid'),
      });
      setAppliedDiscount(0);
    } finally {
      setValidatingDiscount(false);
    }
  };

  const isEventEnded = event && new Date() > new Date(event.endAt);

  // Thêm hàm xử lý order bằng khuôn mặt
  const handleOrderWithFace = async ({ image }: { image: Blob }) => {
    setFaceLoading(true);
    setFaceError('');
    try {
      // Validate GUID
      const guidRegex =
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      if (!eventId || !guidRegex.test(eventId)) {
        toast.error(t('invalidEventId'));
        setFaceLoading(false);
        return;
      }
      if (!customerId || !guidRegex.test(customerId)) {
        toast.error(t('invalidCustomerId'));
        setFaceLoading(false);
        return;
      }
      if (Object.keys(selectedTickets).length === 0) {
        toast.warn(t('pleaseSelectAtLeastOneTicket'));
        setFaceLoading(false);
        return;
      }
      const items = Object.values(selectedTickets).map((st) => ({
        ticketId: st.ticketId,
        quantity: st.quantity,
      }));
      // Kiểm tra tất cả ticketId phải là GUID hợp lệ
      for (const item of items) {
        if (!guidRegex.test(item.ticketId)) {
          toast.error(t('invalidTicketId', { ticketId: item.ticketId }));
          setFaceLoading(false);
          return;
        }
      }
      const file = new File([image], 'face.jpg', { type: image.type || 'image/jpeg' });
      console.log('DEBUG FACE ORDER PAYLOAD', {
        eventId,
        customerId,
        items,
        discountCode: discountCode.trim() || undefined,
        faceImage: file,
      });
      const res = await createOrderWithFace({
        eventId,
        customerId,
        items,
        faceImage: file,
        discountCode: discountCode.trim() || undefined,
      });
      if (res && res.success && res.data) {
        // Lấy orderId an toàn
        let orderId = '';
        if (
          'orderId' in res.data &&
          typeof (res.data as unknown as { orderId?: unknown }).orderId === 'string'
        ) {
          orderId = (res.data as { orderId?: unknown }).orderId as string;
        } else if ('items' in res.data && Array.isArray((res.data as { items?: unknown }).items)) {
          const itemsArr = (res.data as { items?: unknown }).items as unknown[];
          const found = itemsArr.find(
            (item) => typeof (item as { orderId?: unknown }).orderId === 'string'
          );
          if (found) orderId = (found as { orderId: string }).orderId;
        }
        // Lưu thông tin checkout vào localStorage (giống flow thường)
        const checkoutData = {
          eventId,
          eventName: event?.eventName || '',
          eventTime: `${event ? new Date(event.startAt).toLocaleString('vi-VN') : ''} - ${
            event ? new Date(event.endAt).toLocaleString('vi-VN') : ''
          }`,
          customerId,
          items: Object.values(selectedTickets).map((st) => ({
            ticketId: st.ticketId,
            ticketName: st.ticketName,
            ticketPrice: st.ticketPrice,
            quantity: st.quantity,
          })),
          discountCode: discountCode.trim() || undefined,
          discountAmount: appliedDiscount,
          orderId,
          faceOrder: true,
        };
        localStorage.setItem('checkout', JSON.stringify(checkoutData));
        toast.success(t('faceOrderSuccess'));
        setShowFaceModal(false);
        navigate('/confirm-order');
      } else {
        throw new Error(res?.message || t('faceOrderFailed'));
      }
    } catch (e: unknown) {
      const msg =
        typeof e === 'object' && e && 'message' in e
          ? (e as { message?: string }).message
          : undefined;
      setFaceError(msg || t('faceOrderFailed'));
      toast.error(msg || t('faceOrderFailed'));
    } finally {
      setFaceLoading(false);
    }
  };

  const handleFollowEvent = async () => {
    if (!event?.eventId) return;
    setLoadingFollowEvent(true);
    try {
      if (isFollowingEvent) {
        await unfollowEvent(event.eventId);
        setIsFollowingEvent(false);
      } else {
        await followEvent(event.eventId);
        setIsFollowingEvent(true);
      }
    } finally {
      setLoadingFollowEvent(false);
    }
  };

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
        <h2 className="text-3xl font-semibold text-red-700 mb-4">{t('errorOccurred')}</h2>
        <p className="text-red-600 text-lg">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-8 px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-all duration-300"
        >
          {t('backToHome')}
        </button>
      </motion.div>
    );
  }

  if (!event) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <p className="text-xl text-gray-500">{t('eventInfoNotFound')}</p>
      </div>
    );
  }

  const totalAmount = Math.max(0, calculateTotalAmount() - appliedDiscount);
  const selectedItemsCount = Object.values(selectedTickets).reduce(
    (sum, item) => sum + item.quantity,
    0
  );

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
          {/* Nút 3 chấm overlay trên ảnh */}
          <div className="absolute top-4 right-4 z-20">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700">
                  <MoreVertical className="w-5 h-5 text-white" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setTimeout(() => setReportModal({ type: 'event', id: event.eventId }), 10);
                  }}
                  className="flex items-center gap-2 text-red-600 font-semibold cursor-pointer hover:bg-red-50 rounded px-3 py-2"
                >
                  <Flag className="w-4 h-4" /> {t('reportEvent')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <img
            src={
              event.eventCoverImageUrl ||
              'https://via.placeholder.com/1200x500/334155/94a3b8?text=Event+Cover'
            }
            alt={event.eventName}
            className="w-full h-full object-cover "
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full">
            <div className="flex items-center justify-between">
              <motion.h1
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="text-3xl md:text-5xl font-bold text-white mb-2 shadow-text"
              >
                {event.eventName}
              </motion.h1>
            </div>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="flex flex-wrap items-center text-purple-300 space-x-4 text-sm md:text-base mb-2"
            >
              <span className="flex items-center">
                <CalendarDays className="w-5 h-5 mr-2" />{' '}
                {new Date(event.startAt).toLocaleDateString('vi-VN')} -{' '}
                {new Date(event.endAt).toLocaleDateString('vi-VN')}
              </span>
              <span className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" /> {event.eventLocation}
              </span>
            </motion.div>
            {event.tags && event.tags.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
                className="flex flex-wrap gap-2 mt-1 items-center"
              >
                {(showAllTags ? event.tags : event.tags.slice(0, 3)).map((tag, index) => (
                  <motion.span
                    key={index}
                    whileHover={{ scale: 1.1, backgroundColor: '#a78bfa' }}
                    className="px-3 py-1 bg-purple-600 text-xs text-white rounded-full shadow-md cursor-pointer transition-colors"
                  >
                    {tag}
                  </motion.span>
                ))}
                {event.tags.length > 3 && !showAllTags && (
                  <button
                    className="px-3 py-1 bg-gray-200 text-xs text-gray-700 rounded-full shadow-md font-semibold hover:bg-gray-300 transition-colors"
                    onClick={() => setShowAllTags(true)}
                  >
                    +{event.tags.length - 3} {t('otherTags')}
                  </button>
                )}
                {/* Nút theo dõi sự kiện */}
                {event?.eventId && (
                  <button
                    onClick={handleFollowEvent}
                    disabled={loadingFollowEvent}
                    className={`ml-4 px-3 py-1.5 rounded-full font-semibold transition-all shadow flex items-center gap-1 whitespace-nowrap text-sm
                      ${
                        isFollowingEvent
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300'
                          : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                      }
                    `}
                  >
                    {isFollowingEvent ? (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M18 12H6"
                          />
                        </svg>
                        {t('unfollowEvent')}
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v12m6-6H6"
                          />
                        </svg>
                        {t('followEvent')}
                      </>
                    )}
                  </button>
                )}
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
            {/* Thông tin Event Manager + nút Theo dõi */}
            {event?.createdBy && <EventManagerInfoFollow eventManagerId={event.createdBy} />}
            <button
              onClick={() => setShowDetail((v) => !v)}
              className="w-full flex justify-between items-center text-lg font-semibold text-purple-300 mb-4 focus:outline-none bg-slate-900/60 px-4 py-2 rounded-lg"
            >
              {t('eventDetails')}
              <span>{showDetail ? '▲' : '▼'}</span>
            </button>
            {showDetail &&
              (Array.isArray(event.contents) && event.contents.length > 0 ? (
                <div className="flex flex-col gap-8">
                  {event.contents
                    .sort((a, b) => a.position - b.position)
                    .map((section, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col md:flex-row gap-4 items-start bg-slate-700 rounded-lg p-4 shadow-md"
                      >
                        {section.imageUrl && (
                          <img
                            src={section.imageUrl}
                            alt={section.description?.slice(0, 30) || `section-${idx}`}
                            className="w-full md:w-64 h-48 object-cover rounded-lg mb-2 md:mb-0"
                          />
                        )}
                        {section.description && (
                          <div
                            className="prose prose-invert max-w-none text-slate-200 text-base"
                            dangerouslySetInnerHTML={{ __html: section.description }}
                          />
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed">
                  <p>{t('noEventDescription')}</p>
                </div>
              ))}

            {/* ====== COMMENT SECTION START ====== */}
            <CommentSection eventId={event.eventId} setReportModal={setReportModal} />
            {/* ====== COMMENT SECTION END ====== */}

            {/* ====== EVENT CHAT ASSISTANT ====== */}
            <div className="mt-8">
              <EventChatAssistant eventId={event.eventId} eventName={event.eventName} />
            </div>
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
                {t('eventEndedCannotBuyTickets')}
              </div>
            )}
            <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 p-6 md:p-8 rounded-xl shadow-xl">
              <button
                onClick={() => setShowTickets((v) => !v)}
                className="w-full flex justify-between items-center text-2xl font-semibold text-teal-300 mb-6 border-b-2 border-teal-700 pb-3 focus:outline-none bg-slate-900/60 px-4 py-2 rounded-lg"
              >
                <span className="flex items-center">
                  <Ticket className="w-7 h-7 mr-3" /> {t('buyTickets')}
                </span>
                <span>{showTickets ? '▲' : '▼'}</span>
              </button>
              {showTickets &&
                (isEventEnded ? (
                  <div className="text-center text-red-400 py-8 font-semibold">
                    {t('cannotBuyTicketsEventEnded')}
                  </div>
                ) : loadingTickets ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
                  </div>
                ) : tickets.length === 0 ? (
                  <p className="text-slate-400 text-center py-4">
                    {t('noTicketsAvailableForThisEvent')}
                  </p>
                ) : (
                  <div className="space-y-5">
                    {tickets.map((ticket, index) => {
                      const quantity = selectedTickets[ticket.ticketId]?.quantity || 0;
                      const price =
                        typeof ticket.ticketPrice === 'number'
                          ? ticket.ticketPrice
                          : Number(ticket.ticketPrice) || 0;
                      const subtotal = price * quantity;
                      const maxPerOrder = ticket.maxTicketsPerOrder || ticket.quantityAvailable;
                      const canIncrease =
                        quantity < Math.min(ticket.quantityAvailable, maxPerOrder);
                      return (
                        <motion.div
                          key={ticket.ticketId}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                          className="p-5 bg-slate-700 rounded-lg shadow-lg hover:shadow-purple-500/30 transition-shadow duration-300"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-semibold text-white">
                              {ticket.ticketName}
                            </h3>
                            <p className="text-xl font-bold text-teal-300">
                              {price.toLocaleString('vi-VN')} VNĐ
                            </p>
                          </div>
                          <p className="text-xs text-slate-400 mb-3">
                            {t('remainingTickets', {
                              remaining: ticket.quantityAvailable - quantity,
                            })}
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
                              {t('maxTicketsPerOrderError', { maxPerOrder })}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                ))}
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
                  <h3 className="text-xl font-semibold text-amber-400 mb-4 border-b border-amber-700 pb-2">
                    {t('orderSummary')}
                  </h3>
                  <div className="space-y-2 mb-4">
                    {Object.values(selectedTickets).map((item) => {
                      const price =
                        typeof item.ticketPrice === 'number'
                          ? item.ticketPrice
                          : Number(item.ticketPrice) || 0;
                      return (
                        <div
                          key={item.ticketId}
                          className="flex justify-between text-sm text-slate-300"
                        >
                          <span>
                            {item.ticketName} (x{item.quantity})
                          </span>
                          <span>
                            {price * item.quantity > 0
                              ? (price * item.quantity).toLocaleString('vi-VN')
                              : 0}{' '}
                            VNĐ
                          </span>
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
                      <span className="text-slate-200">{t('total')}:</span>
                      <span className="text-amber-400 text-2xl">
                        {typeof totalAmount === 'number'
                          ? totalAmount.toLocaleString('vi-VN')
                          : Number(totalAmount || 0).toLocaleString('vi-VN')}{' '}
                        VNĐ
                      </span>
                    </motion.div>
                  </div>
                  <div className="mb-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="border border-purple-300 rounded px-3 py-2 text-sm w-56 max-w-xs text-black"
                        placeholder={t('enterDiscountCode')}
                        value={discountCode}
                        onChange={(e) => {
                          setDiscountCode(e.target.value);
                          setDiscountValidation(null);
                          setAppliedDiscount(0);
                        }}
                        disabled={validatingDiscount}
                      />
                      <button
                        type="button"
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded disabled:opacity-60"
                        onClick={handleValidateDiscount}
                        disabled={validatingDiscount || !discountCode.trim()}
                      >
                        {validatingDiscount ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          t('applyDiscount')
                        )}
                      </button>
                    </div>
                    {discountValidation && (
                      <div
                        className={`mt-2 text-sm ${
                          discountValidation.success ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {discountValidation.message}
                        {discountValidation.success && appliedDiscount > 0 && (
                          <span> (-{appliedDiscount.toLocaleString('vi-VN')} VNĐ)</span>
                        )}
                      </div>
                    )}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.03, boxShadow: '0px 0px 15px rgba(56, 189, 248, 0.5)' }}
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
                    {isCreatingOrder
                      ? t('processingOrder')
                      : `${t('bookTickets', { count: selectedItemsCount })}`}
                  </motion.button>
                  {/* Nút đặt vé bằng khuôn mặt */}
                  <motion.button
                    whileHover={{ scale: 1.03, boxShadow: '0px 0px 15px rgba(168,85,247,0.5)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowFaceModal(true);
                      setFaceError('');
                    }}
                    disabled={isCreatingOrder || faceLoading || totalAmount === 0}
                    className="w-full mt-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:from-purple-700 hover:to-pink-600 transition-all duration-300 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {faceLoading ? (
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    ) : (
                      <Camera className="w-6 h-6 mr-2" />
                    )}
                    {faceLoading ? t('processingFaceOrder') : t('bookTicketsWithFace')}
                  </motion.button>
                </motion.div>
              </AnimatePresence>
            )}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="lg:col-span-4 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 p-6 md:p-8 rounded-xl shadow-xl"
          >
            <h2 className="text-xl font-bold text-white mb-4 text-center">Recommend Events</h2>
            {loadingEvents ? (
              <div className="flex justify-center items-center h-60">
                <Loader2 className="animate-spin w-10 h-10 text-gray-400" />
              </div>
            ) : events.length === 0 ? (
              <div className="text-center text-lg text-gray-400">No events found</div>
            ) : (
              <Swiper
                slidesPerView={1}
                spaceBetween={24}
                breakpoints={{
                  640: { slidesPerView: 1.2 },
                  768: { slidesPerView: 2 },
                  1024: { slidesPerView: 3 },
                  1440: { slidesPerView: 3 }, // Thêm breakpoint cho desktop lớn
                }}
                pagination={{ clickable: true, type: 'fraction' }}
                navigation={true}
                modules={[Pagination, Navigation]}
                className="event-card-slider"
              >
                {events.map((event) => (
                  <SwiperSlide key={event.eventId}>
                    <div
                      className="group bg-white/90 rounded-2xl shadow-xl border border-gray-200 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full"
                      onClick={() => navigate(`/event/${event.eventId}`)}
                    >
                      <div className="relative h-48 w-full overflow-hidden">
                        <img
                          src={event.eventCoverImageUrl ? event.eventCoverImageUrl : NO_IMAGE}
                          alt={event.eventName}
                          className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = NO_IMAGE;
                          }}
                        />
                        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-white/90 to-transparent" />
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors duration-200 line-clamp-1">
                          {event.eventName}
                        </h3>
                        {/* Thêm thông tin khác nếu muốn */}
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            )}
          </motion.div>
        </div>
      </div>
      {reportModal && (
        <ReportModal
          key={reportModal.id}
          open={Boolean(reportModal)}
          targetType={reportModal.type}
          targetId={reportModal.id}
          onClose={() => setReportModal(null)}
        />
      )}
      {/* Modal FaceCapture */}
      {showFaceModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
              onClick={() => setShowFaceModal(false)}
              aria-label="Đóng"
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4 text-center text-black">
              {t('bookTicketsWithFace')}
            </h2>
            {faceError && <div className="text-red-500 text-center mb-2">{faceError}</div>}
            <FaceCapture
              onCapture={handleOrderWithFace}
              onError={(err) => setFaceError(err)}
              onCancel={() => setShowFaceModal(false)}
            />
          </div>
        </div>
      )}
      <style>{`
  .event-card-slider .swiper-slide {
    overflow: visible !important;
  }
  .event-card-slider .swiper-pagination {
    position: static !important;
    margin-top: 24px;
    text-align: center;
    z-index: 10;
  }

  .event-card-slider .swiper-button-next,
  .event-card-slider .swiper-button-prev {
    top: 50%;
    transform: translateY(-50%);
  }
`}</style>
    </motion.div>
  );
};

export default EventDetail;
