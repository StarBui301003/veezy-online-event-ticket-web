/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useContext } from 'react';
import { useRequireLogin } from '@/hooks/useRequireLogin';
import { AuthContext } from '@/contexts/AuthContext';
import AuthModals from '@/components/AuthModals';

// Thêm import cho RegisterModal
import { RegisterModal } from '@/components/RegisterModal';
import { useParams, useNavigate } from 'react-router-dom';
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
  Camera,
} from 'lucide-react';
import {
  getEventById,
  getTicketsByEvent,
  validateDiscountCode,
  createOrderWithFace,
  getHomeEvents,
  getAIRecommendedEvents,
  getOrderById,
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
import { connectCommentHub, onComment, offComment, onEvent } from '@/services/signalr.service';
import EventManagerInfoFollow from '@/components/Customer/EventManagerInfoFollow';
import { followEvent, unfollowEvent, checkFollowEventByList } from '@/services/follow.service';
import { useTranslation } from 'react-i18next';
import { EventChatAssistant } from '@/components/Customer/EventChatAssistant';
import { EventManagerChatBox } from '@/components/Customer/EventManagerChatBox';
import { NO_IMAGE } from '@/assets/img';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';

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
  // Thêm state cho modal đăng nhập
  const { requireLogin } = useRequireLogin();
  const { t } = useTranslation();
  const { getThemeClass } = useThemeClasses();
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
  const [showReportModal, setShowReportModal] = useState(false);
  const [pendingReport, setPendingReport] = useState<{
    type: 'event' | 'comment';
    id: string;
  } | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false); // Added missing state
  const [isFollowingEvent, setIsFollowingEvent] = useState(false);
  const [loadingFollowEvent, setLoadingFollowEvent] = useState(false);
  const [pendingFollow, setPendingFollow] = useState(false);
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [faceLoading, setFaceLoading] = useState(false);
  const [faceError, setFaceError] = useState('');
  const [showAllTags, setShowAllTags] = useState(false);
  const [events, setEvents] = useState<EventData[]>([]);

  // Lấy user từ AuthContext để đồng bộ trạng thái đăng nhập
  const { isLoggedIn, user } = useContext(AuthContext);
  const customerId = user?.userId || user?.accountId || '';

  // Handle successful login and pending actions
  useEffect(() => {
    if (isLoggedIn) {
      if (pendingReport) {
        setShowReportModal(true);
      } else if (pendingFollow) {
        handleFollowEvent();
      }
    }
  }, [isLoggedIn]);

  // Handle report event
  const handleReportEvent = () => {
    const reportInfo = { type: 'event' as const, id: eventId || '' };
    if (!isLoggedIn) {
      setPendingReport(reportInfo);
      setShowLoginModal(true);
    } else {
      setPendingReport(reportInfo);
      setShowReportModal(true);
    }
  };

  // Handle report comment
  const handleReportComment = (report: { type: 'comment'; id: string }) => {
    if (!isLoggedIn) {
      setPendingReport(report);
      setShowLoginModal(true);
    } else {
      setPendingReport(report);
      setShowReportModal(true);
    }
  };

  // Handle login required from ReportModal
  const handleLoginRequired = () => {
    setShowReportModal(false);
    setShowLoginModal(true);
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    setShowRegisterModal(false);
    // If there was a pending follow action, execute it
    if (pendingFollow) {
      handleFollowEvent();
    }
  };

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

  // ================== FIX: Kiểm tra trạng thái đã follow khi vào trang ==================
  useEffect(() => {
    if (!eventId || !customerId) return;

    const checkStatus = async () => {
      try {
        const isFollowing = await checkFollowEventByList(customerId, eventId);
        setIsFollowingEvent(!!isFollowing);
      } catch (error) {
        console.error('Error checking follow status:', error);
        setIsFollowingEvent(false);
      }
    };

    checkStatus();
  }, [eventId, customerId]);
  // =======================================================================================

  useEffect(() => {
    setLoadingEvent(true);
    const fetchEvents = async () => {
      if (isLoggedIn) {
        try {
          const res = await getAIRecommendedEvents();
          const aiEvents = (res.data || []).filter(
            (eventItem: EventData) => eventItem.eventId !== eventId
          );
          setEvents(aiEvents);
        } catch (error: unknown) {
          let msg = 'Lỗi khi lấy sự kiện đề xuất từ AI';
          if (typeof error === 'object' && error !== null) {
            const errorObj = error as Record<string, unknown>;
            if (
              'response' in errorObj &&
              typeof errorObj.response === 'object' &&
              errorObj.response !== null
            ) {
              const response = errorObj.response as Record<string, unknown>;
              if (
                'data' in response &&
                typeof response.data === 'object' &&
                response.data !== null
              ) {
                const data = response.data as Record<string, unknown>;
                if ('message' in data && typeof data.message === 'string') {
                  msg = data.message;
                }
              }
            } else if ('message' in errorObj && typeof errorObj.message === 'string') {
              msg = errorObj.message;
            }
          }
          toast.error(msg);
          setEvents([]);
        } finally {
          setLoadingEvent(false);
        }
      } else {
        getHomeEvents()
          .then((fetchedEvents) => {
            const activeEvents = (fetchedEvents || []).filter(
              (eventItem: EventData) => eventItem.isActive === true && eventItem.eventId !== eventId
            );
            setEvents(activeEvents);
          })
          .catch(() => setEvents([]))
          .finally(() => setLoadingEvent(false));
      }
    };
    fetchEvents();
  }, [eventId, isLoggedIn]);

  useEffect(() => {
    const COMMENT_HUB_URL = ((import.meta as any)?.env?.VITE_COMMENT_HUB_URL as string)
      || (process.env as any)?.REACT_APP_COMMENT_HUB_URL
      || '/commentHub';
    connectCommentHub(COMMENT_HUB_URL);
    const reloadComment = () => {};
    onComment('OnCommentCreated', reloadComment);
    onComment('OnCommentUpdated', reloadComment);
    onComment('OnCommentDeleted', reloadComment);
    return () => {
      offComment('OnCommentCreated', reloadComment);
      offComment('OnCommentUpdated', reloadComment);
      offComment('OnCommentDeleted', reloadComment);
    };
  }, []);

  // Realtime events for event updates - simplified
  useEffect(() => {
    if (!eventId) return;

    // Listen for event updates
    onEvent('OnEventUpdated', (data: any) => {
      if (data.eventId === eventId || data.EventId === eventId) {
        console.log('Event updated:', data);
        toast.info(t('eventHasBeenUpdated'));
        // Refresh event data
        getEventById(eventId)
          .then((eventData) => {
            if (eventData && eventData.isApproved === 1 && !eventData.isCancelled) {
              setEvent(eventData);
            }
          })
          .catch(console.error);
      }
    });

    onEvent('OnEventCancelled', (data: any) => {
      if (data.eventId === eventId || data.EventId === eventId) {
        console.log('Event cancelled:', data);
        toast.error(t('eventHasBeenCancelled'));
        setEvent((prev) => (prev ? { ...prev, isCancelled: true } : null));
      }
    });

    onEvent('OnEventApproved', (data: any) => {
      if (data.eventId === eventId || data.EventId === eventId) {
        console.log('Event approved:', data);
        toast.success(t('eventHasBeenApproved'));
        getEventById(eventId).then(setEvent).catch(console.error);
      }
    });

    // Listen for ticket updates
    onEvent('OnTicketSoldIncremented', (data: any) => {
      const ticketEventId = data.eventId || data.EventId;
      if (ticketEventId === eventId) {
        console.log('Ticket sold:', data);
        // Update ticket availability
        setTickets((prev) =>
          prev.map((ticket) => {
            if (ticket.ticketId === (data.ticketId || data.TicketId)) {
              const newQuantity = Math.max(0, ticket.quantityAvailable - (data.quantity || 1));
              return { ...ticket, quantityAvailable: newQuantity };
            }
            return ticket;
          })
        );
      }
    });

    onEvent('OnTicketSoldDecremented', (data: any) => {
      const ticketEventId = data.eventId || data.EventId;
      if (ticketEventId === eventId) {
        console.log('Ticket refunded:', data);
        setTickets((prev) =>
          prev.map((ticket) => {
            if (ticket.ticketId === (data.ticketId || data.TicketId)) {
              return {
                ...ticket,
                quantityAvailable: ticket.quantityAvailable + (data.quantity || 1),
              };
            }
            return ticket;
          })
        );
      }
    });

    // Cleanup on unmount - connections are managed globally in App.tsx
    return () => {
      // No cleanup needed - SignalR connections are handled globally
    };
  }, [eventId]);

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
    // ...removed log...
    if (!eventId || Object.keys(selectedTickets).length === 0) {
      toast.warn(t('pleaseSelectAtLeastOneTicket'));
      return;
    }
    // Kiểm tra đăng nhập, nếu chưa thì hiện modal
    requireLogin(() => {
      // Sau khi login modal, luôn lấy user và customerId mới nhất từ AuthContext
      const latestUser = user;
      const latestCustomerId = latestUser?.userId || latestUser?.accountId || '';
      // Chỉ cho phép role customer mua vé
      if (!latestUser || latestUser.role !== 1) {
        toast.error(t('onlyCustomerCanBuyTicket'));
        return;
      }
      if (!latestCustomerId) {
        toast.error(t('customerInfoNotFound'));
        return;
      }
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
      const checkoutData = {
        eventId,
        eventName: event?.eventName || '',
        eventTime: `${event ? new Date(event.startAt).toLocaleString('vi-VN') : ''} - ${
          event ? new Date(event.endAt).toLocaleString('vi-VN') : ''
        }`,
        customerId: latestCustomerId,
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
    });
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
      // FIX: Use the subtotal (before any discount) as orderAmount for validation
      const orderAmount = calculateTotalAmount(); // This is the subtotal before discount

      const res = await validateDiscountCode(String(eventId), discountCode.trim(), orderAmount);

      if (res && res.flag && res.data) {
        if (res.data.isValid) {
          setDiscountValidation({
            success: true,
            message: res.data.message || t('discountCodeValid'),
            discountAmount: res.data.discountAmount,
          });
          setAppliedDiscount(res.data.discountAmount || 0);
        } else {
          setDiscountValidation({
            success: false,
            message: res.data.message || t('discountCodeInvalid'),
            discountAmount: 0,
          });
          setAppliedDiscount(0);
        }
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

  // Thêm hàm xử lý order bằng khuôn mặt - ĐÃ SỬA
  const handleOrderWithFace = async ({ image }: { image: Blob }) => {
    // ...removed log...
    if (faceLoading) return; // Prevent duplicate submissions
    setFaceLoading(true);
    setFaceError('');
    try {
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
      for (const item of items) {
        if (!guidRegex.test(item.ticketId)) {
          toast.error(t('invalidTicketId', { ticketId: item.ticketId }));
          setFaceLoading(false);
          return;
        }
      }
      const file = new File([image], 'face.jpg', { type: image.type || 'image/jpeg' });
      const res = await createOrderWithFace({
        eventId,
        customerId,
        items,
        faceImage: file,
        discountCode: discountCode.trim() || undefined,
      });

      if (!res || res.success === false) {
        // Show backend error message if present
        const msg = res?.message || t('faceOrderFailed');
        setFaceError(msg);
        toast.error(msg);
        setFaceLoading(false);
        return;
      }

      // FIX: Đơn giản hóa việc lấy orderId
      let orderId = '';
      if (
        res.success &&
        res.data &&
        typeof res.data === 'object' &&
        res.data !== null &&
        'orderId' in res.data &&
        typeof (res.data as unknown as Record<string, unknown>).orderId === 'string'
      ) {
        orderId = (res.data as unknown as Record<string, unknown>).orderId as string;
      }

      if (!orderId) {
        // Show backend message if present, else fallback
        const msg = res?.message || t('faceOrderFailed');
        setFaceError(msg);
        toast.error(msg);
        setFaceLoading(false);
        return;
      }

      // Lấy lại thông tin order thực tế từ server
      const orderInfo = await getOrderById(orderId);
      if (
        !orderInfo ||
        !orderInfo.items ||
        orderInfo.items.length === 0 ||
        orderInfo.totalAmount === 0
      ) {
        setFaceError(t('faceOrderFailed'));
        toast.error(t('faceOrderFailed'));
        setFaceLoading(false);
        return;
      }
      const checkoutData = {
        eventId,
        eventName: event?.eventName || '',
        eventTime: `${event ? new Date(event.startAt).toLocaleString('vi-VN') : ''} - ${
          event ? new Date(event.endAt).toLocaleString('vi-VN') : ''
        }`,
        customerId,
        items: orderInfo.items, // Lưu items từ order thực tế
        discountCode: orderInfo.discountCode,
        discountAmount: orderInfo.discountAmount || 0,
        orderId,
        faceOrder: true,
        totalAmount: orderInfo.totalAmount,
      };
      localStorage.setItem('checkout', JSON.stringify(checkoutData));
      toast.success(t('faceOrderSuccess'));
      setShowFaceModal(false);
      navigate('/confirm-order');
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

  // Handle follow/unfollow event
  const handleFollowEvent = async () => {
    if (!isLoggedIn) {
      setPendingFollow(true);
      setShowLoginModal(true);
      return;
    }
    if (!eventId) return;

    setLoadingFollowEvent(true);
    try {
      if (isFollowingEvent) {
        await unfollowEvent(eventId);
        toast.success(t('unfollowedEvent'));
      } else {
        await followEvent(eventId);
        toast.success(t('followedEvent'));
      }
      setIsFollowingEvent(!isFollowingEvent);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || t('somethingWentWrong');
      toast.error(errorMessage);
      if (errorMessage.includes('Already following')) {
        setIsFollowingEvent(true);
      }
    } finally {
      setLoadingFollowEvent(false);
      setPendingFollow(false);
    }
  };

  if (loadingEvent) {
    return (
      <div
        className={cn(
          'flex justify-center items-center min-h-screen',
          getThemeClass(
            'bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100',
            'bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100'
          )
        )}
      >
        <Loader2
          className={cn(
            'w-16 h-16 animate-spin',
            getThemeClass('text-indigo-600', 'text-indigo-600')
          )}
        />
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'flex flex-col justify-center items-center min-h-screen p-8 text-center',
          getThemeClass('bg-red-50/80', 'bg-red-900/20')
        )}
      >
        <AlertCircle
          className={cn('w-20 h-20 mb-6', getThemeClass('text-red-600', 'text-red-500'))}
        />
        <h2
          className={cn(
            'text-3xl font-semibold mb-4',
            getThemeClass('text-red-700', 'text-red-400')
          )}
        >
          {t('errorOccurred')}
        </h2>
        <p className={cn('text-lg', getThemeClass('text-red-600', 'text-red-300'))}>{error}</p>
        <button
          onClick={() => navigate('/')}
          className={cn(
            'mt-8 px-8 py-3 font-semibold rounded-lg shadow-md transition-all duration-300',
            getThemeClass(
              'bg-indigo-600 text-white hover:bg-indigo-700',
              'bg-indigo-500 text-white hover:bg-indigo-600'
            )
          )}
        >
          {t('backToHome')}
        </button>
      </motion.div>
    );
  }

  if (!event) {
    return (
      <div
        className={cn(
          'flex justify-center items-center min-h-screen',
          getThemeClass(
            'bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100',
            'bg-gray-900'
          )
        )}
      >
        <p className={cn('text-xl', getThemeClass('text-gray-600', 'text-gray-400'))}>
          {t('eventInfoNotFound')}
        </p>
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
      className={cn(
        'min-h-screen pt-20 pb-12',
        getThemeClass(
          'bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 text-gray-900',
          'bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white'
        )
      )}
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
                <button
                  className={cn(
                    'p-1.5 rounded-full border transition-colors',
                    getThemeClass(
                      'bg-white/90 hover:bg-white border-gray-300 shadow-md',
                      'bg-slate-800 hover:bg-slate-700 border-slate-700'
                    )
                  )}
                >
                  <MoreVertical
                    className={cn('w-5 h-5', getThemeClass('text-gray-700', 'text-white'))}
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    handleReportEvent();
                  }}
                  className={cn(
                    'flex items-center gap-2 font-semibold cursor-pointer rounded px-3 py-2',
                    getThemeClass(
                      'text-red-600 hover:bg-red-50',
                      'text-red-400 hover:bg-red-800/30'
                    )
                  )}
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
                className={cn(
                  'text-3xl md:text-5xl font-bold mb-2 shadow-text',
                  getThemeClass('text-white', 'text-white')
                )}
              >
                {event.eventName}
              </motion.h1>
            </div>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className={cn(
                'flex flex-wrap items-center space-x-4 text-sm md:text-base mb-2',
                getThemeClass('text-blue-600', 'text-purple-300')
              )}
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
                    className={cn(
                      'px-3 py-1 text-xs rounded-full shadow-md cursor-pointer transition-colors',
                      getThemeClass('bg-purple-600 text-white', 'bg-purple-600 text-white')
                    )}
                  >
                    {tag}
                  </motion.span>
                ))}
                {event.tags.length > 3 && !showAllTags && (
                  <button
                    className={cn(
                      'px-3 py-1 text-xs rounded-full shadow-md font-semibold transition-colors',
                      getThemeClass(
                        'bg-gray-200 text-gray-700 hover:bg-gray-300',
                        'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      )
                    )}
                    onClick={() => setShowAllTags(true)}
                  >
                    +{event.tags.length - 3}{' '}
                    {t('eventDetail.otherTags', { count: event.tags.length - 3 })}
                  </button>
                )}
                {/* Nút theo dõi sự kiện */}
                {event?.eventId && (
                  <motion.button
                    onClick={handleFollowEvent}
                    disabled={loadingFollowEvent}
                    className={cn(
                      'ml-4 px-4 py-2 rounded-full font-semibold transition-all shadow flex items-center gap-2 whitespace-nowrap text-sm',
                      isFollowingEvent
                        ? getThemeClass(
                            'bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300',
                            'bg-gray-700 text-white hover:bg-gray-600 border-gray-600'
                          )
                        : getThemeClass(
                            'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-600',
                            'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-600'
                          )
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {loadingFollowEvent ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('processing')}...
                      </>
                    ) : isFollowingEvent ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        {t('unfollowEvent')}
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-4 h-4" />
                        {t('eventDetail.followEvent')}
                      </>
                    )}
                  </motion.button>
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
            className={cn(
              'lg:col-span-2 p-6 md:p-8 rounded-xl shadow-xl',
              getThemeClass(
                'bg-white/95 border border-gray-200 shadow-lg',
                'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800'
              )
            )}
          >
            {/* Thông tin Event Manager + nút Theo dõi */}
            {event?.createdBy && <EventManagerInfoFollow eventManagerId={event.createdBy} />}
            <button
              onClick={() => setShowDetail((v) => !v)}
              className={cn(
                'w-full flex justify-between items-center text-lg font-semibold mb-4 focus:outline-none px-4 py-2 rounded-lg transition-colors',
                getThemeClass(
                  'text-blue-600 bg-blue-50/50 border  hover:bg-blue-100 border-b border-blue-300',
                  'text-purple-300 bg-slate-900/60 hover:bg-slate-800  border-b border-purple-700'
                )
              )}
            >
              {t('eventDetails')}
              <span>{showDetail ? '▲' : '▼'}</span>
            </button>
            {showDetail &&
              (Array.isArray(event.contents) && event.contents.length > 0 ? (
                <div
                  className={cn(
                    'flex flex-col gap-8 rounded-xl',
                    getThemeClass('bg-blue-50/75', 'bg-gray-800')
                  )}
                >
                  {event.contents
                    .sort((a, b) => a.position - b.position)
                    .map((section, idx) => (
                      <div
                        key={idx}
                        className={cn('flex flex-col md:flex-row gap-4 items-start p-4')}
                      >
                        {section.imageUrl && (
                          <img
                            src={section.imageUrl}
                            alt={section.description?.slice(0, 30) || `section-${idx}`}
                            className="w-full md:w-64 h-48 object-cover mb-2 md:mb-0"
                          />
                        )}
                        {section.description && (
                          <div
                            className={cn(
                              'prose max-w-none text-base',
                              getThemeClass(
                                'prose-gray text-gray-700',
                                'prose-invert text-slate-200'
                              )
                            )}
                            dangerouslySetInnerHTML={{ __html: section.description }}
                          />
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <div
                  className={cn(
                    'prose max-w-none leading-relaxed',
                    getThemeClass('prose-gray text-gray-600', 'prose-invert text-slate-300')
                  )}
                >
                  <p>{t('noEventDescription')}</p>
                </div>
              ))}

            {/* ====== COMMENT SECTION START ====== */}
            <CommentSection eventId={event.eventId} setReportModal={handleReportComment} />
            {/* ====== COMMENT SECTION END ====== */}

            {/* ====== EVENT CHAT ASSISTANT ====== */}
            <div className="mt-8">
              <EventChatAssistant eventId={event.eventId} eventName={event.eventName} />
            </div>

            {/* ====== EVENT MANAGER CHATBOX ====== */}
            <EventManagerChatBox eventId={event.eventId} eventName={event.eventName} />
          </motion.div>
          {/* Right Column: Tickets & Order */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="lg:col-span-1 space-y-6"
          >
            {isEventEnded && (
              <div
                className={cn(
                  'text-center font-bold text-lg my-4',
                  getThemeClass('text-red-600', 'text-red-500')
                )}
              >
                {t('eventEndedCannotBuyTickets')}
              </div>
            )}
            <div
              className={cn(
                'p-6 md:p-8 rounded-xl shadow-xl',
                getThemeClass(
                  'bg-white/95 border border-gray-200 shadow-lg',
                  'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800'
                )
              )}
            >
              <button
                onClick={() => setShowTickets((v) => !v)}
                className={cn(
                  'w-full flex justify-between items-center text-2xl font-semibold mb-6 border-b-2 pb-3 focus:outline-none px-4 py-2 rounded-lg transition-colors',
                  getThemeClass(
                    'text-blue-600 border-blue-600 bg-blue-50/50 hover:bg-blue-100',
                    'text-teal-300 border-teal-700 bg-slate-900/60 hover:bg-slate-800'
                  )
                )}
              >
                <span className="flex items-center">
                  <Ticket className="w-7 h-7 mr-3" /> {t('eventDetail.buyTickets')}
                </span>
                <span>{showTickets ? '▲' : '▼'}</span>
              </button>
              {showTickets &&
                (isEventEnded ? (
                  <div
                    className={cn(
                      'text-center py-8 font-semibold',
                      getThemeClass('text-red-600', 'text-red-400')
                    )}
                  >
                    {t('cannotBuyTicketsEventEnded')}
                  </div>
                ) : loadingTickets ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2
                      className={cn(
                        'w-8 h-8 animate-spin',
                        getThemeClass('text-blue-600', 'text-teal-500')
                      )}
                    />
                  </div>
                ) : tickets.length === 0 ? (
                  <p
                    className={cn(
                      'text-center py-4',
                      getThemeClass('text-gray-600', 'text-slate-400')
                    )}
                  >
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
                          className={cn(
                            'p-5 rounded-lg shadow-lg transition-shadow duration-300',
                            getThemeClass(
                              'bg-blue-50/75 border rounded-xl border-blue-300 hover:shadow-blue-500/30 shadow-sm',
                              'bg-slate-700 hover:shadow-purple-500/30'
                            )
                          )}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <h3
                              className={cn(
                                'text-lg font-semibold',
                                getThemeClass('text-gray-900', 'text-white')
                              )}
                            >
                              {ticket.ticketName}
                            </h3>
                            <p
                              className={cn(
                                'text-xl font-bold',
                                getThemeClass('text-blue-600', 'text-teal-300')
                              )}
                            >
                              {price.toLocaleString('vi-VN')} VNĐ
                            </p>
                          </div>
                          <p
                            className={cn(
                              'text-xs mb-3',
                              getThemeClass('text-gray-500', 'text-slate-400')
                            )}
                          >
                            {t('eventDetail.remainingTickets', {
                              count: ticket.quantityAvailable - quantity,
                            })}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-3">
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleQuantityChange(ticket, quantity - 1)}
                                disabled={quantity === 0}
                                className={cn(
                                  'p-2 rounded-full transition-colors',
                                  getThemeClass(
                                    'bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed',
                                    'bg-purple-600 hover:bg-purple-500 disabled:bg-slate-600 disabled:cursor-not-allowed'
                                  )
                                )}
                              >
                                <MinusCircle
                                  className={cn(
                                    'w-5 h-5',
                                    getThemeClass('text-white', 'text-white')
                                  )}
                                />
                              </motion.button>
                              <motion.span
                                key={quantity}
                                initial={{ scale: 1.2, color: '#fbbf24' }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                                className={cn(
                                  'text-lg font-medium w-10 text-center',
                                  getThemeClass('text-gray-900', 'text-white')
                                )}
                              >
                                {quantity}
                              </motion.span>
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleQuantityChange(ticket, quantity + 1)}
                                disabled={!canIncrease}
                                className={cn(
                                  'p-2 rounded-full transition-colors',
                                  getThemeClass(
                                    'bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed',
                                    'bg-purple-600 hover:bg-purple-500 disabled:bg-slate-600 disabled:cursor-not-allowed'
                                  )
                                )}
                              >
                                <PlusCircle
                                  className={cn(
                                    'w-5 h-5',
                                    getThemeClass('text-white', 'text-white')
                                  )}
                                />
                              </motion.button>
                            </div>
                            <motion.div
                              key={subtotal}
                              initial={{ scale: 1.15, color: '#fbbf24' }}
                              animate={{ scale: 1, color: '#a7f3d0' }}
                              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                              className={cn(
                                'text-base font-semibold min-w-[90px] text-right',
                                getThemeClass('text-green-600', 'text-green-400')
                              )}
                            >
                              {subtotal > 0 ? `${subtotal.toLocaleString('vi-VN')} VNĐ` : ''}
                            </motion.div>
                          </div>
                          {!canIncrease && (
                            <div
                              className={cn(
                                'text-xs mt-1',
                                getThemeClass('text-red-600', 'text-red-400')
                              )}
                            >
                              {t('eventDetail.maxTicketsPerOrderError', { max: maxPerOrder })}
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
                  className={cn(
                    'p-6 rounded-xl shadow-xl overflow-hidden',
                    getThemeClass('bg-white border border-gray-200 shadow-lg', 'bg-slate-800')
                  )}
                >
                  <h3
                    className={cn(
                      'text-xl font-bold mb-4 border-b pb-2',
                      getThemeClass(
                        'text-blue-600 border-blue-300',
                        'text-amber-400 border-amber-700'
                      )
                    )}
                  >
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
                          className={cn(
                            'flex justify-between text-sm',
                            getThemeClass('text-gray-700', 'text-slate-300')
                          )}
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
                  <div
                    className={cn(
                      'border-t pt-4 mb-4',
                      getThemeClass('border-gray-300', 'border-slate-700')
                    )}
                  >
                    <motion.div
                      key={totalAmount}
                      initial={{ scale: 1.15, color: '#fbbf24' }}
                      animate={{ scale: 1, color: '#fde68a' }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className={cn(
                        'flex justify-between items-center text-lg font-bold',
                        getThemeClass('text-gray-900', 'text-gray-900')
                      )}
                    >
                      <span className={cn(getThemeClass('text-gray-700', 'text-slate-200'))}>
                        {t('total')}:
                      </span>
                      <span
                        className={cn('text-2xl', getThemeClass('text-blue-600', 'text-amber-400'))}
                      >
                        {typeof totalAmount === 'number'
                          ? totalAmount.toLocaleString('vi-VN')
                          : Number(totalAmount || 0).toLocaleString('vi-VN')}{' '}
                        VNĐ
                      </span>
                    </motion.div>
                  </div>
                  <div className="mb-4">
                    <div className="flex gap-2 mb-1">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          className={cn(
                            'w-full border rounded px-3 py-2 text-sm transition-colors',
                            discountValidation
                              ? discountValidation.success
                                ? getThemeClass(
                                    'border-green-500 bg-green-50 text-green-700',
                                    'border-green-500 bg-green-50 text-green-700'
                                  )
                                : getThemeClass(
                                    'border-red-500 bg-red-50 text-red-700',
                                    'border-red-500 bg-red-50 text-red-700'
                                  )
                              : getThemeClass(
                                  'border-purple-300 text-gray-900 bg-white',
                                  'border-purple-300 text-gray-900 bg-white'
                                )
                          )}
                          placeholder={t('eventDetail.discountCodePlaceholder')}
                          value={discountCode}
                          onChange={(e) => {
                            setDiscountCode(e.target.value);
                            // Clear validation state when user starts typing
                            if (discountValidation) {
                              setDiscountValidation(null);
                              setAppliedDiscount(0);
                            }
                          }}
                          disabled={validatingDiscount}
                        />
                        {discountValidation && (
                          <div
                            className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                              discountValidation.success ? 'text-green-500' : 'text-red-500'
                            }`}
                          >
                            {discountValidation.success ? (
                              <CheckCircle className="w-5 h-5" />
                            ) : (
                              <AlertCircle className="w-5 h-5" />
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        className={cn(
                          'px-4 py-2 rounded font-medium transition-colors',
                          validatingDiscount || !discountCode.trim()
                            ? getThemeClass(
                                'bg-gray-300 cursor-not-allowed',
                                'bg-gray-300 cursor-not-allowed'
                              )
                            : getThemeClass(
                                'bg-purple-600 hover:bg-purple-700 text-white',
                                'bg-purple-600 hover:bg-purple-700 text-white'
                              )
                        )}
                        onClick={() => {
                          requireLogin(() => {
                            handleValidateDiscount();
                          });
                        }}
                        disabled={validatingDiscount || !discountCode.trim()}
                      >
                        {validatingDiscount ? (
                          <Loader2 className="w-4 h-4 animate-spin mx-2" />
                        ) : (
                          t('eventDetail.applyDiscount')
                        )}
                      </button>
                    </div>
                    {discountValidation && (
                      <div
                        className={cn(
                          'text-sm mt-1 px-2 py-1 rounded',
                          getThemeClass(
                            'text-green-700 bg-green-100',
                            'text-green-700 bg-green-100'
                          )
                        )}
                      >
                        <div className="flex items-start">
                          {discountValidation.success ? (
                            <CheckCircle className="w-4 h-4 mt-0.5 mr-1 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 mt-0.5 mr-1 flex-shrink-0" />
                          )}
                          <span>
                            {discountValidation.message}
                            {discountValidation.success && appliedDiscount > 0 && (
                              <span className="font-semibold ml-1">
                                (-{appliedDiscount.toLocaleString('vi-VN')} VNĐ)
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.03, boxShadow: '0px 0px 15px rgba(56, 189, 248, 0.5)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreateOrder}
                    disabled={isCreatingOrder || totalAmount === 0}
                    className={cn(
                      'w-full mt-2 font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-300 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed',
                      getThemeClass(
                        'bg-gradient-to-r from-sky-500 to-indigo-600 text-white hover:from-sky-600 hover:to-indigo-700',
                        'bg-gradient-to-r from-sky-500 to-indigo-600 text-white hover:from-sky-600 hover:to-indigo-700'
                      )
                    )}
                  >
                    {isCreatingOrder ? (
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    ) : (
                      <ShoppingCart className="w-6 h-6 mr-2" />
                    )}
                    {isCreatingOrder
                      ? t('eventDetail.processingOrder')
                      : t('eventDetail.bookTickets', { count: selectedItemsCount })}
                  </motion.button>
                  {/* Nút đặt vé bằng khuôn mặt */}
                  <motion.button
                    whileHover={{ scale: 1.03, boxShadow: '0px 0px 15px rgba(168,85,247,0.5)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      // Require login before opening FaceCapture modal
                      requireLogin(() => {
                        setShowFaceModal(true);
                        setFaceError('');
                      });
                    }}
                    disabled={isCreatingOrder || faceLoading || totalAmount === 0}
                    className={cn(
                      'w-full mt-3 font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-300 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed',
                      getThemeClass(
                        'bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-700 hover:to-pink-600',
                        'bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-700 hover:to-pink-600'
                      )
                    )}
                  >
                    {faceLoading ? (
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    ) : (
                      <Camera className="w-6 h-6 mr-2" />
                    )}
                    {faceLoading
                      ? t('eventDetail.processingFaceOrder')
                      : t('eventDetail.bookTicketsWithFace')}
                  </motion.button>
                </motion.div>
              </AnimatePresence>
            )}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className={cn(
              'lg:col-span-4 p-6 md:p-8 rounded-xl shadow-xl',
              getThemeClass(
                'bg-white/95 border border-gray-200 shadow-lg',
                'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800'
              )
            )}
          >
            <h2
              className={cn(
                'text-xl font-bold mb-4 text-center',
                getThemeClass('text-gray-900', 'text-white')
              )}
            >
              {t('recommendEvents')}
            </h2>
            {loadingEvent ? (
              <div className="flex justify-center items-center h-60">
                <Loader2
                  className={cn(
                    'animate-spin w-10 h-10',
                    getThemeClass('text-gray-500', 'text-gray-400')
                  )}
                />
              </div>
            ) : events.length === 0 ? (
              <div
                className={cn(
                  'text-center text-lg',
                  getThemeClass('text-gray-500', 'text-gray-400')
                )}
              >
                {t('eventDetail.noEventsFound')}
              </div>
            ) : (
              <Swiper
                slidesPerView={1}
                spaceBetween={24}
                breakpoints={{
                  640: { slidesPerView: 1.2 },
                  768: { slidesPerView: 2 },
                  1024: { slidesPerView: 3 },
                  1440: { slidesPerView: 4 }, // Thêm breakpoint cho desktop lớn
                }}
                pagination={{ clickable: true, type: 'fraction' }}
                navigation={true}
                modules={[Pagination, Navigation]}
                className="event-card-slider"
              >
                {events.map((event) => (
                  <SwiperSlide key={event.eventId}>
                    <div
                      className={cn(
                        'group rounded-2xl shadow-xl hover:shadow-2xl hover:scale-95 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full',
                        getThemeClass(
                          'bg-white border border-gray-200 shadow-lg hover:shadow-xl',
                          'bg-white/90 border border-gray-200'
                        )
                      )}
                      onClick={() => navigate(`/event/${event.eventId}`)}
                      title={t('clickToViewDetails')}
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
                        <h3
                          className={cn(
                            'text-lg font-bold mb-1 group-hover:text-blue-700 transition-colors duration-200 line-clamp-1',
                            getThemeClass('text-gray-900', 'text-white')
                          )}
                        >
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
      {showReportModal && pendingReport && (
        <ReportModal
          open={showReportModal}
          onClose={() => {
            setShowReportModal(false);
            setPendingReport(null); // Clear pending report when modal is closed
          }}
          targetType={pendingReport.type}
          targetId={pendingReport.id}
          onLoginRequired={handleLoginRequired}
        />
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <AuthModals
          open={showLoginModal}
          onClose={() => {
            setShowLoginModal(false);
            // Clear any pending actions when modal is closed
            setPendingReport(null);
            setPendingFollow(false);
          }}
          onLoginSuccess={handleLoginSuccess}
          onRegisterSuccess={() => {
            setShowLoginModal(false);
            setShowRegisterModal(true);
          }}
        />
      )}

      {/* Register Modal */}
      {showRegisterModal && (
        <RegisterModal
          open={showRegisterModal}
          onClose={() => {
            setShowRegisterModal(false);
            // Clear any pending actions when modal is closed
            setPendingReport(null);
            setPendingFollow(false);
          }}
          onRegisterSuccess={handleLoginSuccess}
          onLoginRedirect={() => {
            // Switch back to login modal
            setShowRegisterModal(false);
            setShowLoginModal(true);
          }}
        />
      )}
      {/* Modal FaceCapture */}
      {showFaceModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70">
          <div
            className={cn(
              'rounded-xl shadow-lg p-6 w-full max-w-md relative',
              getThemeClass('bg-white', 'bg-white')
            )}
          >
            <button
              className={cn(
                'absolute top-2 right-2 text-xl',
                getThemeClass(
                  'text-gray-400 hover:text-gray-700',
                  'text-gray-400 hover:text-gray-700'
                )
              )}
              onClick={() => setShowFaceModal(false)}
              aria-label="Đóng"
            >
              ×
            </button>
            <h2
              className={cn(
                'text-xl font-bold mb-4 text-center',
                getThemeClass('text-gray-900', 'text-gray-900')
              )}
            >
              {t('eventDetail.bookTicketsWithFace')}
            </h2>
            {faceError && (
              <div
                className={cn('text-center mb-2', getThemeClass('text-red-600', 'text-red-500'))}
              >
                {faceError}
              </div>
            )}
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
