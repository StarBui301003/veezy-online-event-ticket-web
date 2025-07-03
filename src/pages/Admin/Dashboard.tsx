import { useEffect, useState } from 'react';
import { getAdminDashboard } from '@/services/Admin/dashboard.service';
import type { AdminDashboardData } from '@/types/Admin/dashboard';
// Thay import chart bằng recharts (hỗ trợ Vite tốt)
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const cardClass =
  'flex-1 min-w-[220px] max-w-[340px] bg-white rounded-xl shadow border p-5 flex flex-col justify-between mx-2 my-2';

export const Dashboard = () => {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Tham số ví dụ cho dashboard (AllTime, so sánh với Yesterday, group theo ngày)
  const dashboardParams = {
    Period: 15, // AllTime
    IncludeComparison: true,
    ComparisonPeriod: 2, // Yesterday
    GroupBy: 1, // Day
    IncludeMetrics: ['revenue', 'ticketsSold'],
    IncludeRealtimeData: false,
  };

  useEffect(() => {
    getAdminDashboard(dashboardParams)
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40 text-lg text-gray-500">
        Loading dashboard...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex justify-center items-center h-40 text-lg text-red-500">
        Failed to load dashboard data.
      </div>
    );
  }

  // Chuẩn bị dữ liệu cho chart
  const chartData =
    data.financialOverview.revenueTimeline?.map((item) => ({
      period: item.periodLabel,
      revenue: item.revenue,
      ticketsSold: item.transactionCount,
    })) || [];

  return (
    <div className="p-6">
      <div className="flex flex-wrap gap-4 justify-between">
        {/* User Overview */}
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 font-medium">Users</span>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
              +{data.systemOverview.growth.usersGrowth ?? 0}%
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-1">
            {data.systemOverview.totalUsers.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 font-semibold">
            Active: {data.userStatistics.growth.activeUsers.toLocaleString()}
          </div>
          <div className="text-xs text-gray-400">
            New today: {data.userStatistics.growth.newUsersToday}
          </div>
        </div>
        {/* Event Overview */}
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 font-medium">Events</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
              +{data.systemOverview.growth.eventsGrowth ?? 0}%
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-1">
            {data.systemOverview.totalEvents.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 font-semibold">
            Completed: {data.systemOverview.completedEvents}
          </div>
          <div className="text-xs text-gray-400">Active: {data.systemOverview.activeEvents}</div>
        </div>
        {/* Financial Overview */}
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 font-medium">Financial</span>
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
              +{data.systemOverview.growth.revenueGrowth ?? 0}%
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-1">
            {data.systemOverview.totalRevenue.toLocaleString('vi-VN')}₫
          </div>
          <div className="text-sm text-gray-600 font-semibold">
            Platform: {data.systemOverview.platformRevenue.toLocaleString('vi-VN')}₫
          </div>
        </div>
        {/* Tickets Sold Overview */}
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 font-medium">Tickets Sold</span>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
              +{data.systemOverview.growth.ticketsGrowth ?? 0}%
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-1">
            {data.systemOverview.totalTicketsSold.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 font-semibold">Total tickets sold in system</div>
        </div>
      </div>
      {/* Chart section */}
      <div className="mt-8 bg-white rounded-xl shadow border p-6">
        <div className="mb-4 text-lg font-semibold text-gray-700">
          Revenue & Tickets Sold Over Time
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#f59e42" name="Revenue (VND)" />
            <Line type="monotone" dataKey="ticketsSold" stroke="#6366f1" name="Tickets Sold" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
