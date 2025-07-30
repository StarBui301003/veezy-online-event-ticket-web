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
  Filler
} from 'chart.js';
import { getEventManagerRevenue } from '@/services/Event Manager/event.service';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown, Calendar, BarChart3 } from 'lucide-react';

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

export default function RevenueChartSection({ filter }: { filter: { CustomStartDate: string; CustomEndDate: string; GroupBy: number } }) {
  const { t } = useTranslation();
  const [events, setEvents] = useState<{ eventName: string; revenue: number }[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'bar' | 'line' | 'doughnut'>('bar');
  const [showTop, setShowTop] = useState(10);

  async function fetchData() {
    setLoading(true);
    try {
      const dash = await getEventManagerRevenue({
        customStartDate: filter.CustomStartDate,
        customEndDate: filter.CustomEndDate,
        groupBy: filter.GroupBy,
      });
      
      const revenueByEvent = dash.data?.revenueByEvent || dash.revenueByEvent || [];
      const revenueTrend = dash.data?.revenueTrend || dash.revenueTrend || [];
      
      // Sort và limit events theo revenue
      const sortedEvents = revenueByEvent
        .map((e: any) => ({ eventName: e.eventName, revenue: e.revenue }))
        .sort((a: any, b: any) => b.revenue - a.revenue);
      
      setEvents(sortedEvents);
      setTimeline(revenueTrend);
    } catch {
      setEvents([]);
      setTimeline([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, [filter.CustomStartDate, filter.CustomEndDate, filter.GroupBy]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)}B₫`;
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M₫`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K₫`;
    return `${amount.toLocaleString('vi-VN')}₫`;
  };

  const getGroupByLabel = () => {
    const labels = {
      0: 'giờ',
      1: 'ngày', 
      2: 'tuần',
      3: 'tháng',
      4: 'quý',
      5: 'năm'
    };
    return labels[filter.GroupBy as keyof typeof labels] || 'thời gian';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading skeletons */}
        <div className="bg-gradient-to-br from-[#2d0036]/80 to-[#3a0ca3]/80 rounded-2xl p-6 border-2 border-blue-500/30">
          <div className="animate-pulse">
            <div className="h-6 bg-blue-400/20 rounded mb-4 w-1/3"></div>
            <div className="h-64 bg-blue-400/10 rounded"></div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-400/30 to-blue-200/30 rounded-2xl p-6 border-2 border-yellow-400/30">
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
      <div className="text-center py-12 bg-gradient-to-br from-gray-500/20 to-gray-600/20 rounded-2xl border-2 border-gray-400/30">
        <BarChart3 size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-300 mb-2">Không có dữ liệu doanh thu</h3>
        <p className="text-gray-400">Chưa có dữ liệu doanh thu trong khoảng thời gian đã chọn</p>
      </div>
    );
  }

  // Biểu đồ doanh thu từng sự kiện với nhiều tùy chọn hiển thị
  const topEvents = events.slice(0, showTop);
  const eventData = {
    labels: topEvents.map(e => {
      // Rút gọn tên sự kiện nếu quá dài
      const name = e.eventName;
      return name.length > 20 ? name.substring(0, 20) + '...' : name;
    }),
    datasets: [
      {
        label: t('revenue') || 'Doanh thu',
        data: topEvents.map(e => e.revenue),
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
            'rgba(99, 255, 132, 0.8)'
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
            'rgba(99, 255, 132, 1)'
          ];
          return colors[index % colors.length];
        }),
        borderWidth: 2,
        borderRadius: viewMode === 'bar' ? 8 : 0,
        borderSkipped: false,
      },
    ],
  };

  // Separate options for different chart types
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: false,
        labels: { color: '#fff', padding: 20 }
      },
      title: { 
        display: true, 
        text: `${t('revenueByEvent') || 'Doanh thu theo sự kiện'} (Top ${showTop})`, 
        color: '#fff', 
        font: { size: 18, weight: 'bold' as const }
      },
      tooltip: { 
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        callbacks: { 
          label: (ctx: any) => {
            const value = formatCurrency(ctx.parsed.y);
            return `${ctx.dataset.label}: ${value}`;
          },
          afterLabel: (ctx: any) => {
            const total = events.reduce((sum, e) => sum + e.revenue, 0);
            const percentage = (ctx.parsed.y / total * 100).toFixed(1);
            return `Tỷ trọng: ${percentage}%`;
          }
        }
      }
    },
    scales: {
      x: { 
        ticks: { 
          color: '#fff',
          maxRotation: 45,
          minRotation: 45,
          font: { size: 11 }
        },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      y: { 
        ticks: { 
          color: '#fff',
          callback: function(value: any) {
            return formatCurrency(value);
          }
        },
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutCubic' as const
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: true,
        labels: { 
          color: '#fff', 
          padding: 20,
          font: { size: 12 }
        },
        position: 'right' as const
      },
      title: { 
        display: true, 
        text: `${t('revenueByEvent') || 'Doanh thu theo sự kiện'} (Top ${showTop})`, 
        color: '#fff', 
        font: { size: 18, weight: 'bold' as const }
      },
      tooltip: { 
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        callbacks: { 
          label: (ctx: any) => {
            const value = formatCurrency(ctx.parsed);
            return `${ctx.label}: ${value}`;
          },
          afterLabel: (ctx: any) => {
            const total = events.reduce((sum, e) => sum + e.revenue, 0);
            const percentage = (ctx.parsed / total * 100).toFixed(1);
            return `Tỷ trọng: ${percentage}%`;
          }
        }
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutCubic' as const
    }
  };

  // Biểu đồ timeline với cải thiện
  const timelineData = {
    labels: timeline.map(item => {
      // Format label theo GroupBy
      const label = item.periodLabel || item.period || 'N/A';
      if (filter.GroupBy <= 1) { // Giờ hoặc ngày
        return new Date(label).toLocaleDateString('vi-VN', { 
          month: 'short', 
          day: 'numeric',
          ...(filter.GroupBy === 0 && { hour: '2-digit' })
        });
      }
      return label;
    }),
    datasets: [
      {
        label: t('revenue') || 'Doanh thu',
        data: timeline.map(item => item.revenue || 0),
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
        label: t('transactionCount') || 'Số giao dịch',
        data: timeline.map(item => item.transactionCount || 0),
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
      }
    ]
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
        labels: { color: "#fff", padding: 20 },
        position: 'top' as const
      },
      title: {
        display: true,
        text: `${t('revenueTimeline') || 'Xu hướng doanh thu'} theo ${getGroupByLabel()}`,
        color: "#fff",
        font: { size: 18, weight: 'bold' as const },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        callbacks: {
          label: (ctx: any) => {
            if (ctx.datasetIndex === 0) {
              return `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`;
            }
            return `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()} giao dịch`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { 
          color: "#fff",
          maxRotation: 45,
          minRotation: 0
        },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        ticks: { 
          color: "#fff",
          callback: function(value: any) {
            return formatCurrency(value);
          }
        },
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        ticks: { 
          color: "#fff",
          callback: function(value: any) {
            return value.toLocaleString();
          }
        },
        beginAtZero: true,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
    animation: {
      duration: 1200,
      easing: 'easeInOutCubic' as const
    }
  };

  // Stats summary
  const totalRevenue = events.reduce((sum, e) => sum + e.revenue, 0);
  const avgRevenue = events.length > 0 ? totalRevenue / events.length : 0;
  const highestRevenue = events.length > 0 ? events[0].revenue : 0;
  const revenueGrowth = timeline.length > 1 ? 
    ((timeline[timeline.length - 1]?.revenue - timeline[0]?.revenue) / timeline[0]?.revenue * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl p-4 border border-blue-400/30">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={20} className="text-blue-400" />
            <span className="text-sm text-blue-300">Tổng doanh thu</span>
          </div>
          <div className="text-xl font-bold text-blue-400">{formatCurrency(totalRevenue)}</div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl p-4 border border-green-400/30">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={20} className="text-green-400" />
            <span className="text-sm text-green-300">TB/sự kiện</span>
          </div>
          <div className="text-xl font-bold text-green-400">{formatCurrency(avgRevenue)}</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl p-4 border border-purple-400/30">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={20} className="text-purple-400" />
            <span className="text-sm text-purple-300">Cao nhất</span>
          </div>
          <div className="text-xl font-bold text-purple-400">{formatCurrency(highestRevenue)}</div>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-xl p-4 border border-yellow-400/30">
          <div className="flex items-center gap-2 mb-2">
            {revenueGrowth >= 0 ? 
              <TrendingUp size={20} className="text-yellow-400" /> : 
              <TrendingDown size={20} className="text-red-400" />
            }
            <span className="text-sm text-yellow-300">Tăng trưởng</span>
          </div>
          <div className={`text-xl font-bold ${revenueGrowth >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>
            {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Revenue by Event Chart */}
      {events.length > 0 && (
        <div className="bg-gradient-to-br from-[#2d0036]/80 to-[#3a0ca3]/80 rounded-2xl p-6 border-2 border-blue-500/30 shadow-2xl">
          {/* Chart Controls */}
          <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-2">
              <Calendar size={20} className="text-blue-400" />
              <span className="text-blue-300 font-medium">Doanh thu theo sự kiện</span>
            </div>
            
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-black/20 rounded-lg p-1">
                {(['bar', 'doughnut'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                      viewMode === mode 
                        ? 'bg-blue-500/50 text-white' 
                        : 'text-blue-300 hover:bg-blue-500/20'
                    }`}
                  >
                    {mode === 'bar' ? 'Cột' : 'Tròn'}
                  </button>
                ))}
              </div>
              
              {/* Show Top Selection */}
              <select
                value={showTop}
                onChange={(e) => setShowTop(Number(e.target.value))}
                className="bg-black/20 border border-blue-400/30 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value={5} className="bg-gray-800">Top 5</option>
                <option value={10} className="bg-gray-800">Top 10</option>
                <option value={15} className="bg-gray-800">Top 15</option>
                <option value={20} className="bg-gray-800">Top 20</option>
              </select>
            </div>
          </div>
          
          <div className="h-96">
            {viewMode === 'bar' && <Bar data={eventData} options={barOptions} />}
            {viewMode === 'doughnut' && <Doughnut data={eventData} options={doughnutOptions} />}
          </div>
        </div>
      )}

      {/* Timeline Chart */}
      {timeline.length > 0 && (
        <div className="bg-gradient-to-br from-yellow-400/30 to-blue-200/30 rounded-2xl p-6 border-2 border-yellow-400/30 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={20} className="text-yellow-400" />
            <span className="text-yellow-300 font-medium">Xu hướng doanh thu theo {getGroupByLabel()}</span>
            <span className="text-sm bg-yellow-400/20 px-2 py-1 rounded-full text-yellow-200">
              {timeline.length} điểm dữ liệu
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