const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('vi-VN').format(value);
};import { useEffect, useState, useCallback } from 'react';
import { Bar, Line, Doughnut, Radar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement, ArcElement, RadialLinearScale } from 'chart.js';
import { Ticket, TrendingUp, Users, BarChart3, PieChart, Target, RefreshCw } from 'lucide-react';
import { getEventManagerTicketStats } from '@/services/Event Manager/event.service';

// Register Chart.js components
Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement, ArcElement, RadialLinearScale);

interface TicketStatsData {
eventStats: Array<{
  eventName: string;
  ticketsSold: number;
  totalTickets: number;
  sellRate: number;
  revenue: number;
}>;
timeline: Array<{
  periodLabel?: string;
  period?: string;
  ticketsSold: number;
  sellRate: number;
  revenue: number;
}>;
summary: {
  totalSold: number;
  totalAvailable: number;
  sellRate: number;
  avgPerEvent: number;
};
}

interface FilterProps {
CustomStartDate: string;
CustomEndDate: string;
GroupBy: number;
Period: number;
}

export default function TicketStatsSection({ filter }: { filter: FilterProps }) {
const [ticketData, setTicketData] = useState<TicketStatsData>({
  eventStats: [],
  timeline: [],
  summary: {
    totalSold: 0,
    totalAvailable: 0,
    sellRate: 0,
    avgPerEvent: 0
  }
});
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [viewMode, setViewMode] = useState<'bar' | 'line' | 'doughnut' | 'radar'>('bar');
const [showTop, setShowTop] = useState(10);

const fetchData = useCallback(async () => {
  setLoading(true);
  setError(null);
  
  try {
    const params = {
      CustomStartDate: filter.CustomStartDate,
      CustomEndDate: filter.CustomEndDate,
      GroupBy: filter.GroupBy,
      Period: filter.Period || 12,
    };

    console.log('Fetching ticket stats with params:', params);
    const response = await getEventManagerTicketStats(params);
    console.log('Ticket stats API response:', response);
    
    const apiData = response.data || {};
    const overviewData = apiData.overviewFilter || apiData.overviewAllTime || {};
    
    // Transform timeline data
    const timeline = (apiData.salesTrend || []).map((item: any) => ({
      periodLabel: item.periodLabel || 'N/A',
      period: item.period || '',
      ticketsSold: item.ticketsSold || 0,
      revenue: item.revenue || 0,
      sellRate: 0 // Calculate if needed
    }));

    // Create event stats
    const eventStats = [{
      eventName: 'Tất cả sự kiện',
      ticketsSold: overviewData.totalTicketsSold || 0,
      totalTickets: overviewData.totalTicketsCreated || overviewData.totalTicketsCount || 0,
      sellRate: overviewData.overallSoldPercentage || 0,
      revenue: timeline.reduce((sum: number, item: any) => sum + (item.revenue || 0), 0)
    }];

    // Create summary data
    const summary = {
      totalSold: overviewData.totalTicketsSold || 0,
      totalAvailable: overviewData.totalTicketsCreated || overviewData.totalTicketsCount || 0,
      sellRate: overviewData.overallSoldPercentage || 0,
      avgPerEvent: overviewData.averageTicketPrice || 0
    };

    console.log('Transformed ticket data:', { eventStats, timeline, summary });
    
    setTicketData({
      eventStats,
      timeline,
      summary
    });
  } catch (err) {
    console.error('Error fetching ticket stats:', err);
    setError('Không thể tải dữ liệu thống kê vé. Vui lòng thử lại sau.');
    
    // Reset data on error
    setTicketData({
      eventStats: [],
      timeline: [],
      summary: { 
        totalSold: 0, 
        totalAvailable: 0, 
        sellRate: 0, 
        avgPerEvent: 0 
      }
    });
  } finally {
    setLoading(false);
  }
}, [filter.CustomStartDate, filter.CustomEndDate, filter.GroupBy, filter.Period]);

useEffect(() => {
  fetchData();
}, [fetchData]);

const getGroupByLabel = () => {
  const labels: { [key: number]: string } = {
    0: 'giờ',
    1: 'ngày', 
    2: 'tuần',
    3: 'tháng',
    4: 'quý',
    5: 'năm'
  };
  return labels[filter.GroupBy] || 'thời gian';
};

if (loading) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gradient-to-br from-pink-500/20 to-pink-600/20 rounded-xl p-4 border border-pink-400/30 animate-pulse">
            <div className="h-4 bg-pink-400/20 rounded mb-2"></div>
            <div className="h-6 bg-pink-400/20 rounded"></div>
          </div>
        ))}
      </div>
      <div className="bg-gradient-to-br from-pink-400/30 to-red-200/30 rounded-2xl p-6 border-2 border-pink-400/30">
        <div className="animate-pulse">
          <div className="h-6 bg-pink-400/20 rounded mb-4 w-1/3"></div>
          <div className="h-64 bg-pink-400/10 rounded"></div>
        </div>
      </div>
    </div>
  );
}

if (error) {
  return (
    <div className="text-center py-12 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-2xl border-2 border-red-400/30">
      <div className="text-red-400 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-red-300 mb-2">Đã xảy ra lỗi</h3>
      <p className="text-red-200 mb-4">{error}</p>
      <button
        onClick={fetchData}
        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
      >
        <RefreshCw size={16} />
        Thử lại
      </button>
    </div>
  );
}

// Updated logic to check for no data - check if there's actually no meaningful data
const hasNoData = ticketData.summary.totalSold === 0 && 
                  ticketData.summary.totalAvailable === 0 && 
                  ticketData.timeline.length === 0;

if (hasNoData) {
  return (
    <div className="text-center py-12 bg-gradient-to-br from-gray-500/20 to-gray-600/20 rounded-2xl border-2 border-gray-400/30">
      <Ticket size={48} className="mx-auto text-gray-400 mb-4" />
      <h3 className="text-xl font-semibold text-gray-300 mb-2">Không có dữ liệu vé</h3>
      <p className="text-gray-400 mb-4">Chưa có dữ liệu bán vé trong khoảng thời gian đã chọn</p>
      <button
        onClick={fetchData}
        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
      >
        <RefreshCw size={16} />
        Làm mới
      </button>
    </div>
  );
}

const topEvents = ticketData.eventStats.slice(0, showTop);

// Color arrays for consistency
const colors = [
  'rgba(255, 99, 132, 0.8)',
  'rgba(54, 162, 235, 0.8)',
  'rgba(255, 206, 86, 0.8)',
  'rgba(75, 192, 192, 0.8)',
  'rgba(153, 102, 255, 0.8)',
  'rgba(255, 159, 64, 0.8)',
  'rgba(199, 199, 199, 0.8)',
  'rgba(83, 102, 255, 0.8)',
  'rgba(255, 99, 255, 0.8)',
  'rgba(99, 255, 132, 0.8)'
];

const borderColors = [
  'rgba(255, 99, 132, 1)',
  'rgba(54, 162, 235, 1)',
  'rgba(255, 206, 86, 1)',
  'rgba(75, 192, 192, 1)',
  'rgba(153, 102, 255, 1)',
  'rgba(255, 159, 64, 1)',
  'rgba(199, 199, 199, 1)',
  'rgba(83, 102, 255, 1)',
  'rgba(255, 99, 255, 1)',
  'rgba(99, 255, 132, 1)'
];

// Chart data for different visualizations
const chartData = {
  labels: topEvents.map((e) => {
    const name = e.eventName;
    return name.length > 15 ? name.substring(0, 15) + '...' : name;
  }),
  datasets: [
    {
      label: 'Vé đã bán',
      data: topEvents.map((e) => e.ticketsSold),
      backgroundColor: topEvents.map((_, index) => colors[index % colors.length]),
      borderColor: topEvents.map((_, index) => borderColors[index % borderColors.length]),
      borderWidth: 2,
      borderRadius: viewMode === 'bar' ? 8 : 0,
      borderSkipped: false as const,
    },
    ...(viewMode === 'bar' ? [{
      label: 'Tổng vé',
      data: topEvents.map((e) => e.totalTickets),
      backgroundColor: 'rgba(150, 150, 150, 0.3)',
      borderColor: 'rgba(150, 150, 150, 0.8)',
      borderWidth: 1,
      borderRadius: 8,
      borderSkipped: false as const,
    }] : [])
  ],
};

// Radar chart data for sell rates
const radarData = {
  labels: topEvents.slice(0, 6).map((e) => {
    const name = e.eventName;
    return name.length > 10 ? name.substring(0, 10) + '...' : name;
  }),
  datasets: [
    {
      label: 'Tỷ lệ bán vé (%)',
      data: topEvents.slice(0, 6).map((e) => e.sellRate),
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      borderColor: 'rgba(255, 99, 132, 1)',
      borderWidth: 2,
      pointBackgroundColor: 'rgba(255, 99, 132, 1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(255, 99, 132, 1)',
    }
  ]
};

// Timeline data
const timelineData = {
  labels: ticketData.timeline.map((item) => {
    const label = item.periodLabel || item.period || 'N/A';
    if (filter.GroupBy <= 1) {
      try {
        return new Date(label).toLocaleDateString('vi-VN', { 
          month: 'short', 
          day: 'numeric',
          ...(filter.GroupBy === 0 && { hour: '2-digit' })
        });
      } catch {
        return label;
      }
    }
    return label;
  }),
  datasets: [
    {
      label: 'Vé đã bán',
      data: ticketData.timeline.map((item) => item.ticketsSold || 0),
      borderColor: 'rgba(255, 99, 132, 1)',
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: 'rgba(255, 99, 132, 1)',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 6,
      pointHoverRadius: 8,
    },
    {
      label: 'Doanh thu (VNĐ)',
      data: ticketData.timeline.map((item) => (item.revenue || 0) / 1000), // Convert to thousands for better scale
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

// Base chart options
const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { 
      display: true,
      labels: { color: '#fff', padding: 20 }
    },
    title: { 
      display: true, 
      text: `Vé bán theo sự kiện (Top ${showTop})`, 
      color: '#fff', 
      font: { size: 18, weight: 'bold' as const }
    },
    tooltip: { 
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      borderWidth: 1,
    }
  },
  animation: {
    duration: 1000,
    easing: 'easeInOutCubic' as const
  }
};

// Specific options for different chart types
const barOptions = {
  ...baseOptions,
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
          return value.toLocaleString();
        }
      },
      beginAtZero: true,
      grid: { color: 'rgba(255, 255, 255, 0.1)' }
    }
  }
};

const doughnutOptions = {
  ...baseOptions,
  plugins: {
    ...baseOptions.plugins,
    legend: { 
      display: true,
      labels: { color: '#fff', padding: 20 },
      position: 'right' as const
    }
  }
};

const radarOptions = {
  ...baseOptions,
  scales: {
    r: {
      beginAtZero: true,
      max: 100,
      ticks: {
        color: '#fff',
        callback: function(value: any) {
          return value + '%';
        }
      },
      grid: { color: 'rgba(255, 255, 255, 0.2)' },
      angleLines: { color: 'rgba(255, 255, 255, 0.2)' },
      pointLabels: { color: '#fff', font: { size: 12 } }
    }
  }
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
      text: `Xu hướng bán vé theo ${getGroupByLabel()}`,
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
            return `${ctx.dataset.label}: ${ctx.parsed.y?.toLocaleString()} vé`;
          }
          return `${ctx.dataset.label}: ${(ctx.parsed.y * 1000)?.toLocaleString()} VNĐ`;
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
          return value.toLocaleString();
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
          return (value * 1000).toLocaleString() + ' VNĐ';
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

return (
  <div className="space-y-6 bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e] text-white p-6 rounded-2xl">
    {/* Summary Stats */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-gradient-to-br from-pink-500/20 to-pink-600/20 rounded-xl p-4 border border-pink-400/30">
        <div className="flex items-center gap-2 mb-2">
          <Ticket size={20} className="text-pink-400" />
          <span className="text-sm text-pink-300">Vé đã bán</span>
        </div>
        <div className="text-xl font-bold text-pink-400">{ticketData.summary.totalSold.toLocaleString()}</div>
      </div>
      
      <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl p-4 border border-blue-400/30">
        <div className="flex items-center gap-2 mb-2">
          <Users size={20} className="text-blue-400" />
          <span className="text-sm text-blue-300">Tổng vé tạo</span>
        </div>
        <div className="text-xl font-bold text-blue-400">{formatNumber(ticketData.summary.totalAvailable)}</div>
      </div>
      
      <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl p-4 border border-green-400/30">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={20} className="text-green-400" />
          <span className="text-sm text-green-300">Tỷ lệ bán</span>
        </div>
        <div className="text-xl font-bold text-green-400">
          {typeof ticketData.summary.sellRate === 'number' ? ticketData.summary.sellRate.toFixed(1) : '0.0'}%
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl p-4 border border-purple-400/30">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 size={20} className="text-purple-400" />
          <span className="text-sm text-purple-300">Giá TB</span>
        </div>
        <div className="text-xl font-bold text-purple-400">
          {formatCurrency(ticketData.summary.avgPerEvent)}
        </div>
      </div>
    </div>

    {/* Main Chart */}
    <div className="bg-gradient-to-br from-pink-400/30 to-red-200/30 rounded-2xl p-6 border-2 border-pink-400/30 shadow-2xl">
      {/* Chart Controls */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-2">
          <Ticket size={20} className="text-pink-400" />
          <span className="text-pink-300 font-medium">Thống kê bán vé</span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-black/20 rounded-lg p-1">
            {(['bar', 'doughnut', 'radar'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all flex items-center gap-1 ${
                  viewMode === mode 
                    ? 'bg-pink-500/50 text-white' 
                    : 'text-pink-300 hover:bg-pink-500/20'
                }`}
              >
                {mode === 'bar' && <BarChart3 size={14} />}
                {mode === 'doughnut' && <PieChart size={14} />}
                {mode === 'radar' && <Target size={14} />}
                {mode === 'bar' ? 'Cột' : mode === 'doughnut' ? 'Tròn' : 'Radar'}
              </button>
            ))}
          </div>
          
          {/* Show Top Selection */}
          {viewMode !== 'radar' && (
            <select
              value={showTop}
              onChange={(e) => setShowTop(Number(e.target.value))}
              className="bg-black/20 border border-pink-400/30 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            >
              <option value={5} className="bg-gray-800">Top 5</option>
              <option value={10} className="bg-gray-800">Top 10</option>
              <option value={15} className="bg-gray-800">Top 15</option>
              <option value={20} className="bg-gray-800">Top 20</option>
            </select>
          )}
        </div>
      </div>
      
      <div className="h-96">
        {viewMode === 'bar' && <Bar data={chartData} options={barOptions} />}
        {viewMode === 'doughnut' && <Doughnut data={chartData} options={doughnutOptions} />}
        {viewMode === 'radar' && <Radar data={radarData} options={radarOptions} />}
      </div>

      {/* Performance Indicators */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-black/20 rounded-lg p-4">
          <div className="text-sm text-pink-300 mb-1">Sự kiện chính</div>
          <div className="text-lg font-semibold text-white">
            {topEvents[0]?.eventName || 'N/A'}
          </div>
          <div className="text-sm text-pink-400">
            {formatNumber(topEvents[0]?.ticketsSold || 0)} vé đã bán ({topEvents[0]?.sellRate.toFixed(1)}% tỷ lệ)
          </div>
        </div>
        
        <div className="bg-black/20 rounded-lg p-4">
          <div className="text-sm text-blue-300 mb-1">Tổng doanh thu</div>
          <div className="text-lg font-semibold text-white">
            {formatCurrency(ticketData.timeline.reduce((sum, item) => sum + (item.revenue || 0), 0))}
          </div>
          <div className="text-sm text-blue-400">
            Từ {ticketData.timeline.length} giai đoạn
          </div>
        </div>
        
        <div className="bg-black/20 rounded-lg p-4">
          <div className="text-sm text-green-300 mb-1">Vé còn lại</div>
          <div className="text-lg font-semibold text-white">
            {formatNumber(ticketData.summary.totalAvailable - ticketData.summary.totalSold)}
          </div>
          <div className="text-sm text-green-400">
            Có thể bán thêm
          </div>
        </div>
      </div>
    </div>

    {/* Timeline Chart */}
    {ticketData.timeline.length > 0 && (
      <div className="bg-gradient-to-br from-indigo-400/30 to-purple-200/30 rounded-2xl p-6 border-2 border-indigo-400/30 shadow-2xl">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp size={20} className="text-indigo-400" />
          <span className="text-indigo-300 font-medium">Xu hướng bán vé theo {getGroupByLabel()}</span>
          <span className="text-sm bg-indigo-400/20 px-2 py-1 rounded-full text-indigo-200">
            {ticketData.timeline.length} điểm dữ liệu
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