import { useState, useEffect } from 'react';
import { Bell, Filter, Download, TrendingUp, Calendar, Users, DollarSign, Ticket } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getEventManagerDashboard } from '@/services/Event Manager/event.service';
import { connectAnalyticsHub, onAnalytics } from '@/services/signalr.service';
import { useTranslation } from 'react-i18next';
import { NotificationDropdown } from '@/components/common/NotificationDropdown';
import ExportButtons from './components/ExportButtons';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import RevenueChartSection from './components/RevenueChartSection';
import PerformanceCompareChart from './components/PerformanceCompareChart';

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

interface DashboardStats {
  totalEvents: number;
  totalRevenue: number;
  totalTicketsSold: number;
  totalAttendees: number;
}

const defaultStats: DashboardStats = {
  totalEvents: 0,
  totalRevenue: 0,
  totalTicketsSold: 0,
  totalAttendees: 0
};

export default function EventManagerDashboard() {
  const { t } = useTranslation();
  const [notifDropdown, setNotifDropdown] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(TimePeriod.Last30Days);
  const [groupBy, setGroupBy] = useState(GroupBy.Day);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [comparisonStats, setComparisonStats] = useState<DashboardStats | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [includeComparison, setIncludeComparison] = useState(false);
  const [comparisonPeriod, setComparisonPeriod] = useState<number | null>(null);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

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

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {
        period: selectedPeriod,
        groupBy: groupBy,
        includeRealtimeData: true,
      };

      if (selectedPeriod === TimePeriod.Custom) {
        if (!customStartDate || !customEndDate) {
          throw new Error('Vui lòng chọn khoảng thời gian tùy chỉnh');
        }
        params.customStartDate = customStartDate;
        params.customEndDate = customEndDate;
      }

      if (includeComparison) {
        params.includeComparison = true;
        if (comparisonPeriod) {
          params.comparisonPeriod = comparisonPeriod;
        } else {
          // Auto calculate comparison period
          if (selectedPeriod === TimePeriod.ThisWeek) params.comparisonPeriod = TimePeriod.LastWeek;
          else if (selectedPeriod === TimePeriod.ThisMonth) params.comparisonPeriod = TimePeriod.LastMonth;
          else if (selectedPeriod === TimePeriod.ThisQuarter) params.comparisonPeriod = TimePeriod.LastQuarter;
          else if (selectedPeriod === TimePeriod.ThisYear) params.comparisonPeriod = TimePeriod.LastYear;
          else if (selectedPeriod === TimePeriod.Last7Days) params.comparisonPeriod = TimePeriod.Last14Days;
          else if (selectedPeriod === TimePeriod.Last30Days) params.comparisonPeriod = TimePeriod.Last60Days;
          else if (selectedPeriod === TimePeriod.Last90Days) params.comparisonPeriod = TimePeriod.Last180Days;
        }
      }

      const eventManagerID = accountObj?.userId || accountObj?.accountId;
      if (eventManagerID) params.eventManagerId = eventManagerID;

      const dash = await getEventManagerDashboard(params);
      const overview = dash.data?.overview || dash.overview || {};
      
      setStats({
        totalEvents: overview.totalEvents || 0,
        totalRevenue: overview.totalRevenue || 0,
        totalTicketsSold: overview.totalTicketsSold || 0,
        totalAttendees: overview.totalAttendees || 0,
      });

      if (includeComparison && dash.comparison) {
        const comparisonOverview = dash.comparison.overview || {};
        setComparisonStats({
          totalEvents: comparisonOverview.totalEvents || 0,
          totalRevenue: comparisonOverview.totalRevenue || 0,
          totalTicketsSold: comparisonOverview.totalTicketsSold || 0,
          totalAttendees: comparisonOverview.totalAttendees || 0,
        });
      } else {
        setComparisonStats(null);
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setStats(defaultStats);
      setComparisonStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedPeriod, groupBy, includeComparison, comparisonPeriod, customStartDate, customEndDate]);

  useEffect(() => {
    connectAnalyticsHub();
    
    onAnalytics('OnEventManagerDashboard', (data: any) => {
      const overview = data.overview || {};
      setStats({
        totalEvents: overview.totalEvents || 0,
        totalRevenue: overview.totalRevenue || 0,
        totalTicketsSold: overview.totalTicketsSold || 0,
        totalAttendees: overview.totalAttendees || 0,
      });
    });

    return () => {
      // Clean up SignalR connections if needed
    };
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handlePeriodChange = (periodId: number) => {
    setSelectedPeriod(periodId);
    if (periodId !== TimePeriod.Custom) {
      setCustomStartDate('');
      setCustomEndDate('');
    }
  };

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const formatPercentage = (percentage: number) => {
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(1)}%`;
  };

  const getPercentageColor = (percentage: number) => {
    return percentage >= 0 ? 'text-green-400' : 'text-red-400';
  };

  const getCurrentPeriodLabel = () => {
    const tab = periodTabs.find(tab => tab.id === selectedPeriod);
    return tab?.label || 'Tùy chỉnh';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Dashboard
            </h1>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
              <TrendingUp size={16} className="text-green-400" />
              <span className="text-sm text-green-300">Đang phát triển</span>
            </div>
          </div>
          
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
              [1, 3, 5, 12, 13, 9, 16].includes(tab.id) // Show only common periods
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                <div className="flex items-center">
                  <label className="flex items-center gap-3 text-purple-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeComparison}
                      onChange={(e) => setIncludeComparison(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded border-purple-300/30 focus:ring-purple-400 focus:ring-2"
                    />
                    <span>So sánh với kỳ trước</span>
                  </label>
                </div>

                {includeComparison && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-purple-200">Kỳ so sánh</label>
                    <select
                      value={comparisonPeriod || ''}
                      onChange={(e) => setComparisonPeriod(e.target.value ? Number(e.target.value) : null)}
                      className="w-full px-3 py-2 rounded-lg border border-purple-300/30 bg-white/10 backdrop-blur-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                      <option value="">Tự động</option>
                      {periodTabs
                        .filter(tab => tab.id !== selectedPeriod && tab.id !== TimePeriod.Custom)
                        .map(option => (
                          <option key={option.id} value={option.id} className="bg-gray-800">
                            {option.label}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
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
            {includeComparison && (
              <div className="flex items-center gap-2 text-green-300">
                <span>✓</span>
                <span>So sánh với:</span>
                <span className="font-semibold text-white">
                  {comparisonPeriod 
                    ? periodTabs.find(tab => tab.id === comparisonPeriod)?.label 
                    : 'Kỳ trước (tự động)'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="bg-white/10 backdrop-blur-sm border-white/20 animate-pulse">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-400/30 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-400/30 rounded mb-3"></div>
                    <div className="h-8 bg-gray-400/30 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <Card className="bg-white/10 backdrop-blur-sm border-purple-400/30 hover:bg-white/15 transition-all group">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-full bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
                  <Calendar className="text-purple-400" size={24} />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-purple-300 mb-1">Tổng sự kiện</div>
                  <div className="text-3xl font-bold text-purple-400">{stats.totalEvents}</div>
                  {includeComparison && comparisonStats && (
                    <div className={`text-sm mt-1 ${getPercentageColor(calculatePercentageChange(stats.totalEvents, comparisonStats.totalEvents))}`}>
                      {formatPercentage(calculatePercentageChange(stats.totalEvents, comparisonStats.totalEvents))} so với kỳ trước
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-green-400/30 hover:bg-white/15 transition-all group">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
                  <DollarSign className="text-green-400" size={24} />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-green-300 mb-1">Tổng doanh thu</div>
                  <div className="text-3xl font-bold text-green-400">{formatCurrency(stats.totalRevenue)}</div>
                  {includeComparison && comparisonStats && (
                    <div className={`text-sm mt-1 ${getPercentageColor(calculatePercentageChange(stats.totalRevenue, comparisonStats.totalRevenue))}`}>
                      {formatPercentage(calculatePercentageChange(stats.totalRevenue, comparisonStats.totalRevenue))} so với kỳ trước
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-blue-400/30 hover:bg-white/15 transition-all group">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                  <Ticket className="text-blue-400" size={24} />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-blue-300 mb-1">Vé đã bán</div>
                  <div className="text-3xl font-bold text-blue-400">{stats.totalTicketsSold.toLocaleString()}</div>
                  {includeComparison && comparisonStats && (
                    <div className={`text-sm mt-1 ${getPercentageColor(calculatePercentageChange(stats.totalTicketsSold, comparisonStats.totalTicketsSold))}`}>
                      {formatPercentage(calculatePercentageChange(stats.totalTicketsSold, comparisonStats.totalTicketsSold))} so với kỳ trước
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-yellow-400/30 hover:bg-white/15 transition-all group">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-full bg-yellow-500/20 group-hover:bg-yellow-500/30 transition-colors">
                  <Users className="text-yellow-400" size={24} />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-yellow-300 mb-1">Tổng người tham gia</div>
                  <div className="text-3xl font-bold text-yellow-400">{stats.totalAttendees.toLocaleString()}</div>
                  {includeComparison && comparisonStats && (
                    <div className={`text-sm mt-1 ${getPercentageColor(calculatePercentageChange(stats.totalAttendees, comparisonStats.totalAttendees))}`}>
                      {formatPercentage(calculatePercentageChange(stats.totalAttendees, comparisonStats.totalAttendees))} so với kỳ trước
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Revenue Charts Section */}
        <RevenueChartSection 
          filter={{
            CustomStartDate: customStartDate,
            CustomEndDate: customEndDate,
            GroupBy: groupBy,
            Period: selectedPeriod
          }}
        />

        {/* Performance Comparison Chart */}
        {includeComparison && (
          <PerformanceCompareChart 
            filter={{
              CustomStartDate: customStartDate,
              CustomEndDate: customEndDate,
              GroupBy: groupBy,
              Period: selectedPeriod,
              ComparisonPeriod: comparisonPeriod || undefined
            }}
          />
        )}
      </div>
    </div>
  );
}