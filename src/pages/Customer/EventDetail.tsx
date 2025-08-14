/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useContext, useCallback } from 'react';
import { useRequireLogin } from '@/hooks/useRequireLogin';
import { AuthContext } from '@/contexts/AuthContext';
import AuthModals from '@/components/AuthModals';
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
import { getTicketLimits } from '@/services/ticket.service';
import { getOrderHistoryByCustomerId } from '@/services/order.service';
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
  createdBy: string;
}

interface TicketData {
  ticketId: string;
  ticketName: string;
  ticketPrice: number;
  quantityAvailable: number;
  maxTicketsPerOrder?: number;
  saleStartTime?: string;
  saleEndTime?: string;
}

interface SelectedTicket {
  ticketId: string;
  quantity: number;
  ticketName: string;
  ticketPrice: number;
}

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
  const { requireLogin, handleLoginSuccess } = useRequireLogin();
  const { t } = useTranslation();
  const { getThemeClass } = useThemeClasses();
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  
  // State declarations
  const [pendingReport, setPendingReport] = useState<ReportInfo | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  
  // Handle login required for protected actions
  const handleLoginRequired = useCallback(() => {
    setShowLoginModal(true);
  }, []);
  
  // Handle successful login
  const onLoginSuccess = useCallback(() => {
    if (typeof handleLoginSuccess === 'function') {
      handleLoginSuccess();
    }
    // Execute any pending actions after successful login
    const currentReport = pendingReport;
    if (currentReport) {
      if (currentReport.type === 'event' && eventId) {
        setShowReportModal(true);
      } else if (currentReport.type === 'comment') {
        setShowReportModal(true);
      }
    }
  }, [handleLoginSuccess, pendingReport, eventId]);
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
  const [ticketErrors, setTicketErrors] = useState<Record<string, string>>({});
  const [ticketLimits, setTicketLimits] = useState<Record<string, { maxPerOrder: number; userPurchased: number; maxPerUser: number }>>({});
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  interface ReportInfo {
    type: 'event' | 'comment';
    id: string;
  }

  const [isFollowingEvent, setIsFollowingEvent] = useState(false);
  const [loadingFollowEvent, setLoadingFollowEvent] = useState(false);
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [faceLoading, setFaceLoading] = useState(false);
  const [faceError, setFaceError] = useState('');
  const [showAllTags, setShowAllTags] = useState(false);
  const [events, setEvents] = useState<EventData[]>([]);
  const { isLoggedIn, user } = useContext(AuthContext);
  const customerId = user?.userId || user?.accountId || '';

  // NEW: Define maximum total tickets per order (if applicable, e.g., 10)
  const MAX_TOTAL_TICKETS_PER_ORDER = 10;

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
        
        // Load ticket limits for each ticket
        const limits: Record<string, { maxPerOrder: number; userPurchased: number; maxPerUser: number }> = {};
        for (const ticket of ticketData || []) {
          try {
            const limitInfo = await getTicketLimits(ticket.ticketId);
            limits[ticket.ticketId] = {
              maxPerOrder: limitInfo.maxTicketsPerOrder,
              userPurchased: limitInfo.userPurchasedCount || 0,
              maxPerUser: limitInfo.maxTicketsPerUser || limitInfo.maxTicketsPerOrder
            };
          } catch (error) {
            console.error(`Error fetching limits for ticket ${ticket.ticketId}:`, error);
            // Fallback to ticket data
            limits[ticket.ticketId] = {
              maxPerOrder: ticket.maxTicketsPerOrder || 5,
              userPurchased: 0,
              maxPerUser: ticket.maxTicketsPerOrder || 5
            };
          }
        }
        setTicketLimits(limits);
      } catch {
        setTickets([]);
      } finally {
        setLoadingTickets(false);
      }
    };

    const fetchUserOrders = async () => {
      if (!customerId) return;
      
      setLoadingOrders(true);
      try {
        const orderHistory = await getOrderHistoryByCustomerId(customerId, 1, 50);
        // Filter orders for this event
        const eventOrders = (orderHistory?.items || []).filter((order: any) => 
          order.eventId === eventId && order.orderStatus === 'Success'
        );
        setUserOrders(eventOrders);
      } catch (error) {
        console.error('Error fetching user orders:', error);
        setUserOrders([]);
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchEventData();
    fetchTicketData();
    if (customerId) {
      fetchUserOrders();
    }
  }, [eventId, customerId, t]);

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
          let msg = t('failedToLoadRecommendedEvents');
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
  }, [eventId, isLoggedIn, t]);

  useEffect(() => {
    const COMMENT_HUB_URL = 'https://event.vezzy.site/notificationHub';
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

  useEffect(() => {
    if (!eventId) return;

    onEvent('OnEventUpdated', (data: any) => {
      if (data.eventId === eventId || data.EventId === eventId) {
        console.log('Event updated:', data);
        toast.info(t('eventHasBeenUpdated'));
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

    onEvent('OnTicketSoldIncremented', (data: any) => {
      const ticketEventId = data.eventId || data.EventId;
      if (ticketEventId === eventId) {
        console.log('Ticket sold:', data);
        setTickets((prev) =>
          prev.map((ticket) => {
            if (ticket.ticketId === (data.ticketId || data.TicketId)) {
              const newQuantity = Math.max(0, ticket.quantityAvailable - (data.quantity || 1));
              // NEW: Update selectedTickets if quantity exceeds available
              if (selectedTickets[ticket.ticketId]?.quantity > newQuantity) {
                setSelectedTickets((prevSelected) => {
                  const updated = { ...prevSelected };
                  if (newQuantity === 0) {
                    delete updated[ticket.ticketId];
                  } else {
                    updated[ticket.ticketId] = {
                      ...updated[ticket.ticketId],
                      quantity: newQuantity,
                    };
                  }
                  return updated;
                });
                toast.warn(
                  t('ticketQuantityReduced', {
                    ticketName: ticket.ticketName,
                    available: newQuantity,
                  })
                );
              }
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

    return () => {};
  }, [eventId, selectedTickets, t]);

  const handleQuantityChange = (ticket: TicketData, quantity: number) => {
    const ticketLimit = ticketLimits[ticket.ticketId];
    const maxPerOrder = ticketLimit?.maxPerOrder || ticket.maxTicketsPerOrder || ticket.quantityAvailable;
    const userPurchased = ticketLimit?.userPurchased || 0;
    const maxPerUser = ticketLimit?.maxPerUser || maxPerOrder;
    
    // Clear previous error for this ticket
    setTicketErrors(prev => ({
      ...prev,
      [ticket.ticketId]: ''
    }));
    
    // Calculate total user would have after this purchase
    const totalAfterPurchase = userPurchased + quantity;
    
    // Validate quantity
    if (quantity > ticket.quantityAvailable) {
      setTicketErrors(prev => ({
        ...prev,
        [ticket.ticketId]: `❌ Không đủ vé! Chỉ còn ${ticket.quantityAvailable} vé khả dụng.`
      }));
      return;
    } else if (quantity > maxPerOrder) {
      setTicketErrors(prev => ({
        ...prev,
        [ticket.ticketId]: `⚠️ Chỉ có thể mua tối đa ${maxPerOrder} vé/${quantity > 1 ? 'lần' : 'lần'} cho loại "${ticket.ticketName}".`
      }));
      return;
    } else if (totalAfterPurchase > maxPerUser) {
      const remaining = Math.max(0, maxPerUser - userPurchased);
      setTicketErrors(prev => ({
        ...prev,
        [ticket.ticketId]: `⚠️ Bạn đã mua ${userPurchased} vé "${ticket.ticketName}". Chỉ có thể mua thêm ${remaining} vé (tối đa ${maxPerUser} vé/người).`
      }));
      return;
    }
    
    const newQuantity = Math.max(0, Math.min(quantity, Math.min(ticket.quantityAvailable, maxPerOrder, maxPerUser - userPurchased)));
    
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

  // NEW: Validate total tickets in order
  const validateTotalTickets = () => {
    const totalSelected = Object.values(selectedTickets).reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    if (totalSelected > MAX_TOTAL_TICKETS_PER_ORDER) {
      toast.error(
        t('totalTicketsExceedLimit', {
          max: MAX_TOTAL_TICKETS_PER_ORDER,
          requested: totalSelected,
        })
      );
      return false;
    }
    return true;
  };

  const handleCreateOrder = async () => {
    if (!eventId || Object.keys(selectedTickets).length === 0) {
      toast.warn(t('pleaseSelectAtLeastOneTicket'));
      return;
    }
    
    // Clear all ticket errors
    setTicketErrors({});
    
    // NEW: Validate total tickets
    if (!validateTotalTickets()) {
      return;
    }
    requireLogin(async () => {
      const latestUser = user;
      const latestCustomerId = latestUser?.userId || latestUser?.accountId || '';
      if (!latestUser || latestUser.role !== 1) {
        toast.error(t('onlyCustomerCanBuyTicket'));
        return;
      }
      if (!latestCustomerId) {
        toast.error(t('customerInfoNotFound'));
        return;
      }
      // Validate tickets with inline errors
      let hasErrors = false;
      const newErrors: Record<string, string> = {};
      
      for (const ticket of tickets) {
        const selected = selectedTickets[ticket.ticketId];
        if (selected) {
          const maxPerOrder = ticket.maxTicketsPerOrder || ticket.quantityAvailable;
          if (selected.quantity > maxPerOrder) {
            newErrors[ticket.ticketId] = `⚠️ Chỉ có thể mua tối đa ${maxPerOrder} vé loại "${ticket.ticketName}" cho sự kiện này.`;
            hasErrors = true;
          } else if (selected.quantity > ticket.quantityAvailable) {
            newErrors[ticket.ticketId] = `❌ Không đủ vé! Chỉ còn ${ticket.quantityAvailable} vé khả dụng.`;
            hasErrors = true;
          }
        }
      }
      
      if (hasErrors) {
        setTicketErrors(newErrors);
        return;
      }
      setIsCreatingOrder(true);
      try {
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
        // NEW: Simulate backend validation for atomic reservation
        // In a real scenario, this would be handled by createOrder API
        const unavailableTickets = Object.values(selectedTickets)
          .filter((st) => {
            const ticket = tickets.find((t) => t.ticketId === st.ticketId);
            return ticket && st.quantity > ticket.quantityAvailable;
          })
          .map((st) => st.ticketName);
        if (unavailableTickets.length > 0) {
          toast.error(
            t('notEnoughTicketsAvailableFor', {
              ticketNames: unavailableTickets.join(', '),
            })
          );
          setIsCreatingOrder(false);
          return;
        }
        // Check if this is a checkout creation (not actual order creation)
        // We'll handle the actual order creation in ConfirmOrderPage
        localStorage.setItem('checkout', JSON.stringify(checkoutData));
        toast.success(
          <>
            {t('orderCreatedSuccessfully')} <CheckCircle className="inline w-5 h-5 ml-1" />
          </>
        );
        localStorage.setItem('lastEventId', eventId);
        navigate('/confirm-order');
      } catch (error: any) {
        const msg = error?.response?.data?.message || t('failedToCreateOrder');
        
        // Handle specific ticket limit errors
        if (msg.includes('Bạn chỉ có thể mua tối đa') && msg.includes('vé loại')) {
          // Extract ticket name and limits from error message
          const match = msg.match(/tối đa (\d+) vé loại '([^']+)'/);
          if (match) {
            const maxTickets = match[1];
            const ticketName = match[2];
            
            // Find the ticket ID for this ticket name
            const targetTicket = tickets.find(t => t.ticketName === ticketName);
            if (targetTicket) {
              setTicketErrors({
                [targetTicket.ticketId]: `⚠️ Bạn đã mua đủ số vé cho loại "${ticketName}". Tối đa ${maxTickets} vé/người cho sự kiện này.`
              });
              return;
            }
          }
        }
        
        toast.error(msg);
      } finally {
        setIsCreatingOrder(false);
      }
    });
  };

  const handleValidateDiscount = async () => {
    if (!discountCode.trim()) {
      setDiscountValidation({ 
        success: false, 
        message: 'Vui lòng nhập mã giảm giá' 
      });
      setAppliedDiscount(0);
      return;
    }

    // Basic format validation
    const codePattern = /^[A-Z0-9]{6,12}$/;
    if (!codePattern.test(discountCode.trim())) {
      setDiscountValidation({
        success: false,
        message: 'Mã giảm giá phải từ 6-12 ký tự, chỉ bao gồm chữ cái và số'
      });
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
        if (res.data.isValid) {
          setDiscountValidation({
            success: true,
            message: res.data.message || 'Mã giảm giá hợp lệ cho sự kiện này',
            discountAmount: res.data.discountAmount,
          });
          setAppliedDiscount(res.data.discountAmount || 0);
          
          // Show success toast
          toast.success(`🎉 Áp dụng mã giảm giá thành công! Tiết kiệm ${(res.data.discountAmount || 0).toLocaleString('vi-VN')} VNĐ`);
        } else {
          const errorMessage = res.data.message || 'Mã giảm giá không hợp lệ';
          setDiscountValidation({
            success: false,
            message: errorMessage,
          });
          setAppliedDiscount(0);
          
          // Enhanced error messages
          if (errorMessage.includes('used') || errorMessage.includes('đã sử dụng')) {
            setDiscountValidation({
              success: false,
              message: '❌ Mã giảm giá này đã được sử dụng. Mỗi mã chỉ sử dụng được 1 lần.',
            });
          } else if (errorMessage.includes('event') || errorMessage.includes('sự kiện')) {
            setDiscountValidation({
              success: false,
              message: '🎯 Mã giảm giá này không áp dụng cho sự kiện hiện tại.',
            });
          } else if (errorMessage.includes('expired') || errorMessage.includes('hết hạn')) {
            setDiscountValidation({
              success: false,
              message: '⏰ Mã giảm giá đã hết hạn sử dụng.',
            });
          }
        }
      } else {
        setDiscountValidation({
          success: false,
          message: res.message || '❌ Mã giảm giá không tồn tại hoặc không hợp lệ',
        });
        setAppliedDiscount(0);
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Có lỗi xảy ra khi kiểm tra mã giảm giá';
      setDiscountValidation({
        success: false,
        message: errorMsg,
      });
      setAppliedDiscount(0);
      
      // Show error toast
      toast.error('❌ Không thể kiểm tra mã giảm giá. Vui lòng thử lại!');
    } finally {
      setValidatingDiscount(false);
    }
  };

  const isEventEnded = event && new Date() > new Date(event.endAt);

  const handleOrderWithFace = async ({ image }: { image: Blob }) => {
    if (faceLoading) return;
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
        toast.warn(t('pleaseSelectAtOneTicket'));
        setFaceLoading(false);
        return;
      }
      // NEW: Validate total tickets
      if (!validateTotalTickets()) {
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
        const ticket = tickets.find((t) => t.ticketId === item.ticketId);
        if (ticket && item.quantity > ticket.quantityAvailable) {
          toast.error(
            t('notEnoughTicketsAvailable', {
              ticketName: ticket.ticketName,
              available: ticket.quantityAvailable,
              requested: item.quantity,
            })
          );
          setFaceLoading(false);
          return;
        }
        if (ticket && item.quantity > (ticket.maxTicketsPerOrder || ticket.quantityAvailable)) {
          toast.error(
            t('maxTicketsPerOrderError', {
              maxPerOrder: ticket.maxTicketsPerOrder || ticket.quantityAvailable,
              ticketName: ticket.ticketName,
            })
          );
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
        const msg = res?.message || t('faceOrderFailed');
        setFaceError(msg);
        toast.error(msg);
        setFaceLoading(false);
        return;
      }

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
        const msg = res?.message || t('faceOrderFailed');
        setFaceError(msg);
        toast.error(msg);
        setFaceLoading(false);
        return;
      }

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
        items: orderInfo.items,
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
    } catch (e: any) {
      // NEW: Enhanced error handling for atomic reservation failures
      let msg = t('faceOrderFailed');
      if (e?.response?.data?.message) {
        msg = e.response.data.message;
        if (msg.includes('Not enough tickets available')) {
          const unavailableTickets = Object.values(selectedTickets)
            .filter((st) => {
              const ticket = tickets.find((t) => t.ticketId === st.ticketId);
              return ticket && st.quantity > ticket.quantityAvailable;
            })
            .map((st) => st.ticketName);
          msg = t('notEnoughTicketsAvailableFor', {
            ticketNames: unavailableTickets.join(', '),
          });
        }
      }
      setFaceError(msg);
      toast.error(msg);
    } finally {
      setFaceLoading(false);
    }
  };

  interface FollowError extends Error {
    response?: {
      data?: {
        message?: string;
      };
    };
  }

  const handleFollowEvent = async () => {
    requireLogin(async () => {
      if (!eventId) {
        toast.error(t('eventNotFound'));
        return;
      }

      setLoadingFollowEvent(true);
      try {
        if (isFollowingEvent) {
          await unfollowEvent(eventId);
          toast.success(t('unfollowedEvent'));
          setIsFollowingEvent(false);
        } else {
          await followEvent(eventId);
          toast.success(t('followedEvent'));
          setIsFollowingEvent(true);
        }
      } catch (err: unknown) {
        const error = err as FollowError;
        let errorMessage = t('somethingWentWrong');
        
        if (error?.response?.data?.message) {
          errorMessage = error.response.data.message;
          if (errorMessage.toLowerCase().includes('already following')) {
            setIsFollowingEvent(true);
            return; // Don't show error if already following
          } else if (errorMessage.toLowerCase().includes('not found')) {
            errorMessage = t('eventNotFound');
          } else if (errorMessage.toLowerCase().includes('unauthorized')) {
            errorMessage = t('loginRequired');
          }
        }
        
        toast.error(errorMessage);
      } finally {
        setLoadingFollowEvent(false);
      }
    });
  };

  const [isReporting, setIsReporting] = useState(false);

  const handleReportEvent = () => {
    if (isReporting) return; // Prevent multiple clicks
    
    requireLogin(async () => {
      if (!eventId) {
        toast.error(t('eventNotFound'));
        return;
      }
      
      setIsReporting(true);
      try {
        const reportInfo = { type: 'event' as const, id: eventId };
        setPendingReport(reportInfo);
        // Don't show modal here - it will be handled by onLoginSuccess
        // This ensures the modal shows after login if needed
        if (isLoggedIn) {
          setShowReportModal(true);
        }
      } catch (error) {
        console.error('Error preparing report:', error);
        toast.error(t('failedToPrepareReport'));
      } finally {
        setIsReporting(false);
      }
    });
  };

  const handleReportComment = (report: { type: 'comment'; id: string }) => {
    if (isReporting) return; // Prevent multiple clicks
    
    requireLogin(async () => {
      if (!report?.id) {
        toast.error(t('commentNotFound'));
        return;
      }
      
      setIsReporting(true);
      try {
        setPendingReport(report as ReportInfo);
        setShowReportModal(true);
      } catch (error) {
        console.error('Error preparing comment report:', error);
        toast.error(t('failedToPrepareReport'));
      } finally {
        setIsReporting(false);
      }
    });
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
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className={cn(
            'relative rounded-3xl shadow-2xl overflow-hidden mb-12 h-[300px] md:h-[400px] lg:h-[500px]',
            getThemeClass(
              'bg-white/95 border border-gray-200 shadow-lg',
              'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800'
            )
          )}
        >
          <div className="absolute top-4 right-4 z-10">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
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

            <CommentSection eventId={event.eventId} setReportModal={handleReportComment} />
            <div className="mt-8">
              <EventChatAssistant eventId={event.eventId} eventName={event.eventName} />
            </div>
            <EventManagerChatBox eventId={event.eventId} eventName={event.eventName} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="lg:col-span-1 space-y-6"
          >
            {isEventEnded && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  'rounded-xl p-6 text-center border-2 mb-6',
                  getThemeClass(
                    'bg-gradient-to-br from-red-50 to-pink-50 border-red-300',
                    'bg-gradient-to-br from-red-900/20 to-pink-900/20 border-red-500/50'
                  )
                )}
              >
                <div className={cn(
                  'text-4xl mb-3',
                  getThemeClass('text-red-500', 'text-red-400')
                )}>
                  ⏰
                </div>
                <h3 className={cn(
                  'text-xl font-bold mb-2',
                  getThemeClass('text-red-700', 'text-red-300')
                )}>
                  Sự kiện đã kết thúc
                </h3>
                <p className={cn(
                  'text-sm',
                  getThemeClass('text-red-600', 'text-red-400')
                )}>
                  Cảm ơn bạn đã quan tâm đến sự kiện này. Hãy theo dõi các sự kiện sắp tới của chúng tôi!
                </p>
              </motion.div>
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
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'text-center py-8 rounded-xl border-2',
                      getThemeClass(
                        'bg-gradient-to-br from-red-50 to-orange-50 border-red-200',
                        'bg-gradient-to-br from-red-900/20 to-orange-900/20 border-red-500/30'
                      )
                    )}
                  >
                    <div className="text-5xl mb-4">🎭</div>
                    <h3 className={cn(
                      'text-xl font-bold mb-2',
                      getThemeClass('text-red-700', 'text-red-300')
                    )}>
                      Sự kiện đã kết thúc
                    </h3>
                    <p className={cn(
                      'text-sm',
                      getThemeClass('text-red-600', 'text-red-400')
                    )}>
                      Không thể mua vé cho sự kiện đã kết thúc
                    </p>
                  </motion.div>
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
                      const ticketLimit = ticketLimits[ticket.ticketId];
                      const maxPerOrder = ticketLimit?.maxPerOrder || ticket.maxTicketsPerOrder || ticket.quantityAvailable;
                      const userPurchased = ticketLimit?.userPurchased || 0;
                      const maxPerUser = ticketLimit?.maxPerUser || maxPerOrder;
                      const remainingCanBuy = Math.max(0, maxPerUser - userPurchased);
                      
                      // Check if ticket sale has ended
                      const saleEndTime = ticket.saleEndTime ? new Date(ticket.saleEndTime) : null;
                      const saleStartTime = ticket.saleStartTime ? new Date(ticket.saleStartTime) : null;
                      const now = new Date();
                      const isSaleEnded = saleEndTime && now > saleEndTime;
                      const isSaleNotStarted = saleStartTime && now < saleStartTime;
                      const isSoldOut = ticket.quantityAvailable <= 0;
                      
                      const canIncrease =
                        !isSaleEnded && !isSaleNotStarted && !isSoldOut &&
                        quantity < Math.min(ticket.quantityAvailable, maxPerOrder, remainingCanBuy);
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
                            <div className="flex-1">
                              <h3
                                className={cn(
                                  'text-lg font-semibold',
                                  getThemeClass('text-gray-900', 'text-white')
                                )}
                              >
                                {ticket.ticketName}
                              </h3>
                              {/* Ticket Status */}
                              {(isSoldOut || isSaleEnded || isSaleNotStarted) && (
                                <div className="flex items-center gap-2 mt-1">
                                  {isSoldOut && (
                                    <span className={cn(
                                      'text-xs px-2 py-1 rounded-full font-medium',
                                      getThemeClass('bg-red-100 text-red-700', 'bg-red-900/30 text-red-300')
                                    )}>
                                      🔴 Hết vé
                                    </span>
                                  )}
                                  {isSaleEnded && !isSoldOut && (
                                    <span className={cn(
                                      'text-xs px-2 py-1 rounded-full font-medium',
                                      getThemeClass('bg-orange-100 text-orange-700', 'bg-orange-900/30 text-orange-300')
                                    )}>
                                      ⏰ Hết hạn bán
                                    </span>
                                  )}
                                  {isSaleNotStarted && (
                                    <span className={cn(
                                      'text-xs px-2 py-1 rounded-full font-medium',
                                      getThemeClass('bg-blue-100 text-blue-700', 'bg-blue-900/30 text-blue-300')
                                    )}>
                                      🕐 Chưa mở bán
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <p
                              className={cn(
                                'text-xl font-bold',
                                price === 0 
                                  ? getThemeClass('text-green-600', 'text-green-400')
                                  : getThemeClass('text-blue-600', 'text-teal-300')
                              )}
                            >
                              {price === 0 ? 'Miễn phí' : `${price.toLocaleString('vi-VN')} đ`}
                            </p>
                          </div>
                          <div className="space-y-1 mb-3">
                            <p
                              className={cn(
                                'text-xs',
                                getThemeClass('text-gray-500', 'text-slate-400')
                              )}
                            >
                              {t('eventDetail.remainingTickets', {
                                count: ticket.quantityAvailable - quantity,
                              })}
                            </p>
                            {ticketLimits[ticket.ticketId]?.userPurchased > 0 && (
                              <p
                                className={cn(
                                  'text-xs font-medium',
                                  getThemeClass('text-blue-600', 'text-blue-400')
                                )}
                              >
                                📝 Bạn đã mua: {ticketLimits[ticket.ticketId]?.userPurchased || 0} vé | Còn có thể mua: {Math.max(0, (ticketLimits[ticket.ticketId]?.maxPerUser || 0) - (ticketLimits[ticket.ticketId]?.userPurchased || 0))} vé
                              </p>
                            )}
                          </div>
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
                              {subtotal > 0 ? `${subtotal.toLocaleString('vi-VN')} đ` : 'Miễn phí'}
                            </motion.div>
                          </div>
                          
                          {/* Ticket Error Message */}
                          <AnimatePresence>
                            {ticketErrors[ticket.ticketId] && (
                              <motion.div
                                initial={{ opacity: 0, height: 0, y: -10 }}
                                animate={{ opacity: 1, height: 'auto', y: 0 }}
                                exit={{ opacity: 0, height: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className={cn(
                                  'mt-3 p-3 rounded-lg border-l-4',
                                  getThemeClass(
                                    'bg-red-50 border-red-400 text-red-700',
                                    'bg-red-900/30 border-red-400 text-red-200'
                                  )
                                )}
                              >
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                  <div className="text-sm font-medium">
                                    {ticketErrors[ticket.ticketId]}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                ))}
            </div>

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
                              ? `${(price * item.quantity).toLocaleString('vi-VN')} đ`
                              : 'Miễn phí'}
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
                        đ
                      </span>
                    </motion.div>
                  </div>
                  {/* Enhanced Discount Code Section */}
                  <motion.div 
                    className="mb-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className={cn(
                      'rounded-xl border-2 p-4 transition-all duration-300',
                      discountValidation?.success
                        ? getThemeClass(
                            'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50',
                            'border-green-400 bg-gradient-to-br from-green-900/20 to-emerald-900/20'
                          )
                        : discountValidation && !discountValidation.success
                        ? getThemeClass(
                            'border-red-300 bg-gradient-to-br from-red-50 to-pink-50',
                            'border-red-400 bg-gradient-to-br from-red-900/20 to-pink-900/20'
                          )
                        : getThemeClass(
                            'border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 hover:border-purple-300',
                            'border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-indigo-900/20 hover:border-purple-400/50'
                          )
                    )}>
                      <div className="flex items-center gap-2 mb-3">
                        <Ticket className={cn(
                          'w-5 h-5',
                          getThemeClass('text-purple-600', 'text-purple-400')
                        )} />
                        <span className={cn(
                          'font-semibold text-sm',
                          getThemeClass('text-purple-700', 'text-purple-300')
                        )}>
                          Mã giảm giá cho sự kiện này
                        </span>
                      </div>
                      
                      <div className="flex gap-3 mb-3">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            className={cn(
                              'w-full border-2 rounded-lg px-4 py-3 text-sm font-medium placeholder:font-normal transition-all duration-300 focus:ring-2 focus:border-transparent',
                              discountValidation
                                ? discountValidation.success
                                  ? getThemeClass(
                                      'border-green-400 bg-white text-green-700 placeholder:text-green-500 focus:ring-green-200',
                                      'border-green-400 bg-green-900/10 text-green-300 placeholder:text-green-400 focus:ring-green-200'
                                    )
                                  : getThemeClass(
                                      'border-red-400 bg-white text-red-700 placeholder:text-red-500 focus:ring-red-200',
                                      'border-red-400 bg-red-900/10 text-red-300 placeholder:text-red-400 focus:ring-red-200'
                                    )
                                : getThemeClass(
                                    'border-purple-300 bg-white text-gray-900 placeholder:text-purple-400 focus:ring-purple-200 hover:border-purple-400',
                                    'border-purple-500/50 bg-purple-900/10 text-white placeholder:text-purple-300 focus:ring-purple-200 hover:border-purple-400'
                                  )
                            )}
                            placeholder="Nhập mã giảm giá (chỉ dùng 1 lần)"
                            value={discountCode}
                            onChange={(e) => {
                              setDiscountCode(e.target.value.toUpperCase());
                              if (discountValidation) {
                                setDiscountValidation(null);
                                setAppliedDiscount(0);
                              }
                            }}
                            disabled={validatingDiscount}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && discountCode.trim() && !validatingDiscount) {
                                requireLogin(() => {
                                  handleValidateDiscount();
                                });
                              }
                            }}
                          />
                          {discountValidation && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                                discountValidation.success ? 'text-green-500' : 'text-red-500'
                              }`}
                            >
                              {discountValidation.success ? (
                                <CheckCircle className="w-5 h-5" />
                              ) : (
                                <AlertCircle className="w-5 h-5" />
                              )}
                            </motion.div>
                          )}
                          {validatingDiscount && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-500"
                            >
                              <Loader2 className="w-5 h-5 animate-spin" />
                            </motion.div>
                          )}
                          {discountCode && !validatingDiscount && !discountValidation && (
                            <motion.button
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              type="button"
                              onClick={() => {
                                setDiscountCode('');
                                setDiscountValidation(null);
                                setAppliedDiscount(0);
                              }}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <MinusCircle className="w-5 h-5" />
                            </motion.button>
                          )}
                        </div>
                        
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={cn(
                            'px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-300 min-w-[100px] flex items-center justify-center',
                            validatingDiscount || !discountCode.trim()
                              ? getThemeClass(
                                  'bg-gray-200 text-gray-500 cursor-not-allowed',
                                  'bg-gray-700 text-gray-400 cursor-not-allowed'
                                )
                              : getThemeClass(
                                  'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl',
                                  'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl'
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
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Áp dụng'
                          )}
                        </motion.button>
                      </div>

                      <AnimatePresence>
                        {discountValidation && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, y: -10 }}
                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className={cn(
                              'rounded-lg px-4 py-3 border-l-4',
                              discountValidation.success
                                ? getThemeClass(
                                    'bg-green-100 border-green-500 text-green-800',
                                    'bg-green-900/30 border-green-400 text-green-200'
                                  )
                                : getThemeClass(
                                    'bg-red-100 border-red-500 text-red-800',
                                    'bg-red-900/30 border-red-400 text-red-200'
                                  )
                            )}
                          >
                            <div className="flex items-start gap-2">
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.1 }}
                              >
                                {discountValidation.success ? (
                                  <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                ) : (
                                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                )}
                              </motion.div>
                              <div className="flex-1">
                                <div className="text-sm font-medium">
                                  {discountValidation.success ? '✨ Mã giảm giá hợp lệ!' : '❌ Mã giảm giá không hợp lệ'}
                                </div>
                                <div className="text-sm mt-1">
                                  {discountValidation.message}
                                  {discountValidation.success && appliedDiscount > 0 && (
                                    <motion.span 
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="font-bold ml-2 text-lg"
                                    >
                                      🎉 Giảm {appliedDiscount.toLocaleString('vi-VN')} VNĐ
                                    </motion.span>
                                  )}
                                </div>
                                {discountValidation.success && (
                                  <div className="flex items-center justify-between mt-2">
                                    <div className="text-xs opacity-75">
                                      💡 Mã này chỉ sử dụng được 1 lần cho sự kiện này
                                    </div>
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      type="button"
                                      onClick={() => {
                                        setDiscountCode('');
                                        setDiscountValidation(null);
                                        setAppliedDiscount(0);
                                        toast.info('🗑️ Đã hủy mã giảm giá');
                                      }}
                                      className={cn(
                                        'px-3 py-1 rounded-full text-xs font-medium transition-all duration-200',
                                        getThemeClass(
                                          'bg-red-100 text-red-600 hover:bg-red-200',
                                          'bg-red-900/30 text-red-300 hover:bg-red-800/40'
                                        )
                                      )}
                                    >
                                      🗑️ Hủy mã
                                    </motion.button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
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
                  <motion.button
                    whileHover={{ scale: 1.03, boxShadow: '0px 0px 15px rgba(168,85,247,0.5)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
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

            {/* User Orders Section */}
            {userOrders.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className={cn(
                  'p-6 rounded-xl shadow-xl mt-6',
                  getThemeClass(
                    'bg-white/95 border border-gray-200 shadow-lg',
                    'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800'
                  )
                )}
              >
                <div className="flex items-center gap-3 mb-6">
                  <ShoppingCart className={cn(
                    'w-6 h-6',
                    getThemeClass('text-green-600', 'text-green-400')
                  )} />
                  <h3 className={cn(
                    'text-xl font-bold',
                    getThemeClass('text-green-700', 'text-green-300')
                  )}>
                    Vé đã mua cho sự kiện này
                  </h3>
                </div>
                
                {loadingOrders ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className={cn(
                      'w-6 h-6 animate-spin',
                      getThemeClass('text-green-600', 'text-green-400')
                    )} />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userOrders.map((order, index) => (
                      <motion.div
                        key={order.orderId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={cn(
                          'p-4 rounded-lg border-l-4',
                          getThemeClass(
                            'bg-green-50 border-green-400 text-green-800',
                            'bg-green-900/20 border-green-400 text-green-200'
                          )
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-semibold">
                              Đơn hàng #{order.orderId.slice(-8)}
                            </span>
                          </div>
                          <span className={cn(
                            'text-sm px-2 py-1 rounded-full font-medium',
                            getThemeClass('bg-green-200 text-green-800', 'bg-green-800 text-green-200')
                          )}>
                            Thành công
                          </span>
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          <p>
                            <span className="font-medium">Ngày mua:</span>{' '}
                            {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <p>
                            <span className="font-medium">Tổng tiền:</span>{' '}
                            {order.totalAmount > 0 
                              ? `${order.totalAmount.toLocaleString('vi-VN')} VNĐ`
                              : 'Miễn phí'
                            }
                          </p>
                          {order.orderDetails && order.orderDetails.length > 0 && (
                            <div className="mt-2">
                              <span className="font-medium">Vé đã mua:</span>
                              <div className="ml-4 mt-1 space-y-1">
                                {order.orderDetails.map((detail: any, detailIndex: number) => (
                                  <div key={detailIndex} className="text-xs opacity-90">
                                    • {detail.ticketName || 'Vé'} x{detail.quantity}
                                    {detail.pricePerTicket > 0 && (
                                      <span className="ml-2">
                                        ({detail.pricePerTicket.toLocaleString('vi-VN')} VNĐ/vé)
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
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
                  1440: { slidesPerView: 4 },
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
            setPendingReport(null);
          }}
          targetType={pendingReport.type}
          targetId={pendingReport.id}
          onLoginRequired={handleLoginRequired}
        />
      )}
      {showLoginModal && (
        <AuthModals
          open={showLoginModal}
          onClose={() => {
            setShowLoginModal(false);
            setPendingReport(null);
          }}
          onLoginSuccess={onLoginSuccess}
          onRegisterSuccess={() => {
            setShowLoginModal(false);
            setShowRegisterModal(true);
          }}
        />
      )}
      {showRegisterModal && (
        <RegisterModal
          open={showRegisterModal}
          onClose={() => {
            setShowRegisterModal(false);
            setPendingReport(null);
          }}
          onRegisterSuccess={onLoginSuccess}
          onLoginRedirect={() => {
            setShowRegisterModal(false);
            setShowLoginModal(true);
          }}
        />
      )}
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