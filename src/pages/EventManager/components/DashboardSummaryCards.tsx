import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Ticket, Users, Calendar } from 'lucide-react';
import { getEventManagerDashboard } from '@/services/Event Manager/event.service';
import { useTranslation } from 'react-i18next';

interface DashboardStats {
  totalEvents: number;
  totalRevenue: number;
  totalTicketsSold: number;
  totalAttendees: number;
}

interface DashboardSummaryCardsProps {
  filter: {
    period?: number;
    customStartDate?: string;
    customEndDate?: string;
    groupBy?: number;
    includeComparison?: boolean;
    comparisonPeriod?: number;
    includeRealtimeData?: boolean;
  };
}

export default function DashboardSummaryCards({ filter }: DashboardSummaryCardsProps) {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [comparisonStats, setComparisonStats] = useState<DashboardStats | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const accountStr = typeof window !== 'undefined' ? localStorage.getItem('account') : null;
      const accountObj = accountStr ? JSON.parse(accountStr) : null;
      const eventManagerID = accountObj?.userId || accountObj?.accountId;
      
      const params: any = {
        period: filter.period || 12, // Default to Last30Days
        groupBy: filter.groupBy || 1, // Default to Day
        includeRealtimeData: filter.includeRealtimeData !== false, // Default to true
      };

      // Add custom dates if period is Custom (16)
      if (filter.period === 16) {
        if (filter.customStartDate) params.customStartDate = filter.customStartDate;
        if (filter.customEndDate) params.customEndDate = filter.customEndDate;
      }

      // Add comparison if requested
      if (filter.includeComparison) {
        params.includeComparison = true;
        if (filter.comparisonPeriod) {
          params.comparisonPeriod = filter.comparisonPeriod;
        }
      }

      // Add event manager ID if available
      if (eventManagerID) {
        params.eventManagerId = eventManagerID;
      }

      const dash = await getEventManagerDashboard(params);
      const overview = dash.data?.overview || dash.overview || {};
      
      setStats({
        totalEvents: overview.totalEvents || 0,
        totalRevenue: overview.totalRevenue || 0,
        totalTicketsSold: overview.totalTicketsSold || 0,
        totalAttendees: overview.totalAttendees || 0,
      });

      // Handle comparison data if available
      if (filter.includeComparison && dash.comparison) {
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
      setStats({ totalEvents: 0, totalRevenue: 0, totalTicketsSold: 0, totalAttendees: 0 });
      setComparisonStats(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [
    filter.period,
    filter.customStartDate,
    filter.customEndDate,
    filter.groupBy,
    filter.includeComparison,
    filter.comparisonPeriod,
    filter.includeRealtimeData
  ]);

  // Listen for real-time updates
  useEffect(() => {
    const handleAnalyticsUpdate = (event: CustomEvent) => {
      const data = event.detail;
      if (data.overview) {
        setStats({
          totalEvents: data.overview.totalEvents || 0,
          totalRevenue: data.overview.totalRevenue || 0,
          totalTicketsSold: data.overview.totalTicketsSold || 0,
          totalAttendees: data.overview.totalAttendees || 0,
        });
      }
    };

    const handleOverviewUpdate = (event: CustomEvent) => {
      const data = event.detail;
      setStats({
        totalEvents: data.totalEvents || 0,
        totalRevenue: data.totalRevenue || 0,
        totalTicketsSold: data.totalTicketsSold || 0,
        totalAttendees: data.totalAttendees || 0,
      });
    };

    window.addEventListener('analytics-updated', handleAnalyticsUpdate as EventListener);
    window.addEventListener('analytics-overview-updated', handleOverviewUpdate as EventListener);

    return () => {
      window.removeEventListener('analytics-updated', handleAnalyticsUpdate as EventListener);
      window.removeEventListener('analytics-overview-updated', handleOverviewUpdate as EventListener);
    };
  }, []);

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

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-white/10 backdrop-blur-sm border-white/20 animate-pulse">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-400/30 rounded"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-400/30 rounded mb-2"></div>
                <div className="h-8 bg-gray-400/30 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: t('totalEvents') || 'Tổng sự kiện',
      value: stats.totalEvents,
      icon: Calendar,
      color: 'purple',
      comparisonValue: comparisonStats?.totalEvents
    },
    {
      title: t('totalRevenue') || 'Tổng doanh thu',
      value: (typeof stats.totalRevenue === 'number' ? stats.totalRevenue : 0).toLocaleString('vi-VN') + '₫',
      icon: DollarSign,
      color: 'green',
      rawValue: stats.totalRevenue,
      comparisonValue: comparisonStats?.totalRevenue
    },
    {
      title: t('totalTicketsSold') || 'Vé đã bán',
      value: stats.totalTicketsSold.toLocaleString(),
      icon: Ticket,
      color: 'blue',
      rawValue: stats.totalTicketsSold,
      comparisonValue: comparisonStats?.totalTicketsSold
    },
    {
      title: t('totalAttendees') || 'Tổng người tham gia',
      value: stats.totalAttendees.toLocaleString(),
      icon: Users,
      color: 'yellow',
      rawValue: stats.totalAttendees,
      comparisonValue: comparisonStats?.totalAttendees
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const colorClasses = {
          purple: 'text-purple-400 border-purple-400/30',
          green: 'text-green-400 border-green-400/30',
          blue: 'text-blue-400 border-blue-400/30',
          yellow: 'text-yellow-400 border-yellow-400/30'
        };

        const textColorClasses = {
          purple: 'text-purple-300',
          green: 'text-green-300',
          blue: 'text-blue-300',
          yellow: 'text-yellow-300'
        };

        let percentageChange = null;
        if (filter.includeComparison && card.comparisonValue !== undefined) {
          const currentValue = card.rawValue || card.value;
          const previousValue = card.comparisonValue;
          if (typeof currentValue === 'number' && typeof previousValue === 'number') {
            percentageChange = calculatePercentageChange(currentValue, previousValue);
          }
        }

        return (
          <Card 
            key={index} 
            className={`bg-white/10 backdrop-blur-sm ${colorClasses[card.color as keyof typeof colorClasses]} hover:bg-white/15 transition-all`}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <Icon className={colorClasses[card.color as keyof typeof colorClasses].split(' ')[0]} size={40} />
              <div className="flex-1">
                <div className={`text-sm ${textColorClasses[card.color as keyof typeof textColorClasses]}`}>
                  {card.title}
                </div>
                <div className={`text-3xl font-bold ${colorClasses[card.color as keyof typeof colorClasses].split(' ')[0]}`}>
                  {card.value}
                </div>
                {percentageChange !== null && (
                  <div className={`text-sm mt-1 ${getPercentageColor(percentageChange)}`}>
                    {formatPercentage(percentageChange)} so với kỳ trước
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}