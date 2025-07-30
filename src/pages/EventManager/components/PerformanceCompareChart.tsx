import { comparePerformance } from '@/services/Event Manager/event.service';
import { useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend,
  Filler,
  ChartOptions,
  TooltipItem
} from 'chart.js';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// Đăng ký các thành phần Chart.js
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
);

interface CompareDataPoint {
  label: string;
  current: number;
  previous: number;
  changePercentage?: number;
}

interface PerformanceCompareChartProps {
  filter: { 
    Period: number;
    ComparisonPeriod?: number;
    GroupBy?: number;
    CustomStartDate?: string;
    CustomEndDate?: string;
  };
}

export default function PerformanceCompareChart({ filter }: PerformanceCompareChartProps) {
  const { t } = useTranslation();
  const [dataPoints, setDataPoints] = useState<CompareDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'line' | 'bar'>('line');
  const [summaryStats, setSummaryStats] = useState<{
    totalCurrent: number;
    totalPrevious: number;
    avgChange: number;
    bestImprovement: CompareDataPoint | null;
    worstDecline: CompareDataPoint | null;
  } | null>(null);

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
      11: 11, // Last 7 Days -> Last 7 Days (same)
      12: 12, // Last 30 Days -> Last 30 Days (same)
      13: 13, // Last 90 Days -> Last 90 Days (same)
      14: 14, // Last 365 Days -> Last 365 Days (same)
      15: 15, // All Time -> All Time (same)
      16: 16  // Custom -> Custom (same)
    };
    return comparisonMap[currentPeriod] || currentPeriod;
  };

  const fetchData = async () => {
    if (!filter.Period) return;
    
    setLoading(true);
    try {
      const comparisonPeriod = filter.ComparisonPeriod || getDefaultComparisonPeriod(filter.Period);
      const data = await comparePerformance(filter.Period, comparisonPeriod);
      
      const points = (data.data?.points || data.points || [])
        .map(p => ({
          ...p,
          changePercentage: p.previous === 0 ? 
            (p.current > 0 ? 100 : 0) : 
            ((p.current - p.previous) / p.previous) * 100
        }));

      setDataPoints(points);
      calculateSummaryStats(points);

    } catch (error) {
      console.error('Error fetching comparison data:', error);
      setDataPoints([]);
      setSummaryStats(null);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummaryStats = (points: CompareDataPoint[]) => {
    const totalCurrent = points.reduce((sum, p) => sum + p.current, 0);
    const totalPrevious = points.reduce((sum, p) => sum + p.previous, 0);
    const avgChange = points.reduce((sum, p) => sum + (p.changePercentage || 0), 0) / points.length;
    
    const sortedByImprovement = [...points].sort((a, b) => 
      (b.changePercentage || 0) - (a.changePercentage || 0)
    );
    
    setSummaryStats({
      totalCurrent,
      totalPrevious,
      avgChange,
      bestImprovement: sortedByImprovement[0]?.changePercentage > 0 ? sortedByImprovement[0] : null,
      worstDecline: sortedByImprovement[sortedByImprovement.length - 1]?.changePercentage < 0 ? 
        sortedByImprovement[sortedByImprovement.length - 1] : null
    });
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatPercentage = (percentage: number): string => {
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(1)}%`;
  };

  const getPeriodLabel = (period: number): string => {
    const labels: Record<number, string> = {
      1: 'Today',
      2: 'Yesterday',
      3: 'This Week',
      4: 'Last Week',
      5: 'This Month',
      6: 'Last Month',
      7: 'This Quarter',
      8: 'Last Quarter',
      9: 'This Year',
      10: 'Last Year',
      11: 'Last 7 Days',
      12: 'Last 30 Days',
      13: 'Last 90 Days',
      14: 'Last 365 Days',
      15: 'All Time',
      16: 'Custom'
    };
    return t(labels[period] || 'Custom');
  };

  useEffect(() => {
    fetchData();
  }, [filter.Period, filter.ComparisonPeriod]);

  // Common chart options
  const commonChartOptions: ChartOptions<'line' | 'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'top',
        labels: { 
          color: '#fff',
          font: { size: 12, weight: '500' },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      title: { 
        display: true, 
        text: t('performanceComparison'), 
        color: '#fff', 
        font: { size: 18, weight: 'bold' },
        padding: { top: 10, bottom: 20 }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        usePointStyle: true,
        callbacks: {
          label: (context: TooltipItem<'line' | 'bar'>) => {
            const label = context.dataset.label || '';
            const value = formatNumber(context.parsed.y);
            const change = dataPoints[context.dataIndex]?.changePercentage;
            
            if (change === undefined) return `${label}: ${value}`;
            
            return [
              `${label}: ${value}`,
              `Change: ${formatPercentage(change)}`
            ];
          },
          afterLabel: (context: TooltipItem<'line' | 'bar'>) => {
            if (context.datasetIndex === 1) return null;
            
            const current = context.parsed.y;
            const previous = dataPoints[context.dataIndex]?.previous;
            
            if (previous === undefined || previous === 0) return null;
            
            const diff = current - previous;
            return `Difference: ${diff >= 0 ? '+' : ''}${formatNumber(diff)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { 
          color: 'rgba(255, 255, 255, 0.1)',
          drawTicks: false
        },
        ticks: { 
          color: 'rgba(255, 255, 255, 0.7)',
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        grid: { 
          color: 'rgba(255, 255, 255, 0.1)',
          drawTicks: false
        },
        ticks: { 
          color: 'rgba(255, 255, 255, 0.7)',
          callback: (value: string | number) => {
            if (typeof value === 'string') return value;
            return formatNumber(value);
          }
        },
        beginAtZero: true
      }
    },
    interaction: { 
      intersect: false, 
      mode: 'index'
    }
  };

  const lineChartData = {
    labels: dataPoints.map(p => p.label),
    datasets: [
      {
        label: `${t('currentPeriod')} (${getPeriodLabel(filter.Period)})`,
        data: dataPoints.map(p => p.current),
        borderColor: 'rgba(101, 116, 255, 1)',
        backgroundColor: 'rgba(101, 116, 255, 0.1)',
        tension: 0.3,
        fill: true,
        pointBackgroundColor: 'rgba(101, 116, 255, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        borderWidth: 3
      },
      {
        label: `${t('previousPeriod')} (${getPeriodLabel(filter.ComparisonPeriod || getDefaultComparisonPeriod(filter.Period))})`,
        data: dataPoints.map(p => p.previous),
        borderColor: 'rgba(255, 99, 132, 0.7)',
        backgroundColor: 'rgba(255, 99, 132, 0.05)',
        borderDash: [5, 5],
        tension: 0.3,
        pointBackgroundColor: 'rgba(255, 99, 132, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        borderWidth: 2
      }
    ]
  };

  const barChartData = {
    labels: dataPoints.map(p => p.label),
    datasets: [
      {
        label: `${t('currentPeriod')} (${getPeriodLabel(filter.Period)})`,
        data: dataPoints.map(p => p.current),
        backgroundColor: 'rgba(101, 116, 255, 0.8)',
        borderColor: 'rgba(101, 116, 255, 1)',
        borderWidth: 1,
        borderRadius: 6
      },
      {
        label: `${t('previousPeriod')} (${getPeriodLabel(filter.ComparisonPeriod || getDefaultComparisonPeriod(filter.Period))})`,
        data: dataPoints.map(p => p.previous),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
        borderRadius: 6
      }
    ]
  };

  if (loading) {
    return (
      <div className="mb-10 bg-gradient-to-br from-[#2d0036]/80 to-[#3a0ca3]/80 rounded-2xl p-6 border-2 border-purple-500/30 shadow-2xl animate-pulse">
        <div className="h-64 flex items-center justify-center">
          <div className="text-purple-300">{t('loading')}...</div>
        </div>
      </div>
    );
  }

  if (dataPoints.length === 0) {
    return (
      <div className="mb-10 bg-gradient-to-br from-[#2d0036]/80 to-[#3a0ca3]/80 rounded-2xl p-6 border-2 border-purple-500/30 shadow-2xl">
        <div className="h-64 flex flex-col items-center justify-center text-center">
          <Sparkles className="text-purple-400 mb-2" size={32} />
          <h3 className="text-xl font-semibold text-purple-300 mb-1">{t('noPerformanceData')}</h3>
          <p className="text-purple-200 max-w-md">{t('noPerformanceDataDescription')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-10">
      {/* Summary Cards */}
      {summaryStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-400/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-300 mb-1">{t('currentPeriodTotal')}</p>
                  <h3 className="text-2xl font-bold text-blue-400">
                    {formatNumber(summaryStats.totalCurrent)}
                  </h3>
                </div>
                <TrendingUp className="text-blue-400" size={24} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-400/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-300 mb-1">{t('previousPeriodTotal')}</p>
                  <h3 className="text-2xl font-bold text-purple-400">
                    {formatNumber(summaryStats.totalPrevious)}
                  </h3>
                </div>
                <TrendingDown className="text-purple-400" size={24} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-400/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-300 mb-1">{t('averageChange')}</p>
                  <h3 className={`text-2xl font-bold ${
                    summaryStats.avgChange >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {formatPercentage(summaryStats.avgChange)}
                  </h3>
                </div>
                {summaryStats.avgChange >= 0 ? (
                  <ArrowUpRight className="text-green-400" size={24} />
                ) : (
                  <ArrowDownRight className="text-red-400" size={24} />
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-yellow-400/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-300 mb-1">{t('dataPoints')}</p>
                  <h3 className="text-2xl font-bold text-yellow-400">
                    {dataPoints.length}
                  </h3>
                </div>
                <Sparkles className="text-yellow-400" size={24} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Highlights */}
      {(summaryStats?.bestImprovement || summaryStats?.worstDecline) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {summaryStats.bestImprovement && (
            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-400/20">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-green-300 mb-1">{t('bestImprovement')}</p>
                    <h3 className="text-xl font-bold text-green-400">
                      {summaryStats.bestImprovement.label}
                    </h3>
                    <p className="text-green-200 mt-1">
                      <span className="font-semibold">
                        {formatNumber(summaryStats.bestImprovement.current)} 
                      </span> vs {' '}
                      <span className="text-green-300">
                        {formatNumber(summaryStats.bestImprovement.previous)}
                      </span>
                    </p>
                  </div>
                  <div className="bg-green-500/20 px-3 py-1 rounded-full flex items-center">
                    <ArrowUpRight className="text-green-400 mr-1" size={16} />
                    <span className="text-green-200 font-medium">
                      {formatPercentage(summaryStats.bestImprovement.changePercentage || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {summaryStats.worstDecline && (
            <Card className="bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-400/20">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-red-300 mb-1">{t('worstDecline')}</p>
                    <h3 className="text-xl font-bold text-red-400">
                      {summaryStats.worstDecline.label}
                    </h3>
                    <p className="text-red-200 mt-1">
                      <span className="font-semibold">
                        {formatNumber(summaryStats.worstDecline.current)} 
                      </span> vs {' '}
                      <span className="text-red-300">
                        {formatNumber(summaryStats.worstDecline.previous)}
                      </span>
                    </p>
                  </div>
                  <div className="bg-red-500/20 px-3 py-1 rounded-full flex items-center">
                    <ArrowDownRight className="text-red-400 mr-1" size={16} />
                    <span className="text-red-200 font-medium">
                      {formatPercentage(summaryStats.worstDecline.changePercentage || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Chart Container */}
      <Card className="bg-gradient-to-br from-[#2d0036]/80 to-[#3a0ca3]/80 border-2 border-purple-500/30 shadow-2xl">
        <CardContent className="p-6">
          {/* Chart Controls */}
          <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
            <h3 className="text-xl font-semibold text-purple-300">
              {t('performanceComparison')}
            </h3>
            
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-black/20 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('line')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'line' 
                      ? 'bg-purple-500/50 text-white' 
                      : 'text-purple-300 hover:bg-purple-500/20'
                  }`}
                >
                  {t('lineChart')}
                </button>
                <button
                  onClick={() => setViewMode('bar')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'bar' 
                      ? 'bg-purple-500/50 text-white' 
                      : 'text-purple-300 hover:bg-purple-500/20'
                  }`}
                >
                  {t('barChart')}
                </button>
              </div>
            </div>
          </div>
          
          {/* Chart */}
          <div className="h-96">
            {viewMode === 'line' ? (
              <Line data={lineChartData} options={commonChartOptions} />
            ) : (
              <Bar data={barChartData} options={commonChartOptions} />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}