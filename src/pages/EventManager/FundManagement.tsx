import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Wallet,
  CreditCard,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  getMyApprovedEvents,
  getEventFund,
  getEventBalance,
  getEventRevenue,
  getEventTransactions,
  requestWithdrawal,
} from '@/services/Event Manager/event.service';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';

interface Event {
  eventId: string;
  eventName: string;
  eventLocation: string;
  startAt: string;
  endAt: string;
}

interface Transaction {
  transactionId: string;
  eventId: string;
  orderId: string;
  transactionType: number;
  amount: number;
  transactionDescription: string;
  relatedEntityType: number;
  relatedEntityId: string;
  transactionStatus: number;
  initiatedBy: string;
  processedBy: string | null;
  notes: string;
  createdAt: string;
  processedAt: string | null;
}

export default function FundManagement() {
  const { t } = useTranslation();
  const { getThemeClass } = useThemeClasses();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  // const [fundData, setFundData] = useState<FundData | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [revenue, setRevenue] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawalAmount, setWithdrawalAmount] = useState<string>('');
  const [withdrawalNotes, setWithdrawalNotes] = useState<string>('');
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [withdrawalError, setWithdrawalError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchEvent, setSearchEvent] = useState('');
  const [eventRevenues, setEventRevenues] = useState<Record<string, number>>({});
  const [carouselIndex, setCarouselIndex] = useState(0);
  const visibleCount = 3;

  // Define callbacks first to avoid hoisting issues
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getMyApprovedEvents(1, 100);
      
      // Xử lý response mới với cấu trúc pagination
      let eventsData = [];
      if (response && typeof response === 'object' && 'items' in response) {
        eventsData = response.items || [];
      } else if (Array.isArray(response)) {
        eventsData = response;
      }
      
      setEvents(eventsData);
      if (eventsData.length > 0) {
        setSelectedEvent(eventsData[0]);
      }
    } catch {
      toast.error(t('errorLoadingEvents'));
    } finally {
      setLoading(false);
    }
  }, []); // Không cần t dependency vì chỉ gọi API

  const fetchFundData = useCallback(
    async (eventId: string) => {
      try {
        const [, /*fundRes*/ balanceRes, revenueRes, transactionsRes] = await Promise.all([
          getEventFund(eventId),
          getEventBalance(eventId),
          getEventRevenue(eventId),
          getEventTransactions(eventId),
        ]);

        // setFundData(fundRes.data || null);
        setBalance(balanceRes.data || 0);
        setRevenue(revenueRes.data || 0);
        const tx = transactionsRes.data;
        setTransactions(Array.isArray(tx) ? tx : Array.isArray(tx?.items) ? tx.items : []);
      } catch (error) {
        console.error('Error fetching fund data:', error);
        toast.error(t('errorLoadingFundData'));
      }
    },
    [t]
  );

  // Setup SignalR connections once on mount
  useEffect(() => {
    const setupRealtimeFundManagement = async () => {
      try {
        const { onEvent, onTicket, onNotification } = await import('@/services/signalr.service');

        const accountStr = localStorage.getItem('account');
        const accountObj = accountStr ? JSON.parse(accountStr) : null;
        const userId = accountObj?.userId || accountObj?.accountId;

        // Setup Event Hub listeners - using global connections managed by App.tsx
        onEvent('OnEventCreated', (data) => {
          if (data.createdBy === userId || data.CreatedBy === userId) {
            console.log('Event created - fund management update:', data);
            // Use window.location.reload() or dispatch custom event instead of fetchEvents
            window.dispatchEvent(new CustomEvent('refreshFundEvents'));
          }
        });

        onEvent('OnEventUpdated', (data) => {
          if (data.createdBy === userId || data.CreatedBy === userId) {
            console.log('Event updated - fund management update:', data);
            window.dispatchEvent(new CustomEvent('refreshFundEvents'));
          }
        });

        onEvent('OnEventDeleted', (data) => {
          if (data.createdBy === userId || data.CreatedBy === userId) {
            console.log('Event deleted - fund management update:', data);
            window.dispatchEvent(new CustomEvent('refreshFundEvents'));
          }
        });

        onEvent('OnEventCancelled', (data) => {
          if (data.createdBy === userId || data.CreatedBy === userId) {
            console.log('Event cancelled - fund management update:', data);
            toast.warning(t('eventCancelledFundsAffected'));
            window.dispatchEvent(new CustomEvent('refreshFundEvents'));
          }
        });

        onEvent('OnEventApproved', (data) => {
          if (data.createdBy === userId || data.CreatedBy === userId) {
            console.log('Event approved - fund management update:', data);
            toast.success(t('eventApprovedFundsAvailable'));
            window.dispatchEvent(new CustomEvent('refreshFundEvents'));
          }
        });

        // Setup Ticket Hub listeners - using global connections managed by App.tsx
        onTicket('OrderCreated', (data) => {
          console.log('Order created - fund update:', data);
          // Update revenue for any event in this manager's events
          setEventRevenues((prev) => {
            const currentRevenue = prev[data.eventId] || 0;
            return {
              ...prev,
              [data.eventId]: currentRevenue + (data.totalAmount || 0),
            };
          });
          toast.success(t('newOrderReceived', { amount: data.totalAmount }));
        });

        onTicket('OrderStatusChanged', (data) => {
          console.log('Order status changed - fund update:', data);
          if (data.status === 'Confirmed' || data.status === 'Completed') {
            toast.success(t('orderConfirmedRevenueUpdated'));
          } else if (data.status === 'Cancelled' || data.status === 'Refunded') {
            toast.warning(t('orderRefundedRevenueAdjusted'));
          }
        });

        onTicket('OnTicketSoldIncremented', (data) => {
          console.log('Ticket sold - fund update:', data);
          const additionalRevenue = (data.ticketPrice || 0) * (data.quantity || 1);

          setEventRevenues((prev) => ({
            ...prev,
            [data.eventId]: (prev[data.eventId] || 0) + additionalRevenue,
          }));
        });

        // Setup Notification Hub listeners - using global connections managed by App.tsx
        onNotification('ReceiveNotification', (notification) => {
          // Handle fund-related notifications
          if (
            notification.type === 'WithdrawalApproved' ||
            notification.type === 'WithdrawalRejected' ||
            notification.type === 'PaymentReceived' ||
            notification.type === 'FundUpdate'
          ) {
            console.log('Fund notification:', notification);

            if (notification.type === 'WithdrawalApproved') {
              toast.success(notification.message || t('withdrawalApproved'));
            } else if (notification.type === 'WithdrawalRejected') {
              toast.error(notification.message || t('withdrawalRejected'));
            } else if (notification.type === 'PaymentReceived') {
              toast.success(notification.message || t('paymentReceived'));
            }
          }
        });

        onNotification('TransactionStatusChanged', (data) => {
          console.log('Transaction status changed:', data);
          toast.info(t('transactionStatusUpdated'));
        });
      } catch (error) {
        console.error('Failed to setup realtime fund management:', error);
      }
    };

    setupRealtimeFundManagement();
  }, [t]); // Thêm t vào dependency để setup lại khi ngôn ngữ thay đổi

  // Fetch events khi component mount
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Listen for custom refresh events
  useEffect(() => {
    const handleRefreshEvents = () => {
      fetchEvents();
    };

    window.addEventListener('refreshFundEvents', handleRefreshEvents);
    return () => {
      window.removeEventListener('refreshFundEvents', handleRefreshEvents);
    };
  }, []); // Không cần fetchEvents dependency vì chỉ setup event listener

  // Handle selectedEvent changes separately
  useEffect(() => {
    if (selectedEvent) {
      fetchFundData(selectedEvent.eventId);
    }
  }, [selectedEvent, fetchFundData]);

  // Load event revenues when events change
  useEffect(() => {
    if (events.length === 0) return;

    const loadEventRevenues = async () => {
      const revenues: Record<string, number> = {};
      await Promise.all(
        events.map(async (ev) => {
          try {
            const res = await getEventRevenue(ev.eventId);
            revenues[ev.eventId] = res.data || 0;
          } catch {
            revenues[ev.eventId] = 0;
          }
        })
      );
      setEventRevenues(revenues);
    };

    loadEventRevenues();
  }, [events]);

  const handleRequestWithdrawal = async () => {
    setWithdrawalError(null); // Reset error state
    if (isSubmitting) return;
    if (!selectedEvent || !withdrawalAmount) {
      setWithdrawalError(t('pleaseEnterAmount'));
      setShowWithdrawalModal(false); // Close modal on error
      return;
    }

    const amount = parseFloat(withdrawalAmount);
    if (amount <= 0 || amount > balance) {
      setWithdrawalError(t('invalidAmount'));
      setShowWithdrawalModal(false); // Close modal on error
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading(t('processingWithdrawal'), {
      position: 'top-center',
      autoClose: false,
      closeOnClick: false,
      pauseOnHover: false,
      draggable: false,
      closeButton: false,
    });

    try {
      const response = await requestWithdrawal(selectedEvent.eventId, amount);
      
      // Check if the response indicates withdrawal is not enabled
      if (response?.data === false) {
        throw new Error('Withdrawal is not enabled for this event');
      }

      // Update loading toast to success
      toast.update(loadingToast, {
        render: t('withdrawalRequestSent'),
        type: 'success',
        isLoading: false,
        autoClose: 3000,
        closeButton: true,
      });

      setShowWithdrawalModal(false);
      setWithdrawalAmount('');
      setWithdrawalNotes('');
      fetchFundData(selectedEvent.eventId);
    } catch (error: any) {
      // Dismiss loading toast if it exists
      toast.dismiss(loadingToast);

      setShowWithdrawalModal(false); // Close modal on error
      
      if (error?.response?.data?.message === 'Withdrawal is not enabled for this event' || 
          error?.message === 'Withdrawal is not enabled for this event') {
        setWithdrawalError(t('withdrawalNotEnabled'));
        // Show error toast
        toast.error(t('withdrawalNotEnabled'), {
          position: 'top-center',
          autoClose: 5000,
        });
      } else {
        toast.error(t('errorSendingWithdrawalRequest'), {
          position: 'top-center',
          autoClose: 3000,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const getTransactionStatusText = (status: number) => {
    if (status === 0) return t('transactionSuccess');
    if (status === 1) return t('transactionFailed');
    return '';
  };

  const filteredTransactions = transactions
    .filter(
      (transaction) => transaction.transactionStatus === 0 || transaction.transactionStatus === 1
    )
    .filter((transaction) => {
      const search = searchTerm.toLowerCase();
      return (
        (transaction.transactionId.toLowerCase().includes(search) ||
          transaction.orderId.toLowerCase().includes(search) ||
          transaction.amount.toString().includes(search) ||
          transaction.transactionDescription.toLowerCase().includes(search) ||
          formatDate(transaction.createdAt).includes(search) ||
          formatDateTime(transaction.createdAt).includes(search)) &&
        (filterStatus === 'all' || transaction.transactionStatus.toString() === filterStatus)
      );
    });

  const filteredEvents = searchEvent.trim()
    ? (events || []).filter((ev) => ev.eventName.toLowerCase().includes(searchEvent.trim().toLowerCase()))
    : (events || []);

  const sortedEvents = [...filteredEvents].sort(
    (a, b) => (eventRevenues[b.eventId] || 0) - (eventRevenues[a.eventId] || 0)
  );
  const total = sortedEvents.length;
  const getCardColor = (idx: number): string => {
    const colors = [
      'bg-yellow-100/30 border-yellow-400',
      'bg-gray-100/30 border-gray-400',
      'bg-orange-100/30 border-orange-400',
      'bg-green-100/30 border-green-400',
      'bg-purple-100/30 border-purple-400',
      'bg-blue-100/30 border-blue-400',
    ];
    return colors[idx % colors.length];
  };
  const visibleEvents = Array.from(
    { length: Math.min(visibleCount, total) },
    (_, i) => sortedEvents[(carouselIndex + i) % total]
  );

  if (loading) {
    return (
      <div
        className={cn(
          'min-h-screen p-8 flex items-center justify-center',
          getThemeClass(
            'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-900',
            'bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e] text-white'
          )
        )}
      >
        <div className="text-center">
          <div
            className={cn(
              'animate-spin rounded-full h-32 w-32 border-b-2 mx-auto mb-4',
              getThemeClass('border-blue-400', 'border-green-400')
            )}
          ></div>
          <p className={cn('text-xl', getThemeClass('text-blue-600', 'text-green-300'))}>
            {t('loadingFundData')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'min-h-screen p-8',
        getThemeClass(
          'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-900',
          'bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e] text-white'
        )
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-center justify-between mb-12">
          <div className="flex items-center gap-4 mb-6 lg:mb-0">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Wallet className="text-green-400" size={48} />
            </motion.div>
            <div>
              <h1
                className={cn(
                  'text-4xl lg:text-5xl font-black tracking-wider text-transparent bg-clip-text',
                  getThemeClass(
                    'bg-gradient-to-r from-blue-600 to-purple-600',
                    'bg-gradient-to-r from-green-400 to-emerald-400'
                  )
                )}
              >
                {t('fundManagement')}
              </h1>
              <p className={cn('text-lg', getThemeClass('text-gray-600', 'text-gray-300'))}>
                {t('trackRevenueAndManageWithdrawals')}
              </p>
            </div>
          </div>
        </div>

        {/* Event Selector - Card Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="mb-4 flex flex-col md:flex-row md:items-center md:gap-4 gap-2">
            <label
              className={cn(
                'text-lg font-semibold',
                getThemeClass('text-blue-600', 'text-green-300')
              )}
            >
              {t('selectEvent')}:
            </label>
            <input
              type="text"
              placeholder={t('searchEvents')}
              value={searchEvent}
              onChange={(e) => setSearchEvent(e.target.value)}
              className={cn(
                'flex-1 min-w-[200px] p-3 rounded-xl border-2 focus:outline-none',
                getThemeClass(
                  'bg-white text-gray-900 border-blue-300 focus:border-blue-500 placeholder:text-gray-500',
                  'bg-[#2d0036]/80 text-white border-green-500/30 focus:border-green-400 placeholder:text-green-200'
                )
              )}
            />
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-4">
              <button
                className="p-3 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 text-white shadow-lg hover:scale-110 transition disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => setCarouselIndex((prev) => (prev - 1 + total) % total)}
                disabled={total <= visibleCount}
                aria-label={t('previous')}
              >
                <ChevronLeft size={28} />
              </button>
              <div className="flex gap-6">
                {visibleEvents.map((event, idx) => {
                  const isSelected = selectedEvent?.eventId === event.eventId;
                  let cardClass = `transition-all duration-300 rounded-2xl p-8 border-4 shadow-2xl min-w-[320px] max-w-[400px] cursor-pointer ${getCardColor(
                    (carouselIndex + idx) % total
                  )}`;
                  if (isSelected) {
                    cardClass += ' scale-105 shadow-2xl z-10 ring-4 ring-green-400/60';
                  } else {
                    cardClass += ' scale-100 opacity-90';
                  }
                  return (
                    <div
                      key={event.eventId}
                      className={cardClass}
                      onClick={() => setSelectedEvent(event)}
                      style={{ transition: 'all 0.3s cubic-bezier(.4,2,.6,1)' }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="text-2xl font-bold text-black">{event.eventName}</div>
                      </div>
                      <div className="text-gray-800 text-sm mb-1">
                        {event.startAt && event.endAt
                          ? `${new Date(event.startAt).toLocaleDateString('vi-VN')} - ${new Date(
                              event.endAt
                            ).toLocaleDateString('vi-VN')}`
                          : ''}
                      </div>
                      <div className="text-black text-xs font-semibold mb-2">
                        {event.eventLocation}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                className="p-3 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 text-white shadow-lg hover:scale-110 transition disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => setCarouselIndex((prev) => (prev + 1) % total)}
                disabled={total <= visibleCount}
                aria-label={t('next')}
              >
                <ChevronRight size={28} />
              </button>
            </div>
            {/* Dots indicator */}
            <div className="flex gap-2 mt-2">
              {Array.from({ length: total }).map((_, idx) => (
                <button
                  key={idx}
                  className={`w-3 h-3 rounded-full ${
                    carouselIndex === idx ? 'bg-green-400' : 'bg-gray-400'
                  }`}
                  onClick={() => setCarouselIndex(idx)}
                  aria-label={t('selectCard', { card: idx + 1 })}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Fund Overview */}
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-12"
          >
            <Card
              className={cn(
                'border-2 shadow-2xl',
                getThemeClass(
                  'bg-white/95 border-green-500/30',
                  'bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 border-green-500/30'
                )
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className={cn(
                        'text-sm font-semibold',
                        getThemeClass('text-green-600', 'text-green-300')
                      )}
                    >
                      {t('totalRevenue')}
                    </p>
                    <p
                      className={cn(
                        'text-3xl font-bold',
                        getThemeClass('text-green-700', 'text-green-400')
                      )}
                    >
                      {formatCurrency(revenue)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className={cn(
                'border-2 shadow-2xl',
                getThemeClass(
                  'bg-white/95 border-blue-500/30',
                  'bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 border-blue-500/30'
                )
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className={cn(
                        'text-sm font-semibold',
                        getThemeClass('text-blue-600', 'text-blue-300')
                      )}
                    >
                      {t('availableBalance')}
                    </p>
                    <p
                      className={cn(
                        'text-3xl font-bold',
                        getThemeClass('text-blue-700', 'text-blue-400')
                      )}
                    >
                      {formatCurrency(balance)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Fund Actions */}
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <div
              className={cn(
                'rounded-2xl p-6 border-2 shadow-2xl',
                getThemeClass(
                  'bg-white/95 border-green-500/30',
                  'bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 border-green-500/30'
                )
              )}
            >
              <h2
                className={cn(
                  'text-2xl font-bold mb-6',
                  getThemeClass('text-green-700', 'text-green-300')
                )}
              >
                {t('withdrawalRequest')}
              </h2>
              {withdrawalError && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700">
                  <p className="text-red-700 dark:text-red-300 text-sm">{withdrawalError}</p>
                </div>
              )}
              <Button
                onClick={() => setShowWithdrawalModal(true)}
                disabled={balance <= 0}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-6 py-3 rounded-xl disabled:opacity-50"
              >
                <Download className="mr-2" size={20} />
                {t('requestWithdrawal')}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Transactions */}
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={cn(
              'rounded-2xl p-6 border-2 shadow-2xl',
              getThemeClass(
                'bg-white/95 border-blue-500/30',
                'bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 border-blue-500/30'
              )
            )}
          >
            <div className="flex flex-col lg:flex-row items-center justify-between mb-6">
              <h2
                className={cn(
                  'text-2xl font-bold mb-4 lg:mb-0',
                  getThemeClass('text-blue-700', 'text-blue-300')
                )}
              >
                {t('transactionHistory')}
              </h2>

              <div className="flex gap-4">
                <div className="relative">
                  <Search
                    className={cn(
                      'absolute left-3 top-1/2 -translate-y-1/2',
                      getThemeClass('text-gray-400', 'text-gray-400')
                    )}
                    size={20}
                  />
                  <Input
                    type="text"
                    placeholder={t('searchTransactions')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={cn(
                      'pl-10',
                      getThemeClass(
                        'bg-white border-blue-300 text-gray-900 placeholder-gray-500',
                        'bg-[#1a0022]/60 border-blue-500/30 text-white placeholder-gray-400'
                      )
                    )}
                  />
                </div>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className={cn(
                    'px-4 py-2 rounded-lg',
                    getThemeClass(
                      'bg-white border border-blue-300 text-gray-900',
                      'bg-[#1a0022]/60 border border-blue-500/30 text-white'
                    )
                  )}
                >
                  <option value="all">{t('allStatus')}</option>
                  <option value="0">{t('success')}</option>
                  <option value="1">{t('failed')}</option>
                </select>
              </div>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard
                  className={cn('mx-auto mb-4', getThemeClass('text-gray-400', 'text-gray-400'))}
                  size={64}
                />
                <p className={cn('text-lg', getThemeClass('text-gray-500', 'text-gray-400'))}>
                  {t('noTransactions')}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr
                      className={cn(
                        'border-b',
                        getThemeClass('border-gray-300', 'border-blue-500/30')
                      )}
                    >
                      <th
                        className={cn(
                          'text-left p-4 font-semibold',
                          getThemeClass('text-blue-700', 'text-blue-300')
                        )}
                      >
                        {t('transactionId')}
                      </th>
                      <th
                        className={cn(
                          'text-left p-4 font-semibold',
                          getThemeClass('text-blue-700', 'text-blue-300')
                        )}
                      >
                        {t('orderId')}
                      </th>
                      <th
                        className={cn(
                          'text-left p-4 font-semibold',
                          getThemeClass('text-blue-700', 'text-blue-300')
                        )}
                      >
                        {t('description')}
                      </th>
                      <th
                        className={cn(
                          'text-center p-4 font-semibold',
                          getThemeClass('text-blue-700', 'text-blue-300')
                        )}
                      >
                        {t('amount')}
                      </th>
                      <th
                        className={cn(
                          'text-center p-4 font-semibold',
                          getThemeClass('text-blue-700', 'text-blue-300')
                        )}
                      >
                        {t('status')}
                      </th>
                      <th
                        className={cn(
                          'text-center p-4 font-semibold',
                          getThemeClass('text-blue-700', 'text-blue-300')
                        )}
                      >
                        {t('createdAt')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction, index) => (
                      <motion.tr
                        key={transaction.transactionId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={cn(
                          'border-b transition-colors',
                          getThemeClass(
                            'border-gray-200 hover:bg-blue-50',
                            'border-blue-500/10 hover:bg-blue-500/5'
                          )
                        )}
                      >
                        <td className={cn('p-4', getThemeClass('text-gray-900', 'text-white'))}>
                          {transaction.transactionId}
                        </td>
                        <td className={cn('p-4', getThemeClass('text-gray-900', 'text-white'))}>
                          {transaction.orderId}
                        </td>
                        <td className="p-4">
                          <div>
                            <p
                              className={cn(
                                'font-semibold',
                                getThemeClass('text-gray-900', 'text-white')
                              )}
                            >
                              {transaction.transactionDescription}
                            </p>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span
                            className={cn(
                              'font-semibold',
                              transaction.amount >= 0
                                ? getThemeClass('text-green-600', 'text-green-400')
                                : getThemeClass('text-red-600', 'text-red-400')
                            )}
                          >
                            {formatCurrency(Math.abs(transaction.amount))}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span
                            className={cn(
                              'text-sm font-semibold',
                              transaction.transactionStatus === 0
                                ? getThemeClass('text-green-600', 'text-green-400')
                                : getThemeClass('text-red-600', 'text-red-400')
                            )}
                          >
                            {getTransactionStatusText(transaction.transactionStatus)}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span
                            className={cn(
                              'text-sm',
                              getThemeClass('text-gray-500', 'text-gray-400')
                            )}
                          >
                            {formatDateTime(transaction.createdAt)}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* Withdrawal Modal */}
        {showWithdrawalModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              'fixed inset-0 flex items-center justify-center z-50',
              getThemeClass('bg-black/50', 'bg-black/50')
            )}
            onClick={() => setShowWithdrawalModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                'rounded-2xl p-8 border-2 shadow-2xl max-w-md w-full mx-4',
                getThemeClass(
                  'bg-white/95 border border-gray-200 shadow-lg',
                  'bg-gradient-to-br from-[#2d0036] to-[#3a0ca3] border-green-500/30'
                )
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <h3
                className={cn(
                  'text-2xl font-bold mb-6',
                  getThemeClass('text-blue-600', 'text-green-300')
                )}
              >
                {t('withdrawalRequest')}
              </h3>
              <div className="space-y-4">
                {withdrawalError && (
                  <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700">
                    <p className="text-red-700 dark:text-red-300 text-sm">{withdrawalError}</p>
                  </div>
                )}
                <div>
                  <label
                    className={cn(
                      'block text-sm font-semibold mb-2',
                      getThemeClass('text-blue-600', 'text-green-300')
                    )}
                  >
                    {t('withdrawalAmount')}:
                  </label>
                  <Input
                    type="number"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    placeholder={t('enterWithdrawalAmount')}
                    className={cn(
                      getThemeClass(
                        'bg-white border-blue-300 text-gray-900',
                        'bg-[#1a0022]/60 border-green-500/30 text-white'
                      )
                    )}
                  />
                  <p
                    className={cn('text-sm mt-1', getThemeClass('text-gray-500', 'text-gray-400'))}
                  >
                    {t('availableBalance')}: {formatCurrency(balance)}
                  </p>
                </div>
                <div>
                  <label
                    className={cn(
                      'block text-sm font-semibold mb-2',
                      getThemeClass('text-blue-600', 'text-green-300')
                    )}
                  >
                    {t('withdrawalNotes')}:
                  </label>
                  <textarea
                    value={withdrawalNotes}
                    onChange={(e) => setWithdrawalNotes(e.target.value)}
                    placeholder={t('withdrawalNotesPlaceholder')}
                    className={cn(
                      'w-full p-3 rounded-lg resize-none',
                      getThemeClass(
                        'bg-white border-blue-300 text-gray-900 placeholder-gray-500',
                        'bg-[#1a0022]/60 border-green-500/30 text-white placeholder-gray-400'
                      )
                    )}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <Button
                  onClick={handleRequestWithdrawal}
                  className={cn(
                    'flex-1',
                    getThemeClass(
                      'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white',
                      'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white'
                    )
                  )}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('sending')}
                    </>
                  ) : (
                    t('sendRequest')
                  )}
                </Button>
                <Button
                  onClick={() => setShowWithdrawalModal(false)}
                  className={cn(
                    'flex-1',
                    getThemeClass(
                      'bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-300 hover:to-gray-400 text-white',
                      'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white'
                    )
                  )}
                >
                  {t('cancel')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
