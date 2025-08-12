import { useEffect, useState } from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement,
  Filler,
} from 'chart.js';
import { getEventManagerRevenue } from '@/services/Event Manager/event.service';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';

Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement,
  Filler
);

interface RevenueFilterProps {
  CustomStartDate: string;
  CustomEndDate: string;
  GroupBy: number;
  Period: number;
}

interface EventData {
  eventName: string;
  revenue: number;
}

interface TimelineData {
  periodLabel?: string;
  period?: string;
  revenue?: number;
  transactionCount?: number;
}

import type { TooltipItem } from 'chart.js';

export default function RevenueChartSection({ filter }: { filter: RevenueFilterProps }) {
  const { t } = useTranslation();
  const { getThemeClass } = useThemeClasses();
  const [events, setEvents] = useState<EventData[]>([]);
  const [timeline, setTimeline] = useState<TimelineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'bar' | 'line' | 'doughnut'>('bar');
  const [showTop, setShowTop] = useState(10);

  const fetchData = async () => {
    setLoading(true);
    try {
      const dash = await getEventManagerRevenue({
        CustomStartDate: filter.CustomStartDate,
        CustomEndDate: filter.CustomEndDate,
        GroupBy: filter.GroupBy,
        Period: filter.Period,
      });

      const revenueByEvent = dash.data?.revenueByEvent || dash.revenueByEvent || [];
      const revenueTrend = dash.data?.revenueTrend || dash.revenueTrend || [];

      const sortedEvents = revenueByEvent
        .map((e: EventData) => ({ eventName: e.eventName, revenue: e.revenue }))
        .sort((a: EventData, b: EventData) => b.revenue - a.revenue);

      setEvents(sortedEvents);
      setTimeline(revenueTrend);
    } catch (error: unknown) {
      console.error('Error fetching revenue data:', error);
      setEvents([]);
      setTimeline([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [filter.CustomStartDate, filter.CustomEndDate, filter.GroupBy, filter.Period]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getGroupByLabel = () => {
    const labels = {
      0: 'hour',
      1: 'day',
      2: 'week',
      3: 'month',
      4: 'quarter',
      5: 'year',
    };
    return labels[filter.GroupBy as keyof typeof labels] || 'time';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div
          className={cn(
            'bg-gradient-to-br rounded-2xl p-6 border-2 shadow-2xl',
            getThemeClass(
              'from-indigo-400/30 to-red-200/30 border-indigo-400/30',
              'from-indigo-400/30 to-red-200/30 border-indigo-400/30'
            )
          )}
        >
          <div className="animate-pulse">
            <div className="h-6 bg-blue-400/20 rounded mb-4 w-1/3"></div>
            <div className="h-64 bg-blue-400/10 rounded"></div>
          </div>
        </div>
        <div
          className={cn(
            'bg-gradient-to-br rounded-2xl p-6 border-2 shadow-2xl',
            getThemeClass(
              'from-yellow-400/30 to-blue-200/30 border-yellow-400/30',
              'from-yellow-400/30 to-blue-200/30 border-yellow-400/30'
            )
          )}
        >
          <div className="animate-pulse">
            <div className="h-6 bg-yellow-400/20 rounded mb-4 w-1/3"></div>
            <div className="h-64 bg-yellow-400/10 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (events.length === 0 && timeline.length === 0) {
    return (
      <div
        className={cn(
          'text-center py-12 rounded-2xl border-2',
          getThemeClass(
            'bg-gradient-to-br from-gray-500/20 to-gray-600/20 border-gray-400/30',
            'bg-gradient-to-br from-gray-500/20 to-gray-600/20 border-gray-400/30'
          )
        )}
      >
        <BarChart3 size={48} className="mx-auto text-gray-400 mb-4" />
        <h3
          className={cn(
            'text-xl font-semibold mb-2',
            getThemeClass('text-gray-800', 'text-gray-300')
          )}
        >
          No Revenue Data
        </h3>
        <p className={cn(getThemeClass('text-gray-600', 'text-gray-400'))}>
          No revenue data available for the selected time period
        </p>
      </div>
    );
  }

  const topEvents = events.slice(0, showTop);
  const eventData = {
    labels: topEvents.map((e) => {
      const name = e.eventName;
      return name.length > 20 ? name.substring(0, 20) + '...' : name;
    }),
    datasets: [
      {
        label: t('revenue') || 'Doanh thu',
        data: topEvents.map((e) => e.revenue),
        backgroundColor: topEvents.map((_, index) => {
          const colors = [
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 99, 132, 0.8)',
            'rgba(255, 206, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)',
            'rgba(199, 199, 199, 0.8)',
            'rgba(83, 102, 255, 0.8)',
            'rgba(255, 99, 255, 0.8)',
            'rgba(99, 255, 132, 0.8)',
          ];
          return colors[index % colors.length];
        }),
        borderColor: topEvents.map((_, index) => {
          const colors = [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(199, 199, 199, 1)',
            'rgba(83, 102, 255, 1)',
            'rgba(255, 99, 255, 1)',
            'rgba(99, 255, 132, 1)',
          ];
          return colors[index % colors.length];
        }),
        borderWidth: 2,
        borderRadius: viewMode === 'bar' ? 8 : 0,
        borderSkipped: false,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
        labels: {
          color: getThemeClass('#1f2937', '#fff'),
          padding: 20,
        },
      },
      title: {
        display: true,
        text: `${t('revenueByEvent') || 'Revenue by Event'} (Top ${showTop})`,
        color: getThemeClass('#1f2937', '#fff'),
        font: { size: 18, weight: 'bold' as const },
      },
      tooltip: {
        backgroundColor: getThemeClass('rgba(0, 0, 0, 0.9)', 'rgba(0, 0, 0, 0.8)'),
        titleColor: getThemeClass('#fff', '#fff'),
        bodyColor: getThemeClass('#fff', '#fff'),
        borderColor: getThemeClass('rgba(0, 0, 0, 0.3)', 'rgba(255, 255, 255, 0.2)'),
        borderWidth: 1,
        callbacks: {
          label: (ctx: TooltipItem<'bar'>) => {
            const value = formatCurrency(ctx.parsed.y);
            return `${ctx.dataset.label}: ${value}`;
          },
          afterLabel: (ctx: TooltipItem<'bar'>) => {
            const total = events.reduce((sum, e) => sum + e.revenue, 0);
            const percentage = ((ctx.parsed.y / total) * 100).toFixed(1);
            return `Proportion: ${percentage}%`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: getThemeClass('#374151', '#fff'),
          maxRotation: 45,
          minRotation: 45,
          font: { size: 11 },
        },
        grid: { color: getThemeClass('rgba(0, 0, 0, 0.1)', 'rgba(255, 255, 255, 0.1)') },
      },
      y: {
        ticks: {
          color: getThemeClass('#374151', '#fff'),
          callback: function (value: number) {
            return formatCurrency(value);
          },
        },
        beginAtZero: true,
        grid: { color: getThemeClass('rgba(0, 0, 0, 0.1)', 'rgba(255, 255, 255, 0.1)') },
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutCubic' as const,
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: getThemeClass('#1f2937', '#fff'),
          padding: 20,
          font: { size: 12 },
        },
        position: 'right' as const,
      },
      title: {
        display: true,
        text: `${t('revenueByEvent') || 'Revenue by Event'} (Top ${showTop})`,
        color: getThemeClass('#1f2937', '#fff'),
        font: { size: 18, weight: 'bold' as const },
      },
      tooltip: {
        backgroundColor: getThemeClass('rgba(0, 0, 0, 0.9)', 'rgba(0, 0, 0, 0.8)'),
        titleColor: getThemeClass('#fff', '#fff'),
        bodyColor: getThemeClass('#fff', '#fff'),
        borderColor: getThemeClass('rgba(0, 0, 0, 0.3)', 'rgba(255, 255, 255, 0.2)'),
        borderWidth: 1,
        callbacks: {
          label: (ctx: any) => {
            const value = formatCurrency(ctx.parsed);
            return `${ctx.label}: ${value}`;
          },
          afterLabel: (ctx: any) => {
            const total = events.reduce((sum, e) => sum + e.revenue, 0);
            const percentage = ((ctx.parsed / total) * 100).toFixed(1);
            return `Proportion: ${percentage}%`;
          },
        },
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutCubic' as const,
    },
  };

  const timelineData = {
    labels: timeline.map((item) => {
      const label = item.periodLabel || item.period || 'N/A';
      if (filter.GroupBy <= 1) {
        return new Date(label).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          ...(filter.GroupBy === 0 && { hour: '2-digit' }),
        });
      }
      return label;
    }),
    datasets: [
      {
        label: t('revenue') || 'Doanh thu',
        data: timeline.map((item) => item.revenue || 0),
        borderColor: 'rgba(255, 206, 86, 1)',
        backgroundColor: 'rgba(255, 206, 86, 0.2)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(255, 206, 86, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
      {
        label: t('transactionCount') || 'Transaction Count',
        data: timeline.map((item) => item.transactionCount || 0),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: false,
        tension: 0.4,
        yAxisID: 'y1',
        pointBackgroundColor: 'rgba(75, 192, 192, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const timelineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        labels: {
          color: getThemeClass('#1f2937', '#fff'),
          padding: 20,
        },
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${t('revenueTimeline') || 'Revenue Trend'} theo ${getGroupByLabel()}`,
        color: getThemeClass('#1f2937', '#fff'),
        font: { size: 18, weight: 'bold' as const },
      },
      tooltip: {
        backgroundColor: getThemeClass('rgba(0, 0, 0, 0.9)', 'rgba(0, 0, 0, 0.8)'),
        titleColor: getThemeClass('#fff', '#fff'),
        bodyColor: getThemeClass('#fff', '#fff'),
        borderColor: getThemeClass('rgba(0, 0, 0, 0.3)', 'rgba(255, 255, 255, 0.2)'),
        borderWidth: 1,
        callbacks: {
          label: (ctx: TooltipItem<'line'>) => {
            if (ctx.datasetIndex === 0) {
              return `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`;
            }
            return `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()} transactions`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: getThemeClass('#374151', '#fff'),
          maxRotation: 45,
          minRotation: 0,
        },
        grid: { color: getThemeClass('rgba(0, 0, 0, 0.1)', 'rgba(255, 255, 255, 0.1)') },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        ticks: {
          color: getThemeClass('#374151', '#fff'),
          callback: function (value: number) {
            return formatCurrency(value);
          },
        },
        beginAtZero: true,
        grid: { color: getThemeClass('rgba(0, 0, 0, 0.1)', 'rgba(255, 255, 255, 0.1)') },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        ticks: {
          color: getThemeClass('#374151', '#fff'),
          callback: function (value: number) {
            return value.toLocaleString();
          },
        },
        beginAtZero: true,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
    animation: {
      duration: 1200,
      easing: 'easeInOutCubic' as const,
    },
  };

  const totalRevenue = events.reduce((sum, e) => sum + e.revenue, 0);
  const avgRevenue = events.length > 0 ? totalRevenue / events.length : 0;
  const highestRevenue = events.length > 0 ? events[0].revenue : 0;
  const revenueGrowth =
    timeline.length > 1
      ? ((timeline[timeline.length - 1]?.revenue - timeline[0]?.revenue) / timeline[0]?.revenue) *
        100
      : 0;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div
          className={cn(
            'bg-gradient-to-br rounded-xl p-4 border shadow-lg',
            getThemeClass(
              'from-blue-500/20 to-blue-600/20 border-blue-400/30',
              'from-blue-500/20 to-blue-600/20 border-blue-400/30'
            )
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={20} className="text-blue-400" />
            <span
              className={cn(
                'text-sm',
                getThemeClass('text-blue-700 font-semibold', 'text-blue-300')
              )}
            >
              Total Revenue
            </span>
          </div>
          <div className={cn('text-xl font-bold', getThemeClass('text-blue-800', 'text-blue-400'))}>
            {formatCurrency(totalRevenue)}
          </div>
        </div>

        <div
          className={cn(
            'bg-gradient-to-br rounded-xl p-4 border shadow-lg',
            getThemeClass(
              'from-green-500/20 to-green-600/20 border-green-400/30',
              'from-green-500/20 to-green-600/20 border-green-400/30'
            )
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={20} className="text-green-400" />
            <span
              className={cn(
                'text-sm',
                getThemeClass('text-green-700 font-semibold', 'text-green-300')
              )}
            >
              Avg/Event
            </span>
          </div>
          <div
            className={cn('text-xl font-bold', getThemeClass('text-green-800', 'text-green-400'))}
          >
            {formatCurrency(avgRevenue)}
          </div>
        </div>

        <div
          className={cn(
            'bg-gradient-to-br rounded-xl p-4 border shadow-lg',
            getThemeClass(
              'from-purple-500/20 to-purple-600/20 border-purple-400/30',
              'from-purple-500/20 to-purple-600/20 border-purple-400/30'
            )
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={20} className="text-purple-400" />
            <span
              className={cn(
                'text-sm',
                getThemeClass('text-purple-700 font-semibold', 'text-purple-300')
              )}
            >
              Highest
            </span>
          </div>
          <div
            className={cn('text-xl font-bold', getThemeClass('text-purple-800', 'text-purple-400'))}
          >
            {formatCurrency(highestRevenue)}
          </div>
        </div>

        <div
          className={cn(
            'bg-gradient-to-br rounded-xl p-4 border shadow-lg',
            getThemeClass(
              'from-yellow-500/20 to-yellow-600/20 border-yellow-400/30',
              'from-yellow-500/20 to-yellow-600/20 border-yellow-400/30'
            )
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp
              size={20}
              className={cn(getThemeClass('text-yellow-600', 'text-yellow-400'))}
            />
            <span
              className={cn(
                'text-sm',
                getThemeClass('text-yellow-700 font-semibold', 'text-yellow-300')
              )}
            >
              Growth
            </span>
          </div>
          <div
            className={cn('text-xl font-bold', getThemeClass('text-yellow-800', 'text-yellow-400'))}
          >
            {revenueGrowth.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div
        className={cn(
          'bg-gradient-to-br rounded-2xl p-6 border-2 shadow-2xl',
          getThemeClass(
            'from-indigo-400/30 to-red-200/30 border-indigo-400/30',
            'from-indigo-400/30 to-red-200/30 border-indigo-400/30'
          )
        )}
      >
        {/* Chart Controls */}
        <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-blue-400" />
            <span
              className={cn(
                'font-medium',
                getThemeClass('text-blue-800 font-semibold', 'text-blue-300')
              )}
            >
              Revenue by Event
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div
              className={cn(
                'flex items-center gap-1 rounded-lg p-1',
                getThemeClass('bg-blue-100/80', 'bg-black/20')
              )}
            >
              {(['bar', 'doughnut'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    'px-3 py-1 rounded-md text-sm font-medium transition-all',
                    getThemeClass(
                      viewMode === mode
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-blue-700 hover:bg-blue-200 font-medium',
                      viewMode === mode
                        ? 'bg-blue-500/50 text-white'
                        : 'text-blue-300 hover:bg-blue-500/20'
                    )
                  )}
                >
                  {mode === 'bar' ? 'Bar' : 'Doughnut'}
                </button>
              ))}
            </div>

            {/* Show Top Selection */}
            <select
              value={showTop}
              onChange={(e) => setShowTop(Number(e.target.value))}
              className={cn(
                'border rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2',
                getThemeClass(
                  'bg-white/90 border-blue-300 text-blue-800 focus:ring-blue-400 font-medium',
                  'bg-black/20 border-blue-400/30 text-white focus:ring-blue-400'
                )
              )}
            >
              <option
                value={5}
                className={cn(getThemeClass('bg-white text-blue-800', 'bg-gray-800'))}
              >
                Top 5
              </option>
              <option
                value={10}
                className={cn(getThemeClass('bg-white text-blue-800', 'bg-gray-800'))}
              >
                Top 10
              </option>
              <option
                value={15}
                className={cn(getThemeClass('bg-white text-blue-800', 'bg-gray-800'))}
              >
                Top 15
              </option>
              <option
                value={20}
                className={cn(getThemeClass('bg-white text-blue-800', 'bg-gray-800'))}
              >
                Top 20
              </option>
            </select>
          </div>
        </div>

        <div className="h-96">
          {viewMode === 'bar' && <Bar data={eventData} options={barOptions} />}
          {viewMode === 'doughnut' && <Doughnut data={eventData} options={doughnutOptions} />}
        </div>
      </div>

      {/* Timeline Chart */}
      {timeline.length > 0 && (
        <div
          className={cn(
            'bg-gradient-to-br rounded-2xl p-6 border-2 shadow-2xl',
            getThemeClass(
              'from-yellow-400/30 to-blue-200/30 border-yellow-400/30',
              'from-yellow-400/30 to-blue-200/30 border-yellow-400/30'
            )
          )}
        >
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={20} className="text-yellow-400" />
            <span
              className={cn(
                'font-medium',
                getThemeClass('text-yellow-800 font-semibold', 'text-yellow-300')
              )}
            >
              Revenue Trend by {getGroupByLabel()}
            </span>
            <span
              className={cn(
                'text-sm px-2 py-1 rounded-full font-medium',
                getThemeClass(
                  'bg-yellow-400/30 text-yellow-800 font-semibold',
                  'bg-yellow-400/20 text-yellow-200'
                )
              )}
            >
              {timeline.length} data points
            </span>
          </div>

          <div className="h-80">
            <Line data={timelineData} options={timelineOptions} />
          </div>
        </div>
      )}
    </div>
  );
}
