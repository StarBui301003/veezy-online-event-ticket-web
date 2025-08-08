import { useState, useEffect } from 'react';
import { Bell, Filter, Calendar, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import NotificationDropdown from '@/components/common/NotificationDropdown';
import ExportButtons from './components/ExportButtons';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import RevenueChartSection from './components/RevenueChartSection';
import TicketStatsSection from './components/TicketStatsSection';
import DashboardSummaryCards from './components/DashboardSummaryCards';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';

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
  Custom: 16,
};

const GroupBy = {
  Hour: 0,
  Day: 1,
  Week: 2,
  Month: 3,
  Quarter: 4,
  Year: 5,
};

export default function EventManagerDashboard() {
  const { t } = useTranslation();
  const { getThemeClass } = useThemeClasses();
  const navigate = useNavigate();
  const [notifDropdown, setNotifDropdown] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(TimePeriod.Last30Days);
  const [groupBy, setGroupBy] = useState(GroupBy.Day);

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [activeTab, setActiveTab] = useState('revenue'); // New state for tab switching
  const { unreadCount } = useRealtimeNotifications();
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
    { id: TimePeriod.Custom, label: 'Tùy chỉnh', shortLabel: 'Tùy chỉnh', icon: '⚙️' },
  ];

  const groupByOptions = [
    { value: GroupBy.Hour, label: 'Theo giờ' },
    { value: GroupBy.Day, label: 'Theo ngày' },
    { value: GroupBy.Week, label: 'Theo tuần' },
    { value: GroupBy.Month, label: 'Theo tháng' },
    { value: GroupBy.Quarter, label: 'Theo quý' },
    { value: GroupBy.Year, label: 'Theo năm' },
  ];

  useEffect(() => {
    const setupRealtimeDashboard = async () => {
      try {
        const {
          onAnalytics,
          onTicket,
          onEvent,
          onNotification,
        } = await import('@/services/signalr.service');

        // Setup realtime listeners using global connections
        // All SignalR connections are managed globally in App.tsx

        // Analytics Hub listeners
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

        // Ticket Hub listeners using global connections
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

        // Event Hub listeners using global connections

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

        // Notification Hub listeners using global connections
        onNotification('ReceiveNotification', (notification) => {
          // Handle dashboard-specific notifications
          if (
            notification.type === 'DashboardUpdate' ||
            notification.type === 'AnalyticsUpdate' ||
            notification.type === 'RevenueAlert' ||
            notification.type === 'SalesTarget'
          ) {
            console.log('Dashboard notification:', notification);

            // Show notification based on type
            if (notification.type === 'RevenueAlert') {
              toast.info(notification.message);
            } else if (notification.type === 'SalesTarget') {
              toast.success(notification.message);
            }
          }
        });
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
    const tab = periodTabs.find((tab) => tab.id === selectedPeriod);
    return tab?.label || 'Tùy chỉnh';
  };

  const currentFilter = {
    period: selectedPeriod,
    customStartDate: customStartDate,
    customEndDate: customEndDate,
    groupBy: groupBy,
    includeComparison: false,
    comparisonPeriod: 0,
    includeRealtimeData: true,
  };

  return (
    <NotificationProvider userId={userId} userRole={2}>
      <div
        className={cn(
          'min-h-screen p-4 md:p-8 relative',
          getThemeClass(
            'bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-100 text-gray-900',
            'bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e] text-white'
          )
        )}
      >
        {/* Background Pattern for Light Theme */}
        {getThemeClass && (
          <div
            className={cn(
              'absolute inset-0 opacity-5 pointer-events-none',
              getThemeClass('block', 'hidden')
            )}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,_rgba(59,130,246,0.1)_0%,_transparent_50%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_75%,_rgba(6,182,212,0.1)_0%,_transparent_50%)]"></div>
          </div>
        )}

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
            <h1
              className={cn(
                'text-3xl md:text-4xl font-black text-transparent bg-clip-text',
                getThemeClass(
                  'bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600',
                  'bg-gradient-to-r from-purple-400 to-pink-400'
                )
              )}
            >
              Dashboard
            </h1>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur-sm border transition-all',
                  getThemeClass(
                    showAdvancedFilters
                      ? 'bg-blue-600/20 border-blue-400/50 text-blue-800 shadow-lg'
                      : 'bg-white/80 border-white/60 hover:bg-white/90 text-gray-700 shadow-md',
                    showAdvancedFilters
                      ? 'bg-purple-600/30 border-purple-400/50 text-purple-200'
                      : 'bg-white/10 border-white/20 hover:bg-white/20 text-white'
                  )
                )}
              >
                <Filter size={18} />
                <span className="hidden sm:inline">Bộ lọc</span>
              </button>

              <ExportButtons />

              <div className="relative">
                <button
                  onClick={() => setNotifDropdown(!notifDropdown)}
                  className={cn(
                    'flex items-center justify-center w-11 h-11 rounded-full backdrop-blur-sm border transition-all relative shadow-md',
                    getThemeClass(
                      'bg-white/80 border-white/60 hover:bg-white/90 shadow-lg',
                      'bg-white/10 border-white/20 hover:bg-white/20'
                    )
                  )}
                >
                  <Bell
                    size={20}
                    className={cn(getThemeClass('text-blue-600', 'text-purple-400'))}
                  />
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
                      onViewAll={() => {
                        setNotifDropdown(false);
                        navigate('/event-manager/notifications');
                      }}
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
              {periodTabs
                .filter((tab) => [1, 3, 5, 12, 13, 9, 16].includes(tab.id))
                .map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handlePeriodChange(tab.id)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all shadow-md',
                      getThemeClass(
                        selectedPeriod === tab.id
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg scale-105'
                          : 'bg-white/80 backdrop-blur-sm border border-white/60 text-gray-700 hover:bg-white/90 hover:text-gray-800 shadow-md',
                        selectedPeriod === tab.id
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-105'
                          : 'bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 hover:bg-white/20 hover:text-white'
                      )
                    )}
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
            <div
              className={cn(
                'mb-6 p-4 rounded-lg backdrop-blur-sm border shadow-lg',
                getThemeClass(
                  'bg-white/90 border-blue-200/50 shadow-xl',
                  'bg-white/10 backdrop-blur-sm border-purple-400/30'
                )
              )}
            >
              <h3
                className={cn(
                  'text-lg font-semibold mb-4',
                  getThemeClass('text-blue-700', 'text-purple-200')
                )}
              >
                Chọn khoảng thời gian tùy chỉnh
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className={cn(
                      'block text-sm font-medium mb-2',
                      getThemeClass('text-blue-700', 'text-purple-200')
                    )}
                  >
                    Từ ngày
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className={cn(
                      'w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2',
                      getThemeClass(
                        'border-blue-300/30 bg-white/20 text-gray-900 focus:ring-blue-400',
                        'border-purple-300/30 bg-white/10 backdrop-blur-sm text-white focus:ring-purple-400'
                      )
                    )}
                  />
                </div>
                <div>
                  <label
                    className={cn(
                      'block text-sm font-medium mb-2',
                      getThemeClass('text-blue-700', 'text-purple-200')
                    )}
                  >
                    Đến ngày
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className={cn(
                      'w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2',
                      getThemeClass(
                        'border-blue-300/30 bg-white/20 text-gray-900 focus:ring-blue-400',
                        'border-purple-300/30 bg-white/10 backdrop-blur-sm text-white focus:ring-purple-400'
                      )
                    )}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <Card
              className={cn(
                'mb-6 backdrop-blur-sm border shadow-xl',
                getThemeClass(
                  'bg-white/90 border-blue-200/50',
                  'bg-white/10 backdrop-blur-sm border-purple-400/30'
                )
              )}
            >
              <CardContent className="p-6">
                <h3
                  className={cn(
                    'text-lg font-semibold mb-4',
                    getThemeClass('text-blue-700', 'text-purple-200')
                  )}
                >
                  Bộ lọc nâng cao
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      className={cn(
                        'block text-sm font-medium mb-2',
                        getThemeClass('text-blue-700', 'text-purple-200')
                      )}
                    >
                      Nhóm dữ liệu theo
                    </label>
                    <select
                      value={groupBy}
                      onChange={(e) => setGroupBy(Number(e.target.value))}
                      className={cn(
                        'w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2',
                        getThemeClass(
                          'border-blue-300/30 bg-white/20 text-gray-900 focus:ring-blue-400',
                          'border-purple-300/30 bg-white/10 backdrop-blur-sm text-white focus:ring-purple-400'
                        )
                      )}
                    >
                      {groupByOptions.map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                          className={cn(getThemeClass('bg-white text-gray-900', 'bg-gray-800'))}
                        >
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
          <div
            className={cn(
              'mb-6 p-4 rounded-lg backdrop-blur-sm border',
              getThemeClass(
                'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-300/30',
                'bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border-purple-300/30'
              )
            )}
          >
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar
                  size={16}
                  className={cn(getThemeClass('text-blue-600', 'text-purple-300'))}
                />
                <span className={cn(getThemeClass('text-blue-700', 'text-purple-200'))}>
                  Thời gian:
                </span>
                <span className={cn('font-semibold', getThemeClass('text-gray-900', 'text-white'))}>
                  {getCurrentPeriodLabel()}
                </span>
                {selectedPeriod === TimePeriod.Custom && customStartDate && customEndDate && (
                  <span
                    className={cn('text-sm', getThemeClass('text-blue-600', 'text-purple-200'))}
                  >
                    ({new Date(customStartDate).toLocaleDateString('vi-VN')} -{' '}
                    {new Date(customEndDate).toLocaleDateString('vi-VN')})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp
                  size={16}
                  className={cn(getThemeClass('text-cyan-600', 'text-blue-300'))}
                />
                <span className={cn(getThemeClass('text-cyan-700', 'text-blue-200'))}>Nhóm:</span>
                <span className={cn('font-semibold', getThemeClass('text-gray-900', 'text-white'))}>
                  {groupByOptions.find((opt) => opt.value === groupBy)?.label}
                </span>
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
                className={cn(
                  'px-4 py-2 rounded-lg font-medium transition-all',
                  getThemeClass(
                    activeTab === 'revenue'
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                      : 'bg-white/80 backdrop-blur-sm border border-gray-300 text-gray-700 hover:bg-white/90 hover:text-gray-800 shadow-md',
                    activeTab === 'revenue'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 hover:bg-white/20 hover:text-white'
                  )
                )}
              >
                Doanh thu
              </button>
              <button
                onClick={() => setActiveTab('tickets')}
                className={cn(
                  'px-4 py-2 rounded-lg font-medium transition-all',
                  getThemeClass(
                    activeTab === 'tickets'
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                      : 'bg-white/80 backdrop-blur-sm border border-gray-300 text-gray-700 hover:bg-white/90 hover:text-gray-800 shadow-md',
                    activeTab === 'tickets'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 hover:bg-white/20 hover:text-white'
                  )
                )}
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
                Period: selectedPeriod,
              }}
            />
          )}
          {activeTab === 'tickets' && (
            <TicketStatsSection
              filter={{
                CustomStartDate: customStartDate,
                CustomEndDate: customEndDate,
                GroupBy: groupBy,
                Period: selectedPeriod,
              }}
            />
          )}
        </div>
      </div>
    </NotificationProvider>
  );
}
