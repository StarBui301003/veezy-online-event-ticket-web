import { useState } from 'react';
import { addDays, format } from 'date-fns';
import { DateRange } from 'react-date-range';

import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationDropdown } from '@/components/common/NotificationDropdown';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import DashboardSummaryCards from './components/DashboardSummaryCards';
import RevenueChartSection from './components/RevenueChartSection';

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

  // Date filter state
  const [dateRange, setDateRange] = useState([
    {
      startDate: addDays(new Date(), -7),
      endDate: new Date(),
      key: 'selection',
    },
  ]);
  const [groupBy, setGroupBy] = useState(1); // 1: day, 2: week, 3: month

  // Format params for API
  const filterParams = {
    CustomStartDate: format(dateRange[0].startDate, 'yyyy-MM-dd'),
    CustomEndDate: format(dateRange[0].endDate, 'yyyy-MM-dd'),
    GroupBy: groupBy,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">{t('dashboard')}</h1>
          <div className="flex flex-col md:flex-row items-center gap-4">
            {/* Date range filter */}
            <div className="flex items-center gap-2">
              {/* Dropdown filter giống Admin */}
              <select
                value={groupBy}
                onChange={e => setGroupBy(Number(e.target.value))}
                className="px-3 py-2 rounded border border-sky-200 text-black bg-white focus:outline-none focus:ring-2 focus:ring-sky-300 shadow-sm"
                style={{ minWidth: 120 }}
              >
                <option value={4}>All</option>
                <option value={0}>Day</option>
                <option value={1}>Week</option>
                <option value={2}>Month</option>
                <option value={3}>Year</option>
                <option value={5}>Custom</option>
              </select>
              {/* Nếu chọn Custom thì show DateRange */}
              {groupBy === 5 && (
                <DateRange
                  editableDateInputs={true}
                  onChange={item => setDateRange([item.selection])}
                  moveRangeOnFirstSelection={false}
                  ranges={dateRange}
                  maxDate={new Date()}
                  className="bg-white text-black rounded-xl shadow-lg"
                />
              )}
            </div>
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
        <DashboardSummaryCards filter={filterParams} />
        {/* Revenue chart by event */}
        <RevenueChartSection filter={filterParams} />
        {/* Ticket sales by event */}
        <TicketStatsSection filter={filterParams} />
        {/* Upcoming events table */}
        
        {/* PerformanceCompareChart will be added here */}
        <PerformanceCompareChart filter={filterParams} />
      </div>
    </div>
  );
}
