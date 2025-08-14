/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Ticket, Users, DollarSign, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  getEventManagerDashboard,
  comparePerformance,
} from '@/services/Event Manager/event.service';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';

interface DashboardSummaryCardsProps {
  filter: {
    period: number;
    customStartDate: string;
    customEndDate: string;
    groupBy: number;
    includeComparison: boolean;
    comparisonPeriod: number | null;
    includeRealtimeData: boolean;
  };
}

interface DashboardData {
  overview: {
    totalEvents: number;
    totalTickets: number;
    activeEvents: number;
    totalTicketsSold: number;
    totalRevenue: number;
  };
  financial: {
    overviewFilter: {
      totalRevenue: number;
      ticketsSold: number;
      transactionCount: number;
    };
  };
}

interface ComparisonData {
  totalRevenueCurrent: number;
  totalRevenuePrevious: number;
  ticketsSoldCurrent: number;
  ticketsSoldPrevious: number;
}

export default function DashboardSummaryCards({ filter }: DashboardSummaryCardsProps) {
  const { t } = useTranslation();
  const { getThemeClass } = useThemeClasses();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);

  // Track previous filter values to prevent unnecessary API calls
  const prevFilterRef = useRef({
    period: filter.period,
    customStartDate: filter.customStartDate,
    customEndDate: filter.customEndDate,
    groupBy: filter.groupBy,
    includeComparison: filter.includeComparison,
    comparisonPeriod: filter.comparisonPeriod,
    includeRealtimeData: filter.includeRealtimeData,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const percentage = ((current - previous) / previous) * 100;
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(1)}%`;
  };

  const getDefaultComparisonPeriod = (currentPeriod: number): number => {
    const comparisonMap: Record<number, number> = {
      1: 2, // Today -> Yesterday
      2: 1, // Yesterday -> Today
      3: 4, // This Week -> Last Week
      4: 3, // Last Week -> This Week
      5: 6, // This Month -> Last Month
      6: 5, // Last Month -> This Month
      7: 8, // This Quarter -> Last Quarter
      8: 7, // Last Quarter -> This Quarter
      9: 10, // This Year -> Last Year
      10: 9, // Last Year -> This Year
      11: 11, // Last 7 Days -> Last 7 Days
      12: 12, // Last 30 Days -> Last 30 Days
      13: 13, // Last 90 Days -> Last 90 Days
      14: 14, // Last 365 Days -> Last 365 Days
      15: 15, // All Time -> All Time
      16: 16, // Custom -> Custom
    };
    return comparisonMap[currentPeriod] || currentPeriod;
  };

  // Stable function that only runs when filters actually change
  const fetchDashboardData = useCallback(async () => {
    const currentFilter = {
      period: filter.period,
      customStartDate: filter.customStartDate,
      customEndDate: filter.customEndDate,
      groupBy: filter.groupBy,
      includeComparison: filter.includeComparison,
      comparisonPeriod: filter.comparisonPeriod,
      includeRealtimeData: filter.includeRealtimeData,
    };

    // Check if filters have actually changed
    const hasFilterChanged = Object.keys(currentFilter).some(
      (key) => prevFilterRef.current[key as keyof typeof currentFilter] !== currentFilter[key as keyof typeof currentFilter]
    );

    // Skip fetch if filters haven't changed and we already have data
    if (!hasFilterChanged && dashboardData) {
      console.log('Skipping dashboard API call - filters unchanged');
      return;
    }

    // Update previous filter values
    prevFilterRef.current = { ...currentFilter };

    console.log('Fetching dashboard data with filters:', currentFilter);
    setLoading(true);
    
    try {
      const params: any = {
        Period: filter.period,
        GroupBy: filter.groupBy,
        CustomStartDate: filter.customStartDate || undefined,
        CustomEndDate: filter.customEndDate || undefined,
        IncludeRealtimeData: filter.includeRealtimeData,
      };

      if (filter.includeComparison && filter.comparisonPeriod) {
        params.IncludeComparison = true;
        params.ComparisonPeriod = filter.comparisonPeriod;
      }

      const response = await getEventManagerDashboard(params);
      setDashboardData(response.data || response);

      if (filter.includeComparison) {
        const comparisonPeriod =
          filter.comparisonPeriod || getDefaultComparisonPeriod(filter.period);
        const compareResponse = await comparePerformance(filter.period, comparisonPeriod);
        const points = compareResponse.data?.points || compareResponse.points || [];

        const totalRevenueCurrent = points.reduce(
          (sum: number, p: any) => sum + (p.currentRevenue || p.current || 0),
          0
        );
        const totalRevenuePrevious = points.reduce(
          (sum: number, p: any) => sum + (p.previousRevenue || p.previous || 0),
          0
        );
        const ticketsSoldCurrent = points.reduce(
          (sum: number, p: any) => sum + (p.currentTicketsSold || 0),
          0
        );
        const ticketsSoldPrevious = points.reduce(
          (sum: number, p: any) => sum + (p.previousTicketsSold || 0),
          0
        );

        setComparisonData({
          totalRevenueCurrent,
          totalRevenuePrevious,
          ticketsSoldCurrent,
          ticketsSoldPrevious,
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDashboardData(null);
      setComparisonData(null);
    } finally {
      setLoading(false);
    }
  }, [
    filter.period,
    filter.customStartDate,
    filter.customEndDate,
    filter.groupBy,
    filter.includeComparison,
    filter.comparisonPeriod,
    filter.includeRealtimeData,
    dashboardData // Add dashboardData as dependency to check if we already have data
  ]);

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Add realtime update listeners - but throttle them to prevent too many calls
  useEffect(() => {
    let updateTimeout: NodeJS.Timeout;

    const throttledRefresh = () => {
      if (updateTimeout) clearTimeout(updateTimeout);
      updateTimeout = setTimeout(() => {
        console.log('Refreshing dashboard due to realtime update');
        fetchDashboardData();
      }, 2000); // Throttle updates to max once every 2 seconds
    };

    const handleDashboardUpdate = (event: CustomEvent) => {
      console.log('Dashboard data update received:', event.detail);
      throttledRefresh();
    };

    const handleRevenueUpdate = (event: CustomEvent) => {
      console.log('Revenue update received:', event.detail);
      // Update revenue data in dashboard without full refresh
      setDashboardData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          financial: {
            ...prev.financial,
            overviewFilter: {
              ...prev.financial.overviewFilter,
              totalRevenue: event.detail.totalRevenue || prev.financial.overviewFilter.totalRevenue,
            },
          },
        };
      });
    };

    const handleTicketSalesUpdate = (event: CustomEvent) => {
      console.log('Ticket sales update received:', event.detail);
      // Update ticket sales data without full refresh
      setDashboardData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          overview: {
            ...prev.overview,
            totalTicketsSold: event.detail.totalTicketsSold || prev.overview.totalTicketsSold,
          },
          financial: {
            ...prev.financial,
            overviewFilter: {
              ...prev.financial.overviewFilter,
              ticketsSold: event.detail.ticketsSold || prev.financial.overviewFilter.ticketsSold,
            },
          },
        };
      });
    };

    const handleOrderUpdate = (event: CustomEvent) => {
      console.log('Order update received:', event.detail);
      throttledRefresh();
    };

    // Add event listeners
    window.addEventListener('dashboardDataUpdate', handleDashboardUpdate as EventListener);
    window.addEventListener('revenueDataUpdate', handleRevenueUpdate as EventListener);
    window.addEventListener('ticketSalesUpdate', handleTicketSalesUpdate as EventListener);
    window.addEventListener('orderUpdate', handleOrderUpdate as EventListener);
    window.addEventListener('orderStatusUpdate', handleOrderUpdate as EventListener);

    // Cleanup event listeners and timeout
    return () => {
      if (updateTimeout) clearTimeout(updateTimeout);
      window.removeEventListener('dashboardDataUpdate', handleDashboardUpdate as EventListener);
      window.removeEventListener('revenueDataUpdate', handleRevenueUpdate as EventListener);
      window.removeEventListener('ticketSalesUpdate', handleTicketSalesUpdate as EventListener);
      window.removeEventListener('orderUpdate', handleOrderUpdate as EventListener);
      window.removeEventListener('orderStatusUpdate', handleOrderUpdate as EventListener);
    };
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl p-4 border border-purple-400/30 animate-pulse"
          >
            <div className="h-4 bg-purple-400/20 rounded mb-2"></div>
            <div className="h-6 bg-purple-400/20 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12 bg-gradient-to-br from-gray-500/20 to-gray-600/20 rounded-2xl border-2 border-gray-400/30">
        <h3 className="text-xl font-semibold text-gray-300 mb-2">{t('noData')}</h3>
        <p className="text-gray-400">{t('noDataDescription')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card
        className={cn(
          'bg-gradient-to-br border shadow-lg',
          getThemeClass(
            'from-blue-500/20 to-blue-600/20 border-blue-400/30',
            'from-blue-500/20 to-blue-600/20 border-blue-400/30'
          )
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={20} className="text-blue-400" />
            <span className={cn('text-sm', getThemeClass('text-blue-700', 'text-blue-300'))}>
              {t('totalRevenue')}
            </span>
          </div>
          <div className={cn('text-xl font-bold', getThemeClass('text-blue-800', 'text-blue-400'))}>
            {formatCurrency(dashboardData.financial.overviewFilter.totalRevenue)}
          </div>
          {filter.includeComparison && comparisonData && (
            <div className={cn('text-sm', getThemeClass('text-blue-600', 'text-blue-200'))}>
              {t('vsPrevious')}:{' '}
              {formatPercentage(
                comparisonData.totalRevenueCurrent,
                comparisonData.totalRevenuePrevious
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card
        className={cn(
          'bg-gradient-to-br border shadow-lg',
          getThemeClass(
            'from-green-500/20 to-green-600/20 border-green-400/30',
            'from-green-500/20 to-green-600/20 border-green-400/30'
          )
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Ticket size={20} className="text-green-400" />
            <span className={cn('text-sm', getThemeClass('text-green-700', 'text-green-300'))}>
              {t('ticketsSold')}
            </span>
          </div>
          <div
            className={cn('text-xl font-bold', getThemeClass('text-green-800', 'text-green-400'))}
          >
            {dashboardData.financial.overviewFilter.ticketsSold.toLocaleString()}
          </div>
          {filter.includeComparison && comparisonData && (
            <div className={cn('text-sm', getThemeClass('text-green-600', 'text-green-200'))}>
              {t('vsPrevious')}:{' '}
              {formatPercentage(
                comparisonData.ticketsSoldCurrent,
                comparisonData.ticketsSoldPrevious
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card
        className={cn(
          'bg-gradient-to-br border shadow-lg',
          getThemeClass(
            'from-purple-500/20 to-purple-600/20 border-purple-400/30',
            'from-purple-500/20 to-purple-600/20 border-purple-400/30'
          )
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={20} className="text-purple-400" />
            <span className={cn('text-sm', getThemeClass('text-purple-700', 'text-purple-300'))}>
              activeEvents
            </span>
          </div>
          <div
            className={cn('text-xl font-bold', getThemeClass('text-purple-800', 'text-purple-400'))}
          >
            {dashboardData.overview.activeEvents}
          </div>
        </CardContent>
      </Card>

      <Card
        className={cn(
          'bg-gradient-to-br border shadow-lg',
          getThemeClass(
            'from-yellow-500/20 to-yellow-600/20 border-yellow-400/30',
            'from-yellow-500/20 to-yellow-600/20 border-yellow-400/30'
          )
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={20} className="text-yellow-400" />
            <span className={cn('text-sm', getThemeClass('text-yellow-700', 'text-yellow-300'))}>
              {t('totalEvents')}
            </span>
          </div>
          <div
            className={cn('text-xl font-bold', getThemeClass('text-yellow-800', 'text-yellow-400'))}
          >
            {dashboardData.overview.totalEvents}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}