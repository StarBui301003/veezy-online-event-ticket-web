import { useState } from 'react';

import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationDropdown } from '@/components/common/NotificationDropdown';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import DashboardSummaryCards from './components/DashboardSummaryCards';
import RevenueChartSection from './components/RevenueChartSection';
import UpcomingEventsTable from './components/UpcomingEventsTable';
import ExportButtons from './components/ExportButtons';
import TicketStatsSection from './components/TicketStatsSection';
import PerformanceCompareChart from './components/PerformanceCompareChart';



export default function EventManagerDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [notifDropdown, setNotifDropdown] = useState(false);
  const accountStr = typeof window !== 'undefined' ? localStorage.getItem('account') : null;
  const accountObj = accountStr ? JSON.parse(accountStr) : null;
  const userId = accountObj?.userId || accountObj?.accountId;
  const {
    notifications,
    notifLoading,
    notifHasMore,
    notifRef,
    handleReadNotification,
    handleReadAll,
    handleLoadMore,
  } = useNotifications({ userId, maxNotifications: 30, language: t('lang') });

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
            <div className="relative">
              <button
                className="flex items-center justify-center w-11 h-11 rounded-full hover:bg-slate-200/30 transition-all relative"
                onClick={() => setNotifDropdown(v => !v)}
                title={t('notification')}
              >
                <Bell className="text-purple-400 text-2xl" />
                {/* Unread indicator handled inside NotificationDropdown */}
              </button>
              {notifDropdown && (
                <NotificationDropdown
                  notifications={notifications}
                  notifLoading={notifLoading}
                  notifHasMore={notifHasMore}
                  notifRef={notifRef}
                  onReadNotification={n => handleReadNotification(n, url => { navigate(url); setNotifDropdown(false); })}
                  onReadAll={handleReadAll}
                  onLoadMore={handleLoadMore}
                  onViewAll={() => { setNotifDropdown(false); navigate('/event-manager/all-notifications'); }}
                  t={t}
                />
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
