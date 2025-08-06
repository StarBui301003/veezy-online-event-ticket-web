import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Ticket, Users, DollarSign, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getEventManagerDashboard, comparePerformance } from '@/services/Event Manager/event.service';

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
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const percentage = ((current - previous) / previous) * 100;
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(1)}%`;
  };

  // Shared function for fetching dashboard data
  const fetchDashboardData = async () => {
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
        const comparisonPeriod = filter.comparisonPeriod || getDefaultComparisonPeriod(filter.period);
        const compareResponse = await comparePerformance(filter.period, comparisonPeriod);
        const points = compareResponse.data?.points || compareResponse.points || [];
        
        const totalRevenueCurrent = points.reduce((sum: number, p: any) => sum + (p.currentRevenue || p.current || 0), 0);
        const totalRevenuePrevious = points.reduce((sum: number, p: any) => sum + (p.previousRevenue || p.previous || 0), 0);
        const ticketsSoldCurrent = points.reduce((sum: number, p: any) => sum + (p.currentTicketsSold || 0), 0);
        const ticketsSoldPrevious = points.reduce((sum: number, p: any) => sum + (p.previousTicketsSold || 0), 0);

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
  };

  useEffect(() => {
    fetchDashboardData();
  }, [filter]);

  // Add realtime update listeners
  useEffect(() => {
    const handleDashboardUpdate = (event: CustomEvent) => {
      console.log('Dashboard data update received:', event.detail);
      // Refresh dashboard data when realtime update received
      fetchDashboardData();
    };

    const handleRevenueUpdate = (event: CustomEvent) => {
      console.log('Revenue update received:', event.detail);
      // Update revenue data in dashboard
      setDashboardData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          financial: {
            ...prev.financial,
            overviewFilter: {
              ...prev.financial.overviewFilter,
              totalRevenue: event.detail.totalRevenue || prev.financial.overviewFilter.totalRevenue
            }
          }
        };
      });
    };

    const handleTicketSalesUpdate = (event: CustomEvent) => {
      console.log('Ticket sales update received:', event.detail);
      // Update ticket sales data
      setDashboardData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          overview: {
            ...prev.overview,
            totalTicketsSold: event.detail.totalTicketsSold || prev.overview.totalTicketsSold
          },
          financial: {
            ...prev.financial,
            overviewFilter: {
              ...prev.financial.overviewFilter,
              ticketsSold: event.detail.ticketsSold || prev.financial.overviewFilter.ticketsSold
            }
          }
        };
      });
    };

    const handleOrderUpdate = (event: CustomEvent) => {
      console.log('Order update received:', event.detail);
      // Refresh data when new orders come in
      fetchDashboardData();
    };

    // Add event listeners
    window.addEventListener('dashboardDataUpdate', handleDashboardUpdate as EventListener);
    window.addEventListener('revenueDataUpdate', handleRevenueUpdate as EventListener);
    window.addEventListener('ticketSalesUpdate', handleTicketSalesUpdate as EventListener);
    window.addEventListener('orderUpdate', handleOrderUpdate as EventListener);
    window.addEventListener('orderStatusUpdate', handleOrderUpdate as EventListener);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('dashboardDataUpdate', handleDashboardUpdate as EventListener);
      window.removeEventListener('revenueDataUpdate', handleRevenueUpdate as EventListener);
      window.removeEventListener('ticketSalesUpdate', handleTicketSalesUpdate as EventListener);
      window.removeEventListener('orderUpdate', handleOrderUpdate as EventListener);
      window.removeEventListener('orderStatusUpdate', handleOrderUpdate as EventListener);
    };
  }, []);

  const getDefaultComparisonPeriod = (currentPeriod: number): number => {
    const comparisonMap: Record<number, number> = {
      1: 2,   // Today -> Yesterday
      2: 1,   // Yesterday -> Today
      3: 4,   // This Week -> Last Week
      4: 3,   // Last Week -> This Week
      5: 6,   // This Month -> Last Month
      6: 5,   // Last Month -> This Month
      7: 8,   // This Quarter -> Last Quarter
      8: 7,   // Last Quarter -> This Quarter
      9: 10,  // This Year -> Last Year
      10: 9,  // Last Year -> This Year
      11: 11, // Last 7 Days -> Last 7 Days
      12: 12, // Last 30 Days -> Last 30 Days
      13: 13, // Last 90 Days -> Last 90 Days
      14: 14, // Last 365 Days -> Last 365 Days
      15: 15, // All Time -> All Time
      16: 16, // Custom -> Custom
    };
    return comparisonMap[currentPeriod] || currentPeriod;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl p-4 border border-purple-400/30 animate-pulse">
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
      <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-400/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={20} className="text-blue-400" />
            <span className="text-sm text-blue-300">{t('totalRevenue')}</span>
          </div>
          <div className="text-xl font-bold text-blue-400">{formatCurrency(dashboardData.financial.overviewFilter.totalRevenue)}</div>
          {filter.includeComparison && comparisonData && (
            <div className="text-sm text-blue-200">
              {t('vsPrevious')}: {formatPercentage(comparisonData.totalRevenueCurrent, comparisonData.totalRevenuePrevious)}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-400/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Ticket size={20} className="text-green-400" />
            <span className="text-sm text-green-300">{t('ticketsSold')}</span>
          </div>
          <div className="text-xl font-bold text-green-400">{dashboardData.financial.overviewFilter.ticketsSold.toLocaleString()}</div>
          {filter.includeComparison && comparisonData && (
            <div className="text-sm text-green-200">
              {t('vsPrevious')}: {formatPercentage(comparisonData.ticketsSoldCurrent, comparisonData.ticketsSoldPrevious)}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-400/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={20} className="text-purple-400" />
            <span className="text-sm text-purple-300">{t('activeEvents')}</span>
          </div>
          <div className="text-xl font-bold text-purple-400">{dashboardData.overview.activeEvents}</div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-yellow-400/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={20} className="text-yellow-400" />
            <span className="text-sm text-yellow-300">{t('totalEvents')}</span>
          </div>
          <div className="text-xl font-bold text-yellow-400">{dashboardData.overview.totalEvents}</div>
        </CardContent>
      </Card>
    </div>
  );
}