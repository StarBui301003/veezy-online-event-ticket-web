import { useState, useEffect } from 'react';
import { Bell, Filter, Calendar, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import NotificationDropdown from '@/components/common/NotificationDropdown';
import ExportButtons from './components/ExportButtons';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import RevenueChartSection from './components/RevenueChartSection';
import TicketStatsSection from './components/TicketStatsSection';
import DashboardSummaryCards from './components/DashboardSummaryCards';
import { NotificationProvider } from '@/contexts/NotificationContext';

// TimePeriod enum matching API
const TimePeriod = {
  Today: 1,
  Yesterday: 2,
  ThisWeek: 3,
  LastWeek: 4,
  ThisMonth: 5,
  LastMonth: 6,
  ThisQuarter: 7,
  LastQuarter: 8,
  ThisYear: 9,
  LastYear: 10,
  Last7Days: 11,
  Last30Days: 12,
  Last90Days: 13,
  Last365Days: 14,
  AllTime: 15,
  Custom: 16
};

const GroupBy = {
  Hour: 0,
  Day: 1,
  Week: 2,
  Month: 3,
  Quarter: 4,
  Year: 5
};

export default function EventManagerDashboard() {
  const { t } = useTranslation();
  const [notifDropdown, setNotifDropdown] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(TimePeriod.Last30Days);
  const [groupBy, setGroupBy] = useState(GroupBy.Day);

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [activeTab, setActiveTab] = useState('revenue'); // New state for tab switching
  const { unreadCount } = useRealtimeNotifications(2); // Only event manager notifications
  const accountStr = typeof window !== 'undefined' ? localStorage.getItem('account') : null;
  const accountObj = accountStr ? JSON.parse(accountStr) : null;
  const userId = accountObj?.userId || accountObj?.accountId;

  // Tab options with full API mapping
  const periodTabs = [
    { id: TimePeriod.Today, label: 'Hôm nay', shortLabel: 'Hôm nay', icon: '📅' },
    { id: TimePeriod.Yesterday, label: 'Hôm qua', shortLabel: 'Hôm qua', icon: '📅' },
    { id: TimePeriod.ThisWeek, label: 'Tuần này', shortLabel: 'Tuần', icon: '📊' },
    { id: TimePeriod.LastWeek, label: 'Tuần trước', shortLabel: 'Tuần trước', icon: '📊' },
    { id: TimePeriod.ThisMonth, label: 'Tháng này', shortLabel: 'Tháng', icon: '📈' },
    { id: TimePeriod.LastMonth, label: 'Tháng trước', shortLabel: 'Tháng trước', icon: '📈' },
    { id: TimePeriod.ThisQuarter, label: 'Quý này', shortLabel: 'Quý', icon: '📊' },
    { id: TimePeriod.LastQuarter, label: 'Quý trước', shortLabel: 'Quý trước', icon: '📊' },
    { id: TimePeriod.ThisYear, label: 'Năm này', shortLabel: 'Năm', icon: '🎯' },
    { id: TimePeriod.LastYear, label: 'Năm trước', shortLabel: 'Năm trước', icon: '🎯' },
    { id: TimePeriod.Last7Days, label: '7 ngày qua', shortLabel: '7 ngày', icon: '📆' },
    { id: TimePeriod.Last30Days, label: '30 ngày qua', shortLabel: '30 ngày', icon: '📉' },
    { id: TimePeriod.Last90Days, label: '90 ngày qua', shortLabel: '90 ngày', icon: '📋' },
    { id: TimePeriod.Last365Days, label: '365 ngày qua', shortLabel: '365 ngày', icon: '📅' },
    { id: TimePeriod.AllTime, label: 'Toàn thời gian', shortLabel: 'All', icon: '∞' },
    { id: TimePeriod.Custom, label: 'Tùy chỉnh', shortLabel: 'Tùy chỉnh', icon: '⚙️' }
  ];

  const groupByOptions = [
    { value: GroupBy.Hour, label: 'Theo giờ' },
    { value: GroupBy.Day, label: 'Theo ngày' },
    { value: GroupBy.Week, label: 'Theo tuần' },
    { value: GroupBy.Month, label: 'Theo tháng' },
    { value: GroupBy.Quarter, label: 'Theo quý' },
    { value: GroupBy.Year, label: 'Theo năm' }
  ];

  useEffect(() => {
    const setupRealtimeDashboard = async () => {
      try {
        const { 
          connectAnalyticsHub, 
          onAnalytics, 
          connectTicketHub, 
          onTicket,
          connectEventHub,
          onEvent,
          connectNotificationHub,
          onNotification
        } = await import('@/services/signalr.service');

        const token = localStorage.getItem('access_token');

        // Connect to Analytics Hub for real-time dashboard updates
        await connectAnalyticsHub('http://localhost:5006/analyticsHub', token || undefined);
        
        onAnalytics('OnEventManagerRealtimeOverview', (data) => {
          console.log('Real-time analytics overview:', data);
          // Force refresh of dashboard components
          window.dispatchEvent(new CustomEvent('dashboardDataUpdate', { detail: data }));
        });

        onAnalytics('OnEventManagerPerformanceComparison', (data) => {
          console.log('Performance comparison update:', data);
          // Update performance metrics
          window.dispatchEvent(new CustomEvent('performanceDataUpdate', { detail: data }));
        });

        onAnalytics('OnRevenueUpdate', (data) => {
          console.log('Revenue update:', data);
          // Update revenue charts
          window.dispatchEvent(new CustomEvent('revenueDataUpdate', { detail: data }));
        });

        // Connect to Ticket Hub for ticket sales updates
        await connectTicketHub('http://localhost:5005/notificationHub', token || undefined);
        
        onTicket('OnTicketSoldIncremented', (data) => {
          console.log('Ticket sold - dashboard update:', data);
          // Update ticket statistics
          window.dispatchEvent(new CustomEvent('ticketSalesUpdate', { detail: data }));
        });

        onTicket('OrderCreated', (data) => {
          console.log('New order - dashboard update:', data);
          // Update order statistics
          window.dispatchEvent(new CustomEvent('orderUpdate', { detail: data }));
        });

        onTicket('OrderStatusChanged', (data) => {
          console.log('Order status changed - dashboard update:', data);
          window.dispatchEvent(new CustomEvent('orderStatusUpdate', { detail: data }));
        });

        // Connect to Event Hub for event updates
        await connectEventHub('http://localhost:5004/notificationHub');

        onEvent('OnEventApproved', (data) => {
          if (data.createdBy === userId || data.CreatedBy === userId) {
            console.log('Event approved - dashboard update:', data);
            window.dispatchEvent(new CustomEvent('eventStatusUpdate', { detail: data }));
          }
        });

        onEvent('OnEventCancelled', (data) => {
          if (data.createdBy === userId || data.CreatedBy === userId) {
            console.log('Event cancelled - dashboard update:', data);
            window.dispatchEvent(new CustomEvent('eventCancelledUpdate', { detail: data }));
          }
        });

        onEvent('OnEventUpdated', (data) => {
          if (data.createdBy === userId || data.CreatedBy === userId) {
            console.log('Event updated - dashboard update:', data);
            window.dispatchEvent(new CustomEvent('eventDataUpdate', { detail: data }));
          }
        });

        // Connect to Notification Hub for dashboard notifications
        if (token) {
          await connectNotificationHub('http://localhost:5003/hubs/notifications', token);
          
          onNotification('ReceiveNotification', (notification) => {
            // Handle dashboard-specific notifications
            if (notification.type === 'DashboardUpdate' || 
                notification.type === 'AnalyticsUpdate' ||
                notification.type === 'RevenueAlert' ||
                notification.type === 'SalesTarget') {
              console.log('Dashboard notification:', notification);
              
              // Show notification based on type
              if (notification.type === 'RevenueAlert') {
                toast.info(notification.message);
              } else if (notification.type === 'SalesTarget') {
                toast.success(notification.message);
              }
            }
          });
        }

      } catch (error) {
        console.error('Failed to setup realtime dashboard:', error);
      }
    };

    setupRealtimeDashboard();

    return () => {
      // Clean up SignalR connections if needed
    };
  }, [userId]);

  const handlePeriodChange = (periodId) => {
    setSelectedPeriod(periodId);
    if (periodId !== TimePeriod.Custom) {
      setCustomStartDate('');
      setCustomEndDate('');
    } else {
      if (!customStartDate) {
        const defaultStart = new Date();
        defaultStart.setDate(defaultStart.getDate() - 30);
        setCustomStartDate(defaultStart.toISOString().split('T')[0]);
      }
      if (!customEndDate) {
        setCustomEndDate(new Date().toISOString().split('T')[0]);
      }
    }
  };

  const getCurrentPeriodLabel = () => {
    const tab = periodTabs.find(tab => tab.id === selectedPeriod);
    return tab?.label || 'Tùy chỉnh';
  };

  const currentFilter = {
    period: selectedPeriod,
    customStartDate: customStartDate,
    customEndDate: customEndDate,
    groupBy: groupBy,
    includeComparison: false,
    comparisonPeriod: 0,
    includeRealtimeData: true
  };

  return (
    <NotificationProvider userId={userId} userRole={2}>
      <div className="min-h-screen bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e] text-white p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
            <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Dashboard
            </h1>
            
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur-sm border transition-all ${
                  showAdvancedFilters 
                    ? 'bg-purple-600/30 border-purple-400/50 text-purple-200' 
                    : 'bg-white/10 border-white/20 hover:bg-white/20 text-white'
                }`}
              >
                <Filter size={18} />
                <span className="hidden sm:inline">Bộ lọc</span>
              </button>

              <ExportButtons />

              <div className="relative">
                <button
                  onClick={() => setNotifDropdown(!notifDropdown)}
                  className="flex items-center justify-center w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all relative"
                >
                  <Bell size={20} className="text-purple-400" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {notifDropdown && (
                  <div className="absolute right-0 mt-2 z-50">
                    <NotificationDropdown
                      userId={userId}
                      userRole={2}
                      onViewAll={() => setNotifDropdown(false)}
                      onRedirect={() => setNotifDropdown(false)}
                      t={t}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Period Filter */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 mb-4">
              {periodTabs.filter(tab => 
                [1, 3, 5, 12, 13, 9, 16].includes(tab.id)
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handlePeriodChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedPeriod === tab.id
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-105'
                      : 'bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Range */}
          {selectedPeriod === TimePeriod.Custom && (
            <div className="mb-6 p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-purple-400/30">
              <h3 className="text-lg font-semibold mb-4 text-purple-200">Chọn khoảng thời gian tùy chỉnh</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-purple-200">Từ ngày</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-purple-300/30 bg-white/10 backdrop-blur-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-purple-200">Đến ngày</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-purple-300/30 bg-white/10 backdrop-blur-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <Card className="mb-6 bg-white/10 backdrop-blur-sm border-purple-400/30">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-purple-200">Bộ lọc nâng cao</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-purple-200">Nhóm dữ liệu theo</label>
                    <select
                      value={groupBy}
                      onChange={(e) => setGroupBy(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-purple-300/30 bg-white/10 backdrop-blur-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                      {groupByOptions.map(option => (
                        <option key={option.value} value={option.value} className="bg-gray-800">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current Filter Status */}
          <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-300/30">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-purple-300" />
                <span className="text-purple-200">Thời gian:</span>
                <span className="font-semibold text-white">{getCurrentPeriodLabel()}</span>
                {selectedPeriod === TimePeriod.Custom && customStartDate && customEndDate && (
                  <span className="text-sm text-purple-200">
                    ({new Date(customStartDate).toLocaleDateString('vi-VN')} - {new Date(customEndDate).toLocaleDateString('vi-VN')})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-blue-300" />
                <span className="text-blue-200">Nhóm:</span>
                <span className="font-semibold text-white">{groupByOptions.find(opt => opt.value === groupBy)?.label}</span>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <DashboardSummaryCards filter={currentFilter} />

          {/* Chart Tabs */}
          <div className="mb-6">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab('revenue')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'revenue'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 hover:bg-white/20 hover:text-white'
                }`}
              >
                Doanh thu
              </button>
              <button
                onClick={() => setActiveTab('tickets')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'tickets'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 hover:bg-white/20 hover:text-white'
                }`}
              >
                Thống kê vé
              </button>
            </div>
          </div>

          {/* Chart Content */}
          {activeTab === 'revenue' && (
            <RevenueChartSection 
              filter={{
                CustomStartDate: customStartDate,
                CustomEndDate: customEndDate,
                GroupBy: groupBy,
                Period: selectedPeriod
              }}
            />
          )}
          {activeTab === 'tickets' && (
            <TicketStatsSection 
              filter={{
                CustomStartDate: customStartDate,
                CustomEndDate: customEndDate,
                GroupBy: groupBy,
                Period: selectedPeriod
              }}
            />
          )}
        </div>
      </div>
    </NotificationProvider>
  );
}