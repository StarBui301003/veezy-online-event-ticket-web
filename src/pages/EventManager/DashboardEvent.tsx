import DashboardSummaryCards from './components/DashboardSummaryCards';
import RevenueChartSection from './components/RevenueChartSection';
import UpcomingEventsTable from './components/UpcomingEventsTable';
import { Bell } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { getUserNotifications, markNotificationRead, markAllNotificationsRead } from '@/services/notification.service';
import ExportButtons from './components/ExportButtons';
import TicketStatsSection from './components/TicketStatsSection';
import PerformanceCompareChart from './components/PerformanceCompareChart';
import { useTranslation } from 'react-i18next';

interface Notification {
  notificationId: string;
  userId: string;
  notificationTitle: string;
  notificationMessage: string;
  notificationType: number;
  isRead: boolean;
  redirectUrl?: string;
  createdAt: string;
  createdAtVietnam?: string;
  readAt?: string;
  readAtVietnam?: string;
}

export default function EventManagerDashboard() {
  const { t } = useTranslation();
  const [notifDropdown, setNotifDropdown] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifHasUnread, setNotifHasUnread] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifPage, setNotifPage] = useState(1);
  const [notifHasMore, setNotifHasMore] = useState(true);
  const userId = (() => {
    try {
      const accStr = localStorage.getItem('account');
      if (accStr) {
        const acc = JSON.parse(accStr);
        return acc.userId || acc.accountId;
      }
    } catch { /* ignore */ }
    return '';
  })();

  useEffect(() => {
    if (!userId) return;
    getUserNotifications(userId, 1, 5).then(res => {
      const items = res.data?.data?.items || [];
      setNotifications(items);
      setNotifHasUnread(items.some((n: Notification) => !n.isRead));
      setNotifHasMore(res.data?.data?.hasNextPage ?? false);
    });
  }, [userId]);

  useEffect(() => {
    if (!notifDropdown || !userId) return;
    setNotifLoading(true);
    getUserNotifications(userId, 1, 5)
      .then(res => {
        const items = res.data?.data?.items || [];
        setNotifications(items);
        setNotifHasUnread(items.some((n: Notification) => !n.isRead));
        setNotifPage(1);
        setNotifHasMore(res.data?.data?.hasNextPage ?? false);
      })
      .finally(() => setNotifLoading(false));
  }, [notifDropdown, userId]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifDropdown(false);
      }
    };
    if (notifDropdown) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [notifDropdown]);

  const handleReadNotification = async (notification: Notification) => {
    if (!notification.isRead && userId) {
      await markNotificationRead(notification.notificationId, userId);
    }
    // Refetch notifications
    if (userId) {
      const res = await getUserNotifications(userId, 1, notifPage * 5);
      const items = res.data?.data?.items || [];
      setNotifications(items);
      setNotifHasUnread(items.some((n: Notification) => !n.isRead));
      setNotifHasMore(res.data?.data?.hasNextPage ?? false);
    }
    // Redirect nếu có
    if (notification.redirectUrl) {
      window.location.href = notification.redirectUrl;
      setNotifDropdown(false);
    }
  };

  const handleReadAll = async () => {
    if (userId) {
      await markAllNotificationsRead(userId);
      const res = await getUserNotifications(userId, 1, notifPage * 5);
      const items = res.data?.data?.items || [];
      setNotifications(items);
      setNotifHasUnread(false);
      setNotifHasMore(res.data?.data?.hasNextPage ?? false);
    }
  };

  const handleLoadMore = async () => {
    if (!userId || notifLoading || !notifHasMore) return;
    setNotifLoading(true);
    const nextPage = notifPage + 1;
    const res = await getUserNotifications(userId, nextPage, 5);
    const items: Notification[] = res.data?.data?.items || [];
    setNotifications(prev => [...prev, ...items]);
    setNotifPage(nextPage);
    setNotifHasMore(res.data?.data?.hasNextPage ?? false);
    setNotifLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">{t('dashboard')}</h1>
          <div className="flex items-center gap-4">
            {/* Export Excel button on the left */}
            <div>
              <ExportButtons />
            </div>
            <div className="relative" ref={notifRef}>
              <button
                className="flex items-center justify-center w-11 h-11 rounded-full hover:bg-slate-200/30 transition-all relative"
                onClick={() => setNotifDropdown(v => !v)}
                title={t('notification')}
              >
                <Bell className="text-purple-400 text-2xl" />
                {notifHasUnread && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
              </button>
              {notifDropdown && (
                <div className="absolute right-0 z-30 mt-2 w-80 bg-white text-gray-900 rounded-xl shadow-2xl border border-purple-400/30 overflow-hidden animate-fadeIn">
                  <div className="flex items-center justify-between p-4 border-b font-bold text-purple-600 gap-2">
                    <span className="flex items-center gap-2"><Bell className="text-purple-400" /> {t('newNotifications')}</span>
                    <button
                      className="text-xs text-purple-500 hover:underline font-semibold px-2 py-1 rounded hover:bg-purple-100 transition"
                      onClick={handleReadAll}
                      disabled={notifications.length === 0 || notifications.every(n => n.isRead)}
                    >
                      {t('markAllRead')}
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifLoading && notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-400">{t('loading')}</div>
                    ) : notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-400">{t('noNotifications')}</div>
                    ) : (
                      <>
                        {notifications.map((n) => (
                          <button
                            key={n.notificationId}
                            className={`w-full text-left px-4 py-3 border-b last:border-b-0 ${n.isRead ? 'bg-white' : 'bg-purple-50 hover:bg-purple-100'} transition`}
                            onClick={() => handleReadNotification(n)}
                          >
                            <div className="font-semibold text-sm text-purple-700 truncate">{n.notificationTitle}</div>
                            <div className="text-xs text-gray-600 truncate">{n.notificationMessage}</div>
                            <div className="text-[10px] text-gray-400 mt-1">{n.createdAtVietnam || n.createdAt}</div>
                          </button>
                        ))}
                        {notifications.length > 0 && notifHasMore && (
                          <button
                            className="w-full py-3 text-center text-purple-600 font-semibold hover:bg-purple-50 border-t border-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleLoadMore}
                            disabled={notifLoading || !notifHasMore}
                          >
                            {notifLoading ? t('loading') : t('loadMore')}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Summary cards */}
        <DashboardSummaryCards />
        {/* Revenue chart by event */}
        <RevenueChartSection />
        {/* Ticket sales by event */}
        <TicketStatsSection />
        {/* Upcoming events table */}
        <UpcomingEventsTable />
        {/* PerformanceCompareChart will be added here */}
        <PerformanceCompareChart />
      </div>
    </div>
  );
}
