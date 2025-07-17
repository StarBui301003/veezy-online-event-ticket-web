/* eslint-disable @typescript-eslint/no-explicit-any */
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
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import { toast } from 'react-toastify';
// Thêm import cho animation
import { motion, AnimatePresence } from 'framer-motion';

const cardClass =
  'flex-1 min-w-[220px] max-w-[340px] bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-5 flex flex-col justify-between mx-2 my-2';

export const Dashboard = () => {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAdminDashboard()
      .then((res) => setData(res.data))
      .catch(() => {
        toast.error('Unable to load dashboard data. Please try again later.!');
        setData(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // Hiển thị spinner overlay khi loading
  if (loading) {
    return <SpinnerOverlay show />;
  }

  if (!data) {
    return (
      <div className="flex justify-center items-center h-40 text-lg text-red-500">
        Failed to load dashboard data.
      </div>
    );
  }

  // Chuẩn bị dữ liệu cho các chart
  const chartData =
    data.financialOverview.revenueTimeline?.map((item) => ({
      period: item.periodLabel,
      revenue: item.revenue,
      ticketsSold: item.transactionCount,
    })) || [];

  // Bar Chart - Events by Status
  const eventStatusData = data.eventStatistics.eventsByStatus.map((item) => ({
    status: `Status ${item.status}`,
    count: item.count,
    percentage: item.percentage,
  }));

  // Area Chart - User Growth
  const userGrowthData =
    data.userStatistics.growth.growthChart?.map((item: any) => ({
      period: item.periodLabel,
      newUsers: item.newUsers,
      totalUsers: item.totalUsers,
    })) || [];

  // Pie Chart - Events by Category
  const categoryData = data.eventStatistics.eventsByCategory.map((item) => ({
    name: item.categoryName,
    value: item.count,
    revenue: item.revenue,
  }));

  // Radar Chart - System Overview
  const systemOverviewData = [
    {
      metric: 'Users',
      value: data.systemOverview.totalUsers,
      fullMark: Math.max(20, data.systemOverview.totalUsers),
    },
    {
      metric: 'Events',
      value: data.systemOverview.totalEvents,
      fullMark: Math.max(20, data.systemOverview.totalEvents),
    },
    {
      metric: 'Tickets',
      value: data.systemOverview.totalTicketsSold,
      fullMark: Math.max(20, data.systemOverview.totalTicketsSold),
    },
    {
      metric: 'Revenue',
      value: Math.round(data.systemOverview.totalRevenue / 100000), // Scale down for radar
      fullMark: Math.max(20, Math.round(data.systemOverview.totalRevenue / 100000)),
    },
  ];

  // User Demographics Bar Chart
  const demographicsData = [
    { category: 'Male', count: data.userStatistics.demographics.usersByGender?.Male ?? 0 },
    { category: 'Female', count: data.userStatistics.demographics.usersByGender?.Female ?? 0 },
    {
      category: 'Age 18-24',
      count: data.userStatistics.demographics.usersByAgeGroup?.['18-24'] ?? 0,
    },
    {
      category: 'Age 25-34',
      count: data.userStatistics.demographics.usersByAgeGroup?.['25-34'] ?? 0,
    },
  ];

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  // Custom tooltip cho revenue
  const CustomRevenueTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-semibold">{`Period: ${label}`}</p>
          <p className="text-blue-600">{`Revenue: ${payload[0]?.value?.toLocaleString(
            'vi-VN'
          )}₫`}</p>
          <p className="text-green-600">{`Tickets: ${payload[1]?.value}`}</p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip cho Bar Chart
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow">
          <div className="font-semibold">{label}</div>
          <div>{`Count: ${payload[0]?.value}`}</div>
          <div>{`Percentage: ${payload[1]?.value}%`}</div>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip cho Pie Chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow">
          <div className="font-semibold">{d.name}</div>
          <div>{`Events: ${d.value}`}</div>
          <div>{`Revenue: ${d.revenue?.toLocaleString('vi-VN')}₫`}</div>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip cho Area Chart
  const CustomAreaTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow">
          <div className="font-semibold">{label}</div>
          <div>{`New Users: ${payload[0]?.value}`}</div>
          <div>{`Total Users: ${payload[1]?.value}`}</div>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip cho Radar Chart
  const CustomRadarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow">
          <div className="font-semibold">{d.metric}</div>
          <div>{`Value: ${d.value}`}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 min-h-screen">
      <AnimatePresence>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 justify-center"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.5 }}
        >
          {/* User Overview */}
          <motion.div
            className={cardClass}
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
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
          </motion.div>
          {/* Event Overview */}
          <motion.div
            className={cardClass}
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
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
          </motion.div>
          {/* Financial Overview */}
          <motion.div
            className={cardClass}
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
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
          </motion.div>
          {/* Tickets Sold Overview */}
          <motion.div
            className={cardClass}
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
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
          </motion.div>
        </motion.div>
      </AnimatePresence>
      {/* Chart section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        {/* Line Chart: Revenue & Tickets Sold */}
        <motion.div
          className="bg-white rounded-xl shadow border p-6"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="mb-4 text-lg font-semibold text-gray-700">
            Revenue & Tickets Sold Over Time
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip content={CustomRevenueTooltip} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#f59e42" name="Revenue (VND)" />
              <Line type="monotone" dataKey="ticketsSold" stroke="#6366f1" name="Tickets Sold" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
        {/* Bar Chart: Events by Status */}
        <motion.div
          className="bg-white rounded-xl shadow border p-6"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="mb-4 text-lg font-semibold text-gray-700">Events by Status</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={eventStatusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip content={CustomBarTooltip} />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" name="Count" />
              <Bar dataKey="percentage" fill="#82ca9d" name="Percentage" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
        {/* Area Chart: User Growth */}
        <motion.div
          className="bg-white rounded-xl shadow border p-6"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="mb-4 text-lg font-semibold text-gray-700">User Growth Over Time</div>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip content={CustomAreaTooltip} />
              <Legend />
              <Area
                type="monotone"
                dataKey="newUsers"
                stackId="1"
                stroke="#8884d8"
                fill="#8884d8"
                name="New Users"
              />
              <Area
                type="monotone"
                dataKey="totalUsers"
                stackId="1"
                stroke="#82ca9d"
                fill="#82ca9d"
                name="Total Users"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
        {/* Pie Chart: Events by Category */}
        <motion.div
          className="bg-white rounded-xl shadow border p-6"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="mb-4 text-lg font-semibold text-gray-700">Events by Category</div>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label
              >
                {categoryData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={CustomPieTooltip} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
        {/* Radar Chart: System Overview */}
        <motion.div
          className="bg-white rounded-xl shadow border p-6 col-span-1 md:col-span-2"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <div className="mb-4 text-lg font-semibold text-gray-700">System Overview Radar</div>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={systemOverviewData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} />
              <Radar
                name="Value"
                dataKey="value"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
              <Tooltip content={CustomRadarTooltip} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
        {/* Bar Chart: User Demographics */}
        <motion.div
          className="bg-white rounded-xl shadow border p-6"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <div className="mb-4 text-lg font-semibold text-gray-700">User Demographics</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={demographicsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#00C49F" name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
};
