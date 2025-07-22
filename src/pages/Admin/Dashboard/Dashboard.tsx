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
  RadialBarChart,
  RadialBar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import { toast } from 'react-toastify';
// Import for animations
import { motion, AnimatePresence } from 'framer-motion';
import { AdminNotificationList } from '@/pages/Admin/Dashboard/AdminNotificationList';
import { getAdminUnreadCount, getAdminNotifications } from '@/services/Admin/notification.service';
import { AdminNotificationType } from '@/types/Admin/notification';
import { Bell, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Function to map event status number to meaningful names
const getEventStatusName = (status: number, t: (key: string) => string): string => {
  const statusMap: { [key: number]: string } = {
    0: t('draft'),
    1: t('pendingApproval'),
    2: t('approved'),
    3: t('rejected'),
    4: t('active'),
    5: t('completed'),
    6: t('cancelled'),
    7: t('postponed'),
  };
  return statusMap[status] || `${t('unknownStatus')} ${status}`;
};

const cardClass =
  'w-full min-w-[250px] max-w-[300px] bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6 flex flex-col justify-between h-[140px]';

export const Dashboard = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationStats, setNotificationStats] = useState({
    totalUnread: 0,
    newEvents: 0,
    newReports: 0,
    pendingApprovals: 0,
  });

  useEffect(() => {
    setLoading(true);
    getAdminDashboard()
      .then((res) => setData(res.data))
      .catch(() => {
        toast.error(t('unableToLoadDashboardData'));
        setData(null);
      })
      .finally(() => setLoading(false));

    // Fetch notification statistics
    const fetchNotificationStats = async () => {
      try {
        // Get total unread count
        const totalUnreadResponse = await getAdminUnreadCount();

        // Get all notifications to calculate stats by type
        const notificationsResponse = await getAdminNotifications(1, 100, false); // Get first 100 unread notifications

        let newEvents = 0;
        let newReports = 0;
        let pendingApprovals = 0;

        if (notificationsResponse.flag && notificationsResponse.data) {
          notificationsResponse.data.forEach((notification) => {
            switch (notification.type) {
              case AdminNotificationType.NewEvent:
                newEvents++;
                break;
              case AdminNotificationType.NewReport:
                newReports++;
                break;
              case AdminNotificationType.EventApproval:
                pendingApprovals++;
                break;
            }
          });
        }

        setNotificationStats({
          totalUnread: totalUnreadResponse.data || 0,
          newEvents,
          newReports,
          pendingApprovals,
        });
      } catch (error) {
        console.error('Failed to fetch notification stats:', error);
      }
    };

    fetchNotificationStats();
  }, []);

  const handleUnreadCountChange = (count: number) => {
    setNotificationStats((prev) => ({
      ...prev,
      totalUnread: count,
    }));
  };

  // Show spinner overlay when loading dashboard data or notifications
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

  // Prepare data for charts
  const chartData =
    data.financialOverview.revenueTimeline?.map((item) => ({
      period: item.periodLabel,
      revenue: item.revenue,
      ticketsSold: item.transactionCount,
    })) || [];

  // Bar Chart - Events by Status
  const eventStatusData = data.eventStatistics.eventsByStatus.map((item) => ({
    status: getEventStatusName(item.status, t),
    count: item.count,
    percentage: item.percentage,
  }));

  // Area Chart - User Growth
  const userGrowthData =
    data.userStatistics.growth.growthChart?.map((item) => ({
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

  // Platform Health Radar Chart - comprehensive platform health metrics (0-100 scale)
  const platformHealthData = [
    {
      metric: 'User Engagement',
      value: Math.min(
        100,
        (data.userStatistics.activity.monthlyActiveUsers /
          Math.max(data.systemOverview.totalUsers, 1)) *
          100
      ),
      fullMark: 100,
    },
    {
      metric: 'Event Success',
      value: Math.min(
        100,
        data.systemOverview.totalEvents > 0
          ? (data.systemOverview.completedEvents / data.systemOverview.totalEvents) * 100
          : 0
      ),
      fullMark: 100,
    },
    {
      metric: 'Revenue Performance',
      value: Math.min(
        100,
        data.financialOverview.monthRevenue > 0
          ? Math.min(100, (data.financialOverview.monthRevenue / 10000000) * 100) // 10M VND = 100%
          : 0
      ),
      fullMark: 100,
    },
    {
      metric: 'Approval Efficiency',
      value: Math.min(
        100,
        data.eventStatistics.approvalMetrics.averageApprovalTimeHours > 0
          ? Math.max(
              0,
              100 - (data.eventStatistics.approvalMetrics.averageApprovalTimeHours / 48) * 100
            )
          : 85
      ),
      fullMark: 100,
    },
    {
      metric: 'Content Quality',
      value: Math.min(100, data.newsStatistics.approvalMetrics.approvalRate || 75),
      fullMark: 100,
    },
    {
      metric: 'Platform Growth',
      value: Math.min(100, Math.max(0, (data.systemOverview.growth.revenueGrowth ?? 0) + 50)),
      fullMark: 100,
    },
  ];

  // Admin Management Radial Chart - key metrics for admin management
  const adminManagementData = [
    {
      name: 'Event Approvals',
      value: data.systemOverview.pendingEventApprovals || 0,
      total: data.systemOverview.totalEvents || 0,
      fill: '#FF6B6B',
      description: `${data.systemOverview.pendingEventApprovals || 0} pending approvals : ${
        data.systemOverview.pendingEventApprovals || 0
      }/${data.systemOverview.totalEvents || 0}`,
    },
    {
      name: 'Active Events',
      value: data.systemOverview.activeEvents || 0,
      total: data.systemOverview.totalEvents || 0,
      fill: '#4ECDC4',
      description: `${data.systemOverview.activeEvents || 0} events currently running : ${
        data.systemOverview.activeEvents || 0
      }/${data.systemOverview.totalEvents || 0}`,
    },
    {
      name: 'Monthly Active Users',
      value: data.userStatistics.activity.monthlyActiveUsers || 0,
      total: data.systemOverview.totalUsers || 0,
      fill: '#45B7D1',
      description: `${data.userStatistics.activity.monthlyActiveUsers || 0} users active : ${
        data.userStatistics.activity.monthlyActiveUsers || 0
      }/${data.systemOverview.totalUsers || 0}`,
    },
    {
      name: 'Withdrawal Requests',
      value: data.financialOverview.withdrawalStats.pendingRequests || 0,
      total: data.financialOverview.withdrawalStats.totalRequests || 0,
      fill: '#FFA726',
      description: `${
        data.financialOverview.withdrawalStats.pendingRequests || 0
      } pending withdrawals : ${data.financialOverview.withdrawalStats.pendingRequests || 0}/${
        data.financialOverview.withdrawalStats.totalRequests || 0
      }`,
    },
    {
      name: 'News Pending',
      value: data.newsStatistics.overview.pendingNews || 0,
      total: data.newsStatistics.overview.totalNews || 0,
      fill: '#AB47BC',
      description: `${data.newsStatistics.overview.pendingNews || 0} news awaiting approval : ${
        data.newsStatistics.overview.pendingNews || 0
      }/${data.newsStatistics.overview.totalNews || 0}`,
    },
  ];

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  // Custom tooltip for revenue
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

  // Custom tooltip for Bar Chart
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

  // Custom tooltip for Pie Chart
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

  // Custom tooltip for Area Chart
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

  // Custom tooltip for Radial Chart
  const CustomRadialTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const description = data.description || 'Unknown';
      // Remove debug info, value at start, and format properly
      const cleanDescription = description
        .replace(/value\s*:\s*\d+\s*/, '')
        .replace(/^\d+\s+/, '') // Remove value at the beginning
        .replace(/\d+\/\d+\s*$/, '') // Remove ratio at the end
        .trim();

      return (
        <div
          style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '8px',
            fontSize: '12px',
          }}
        >
          <p>{`${cleanDescription} ${data.value}/${data.total}`}</p>
        </div>
      );
    }
    return null;
  };
  return (
    <div className="p-6 min-h-screen">
      {/* Main dashboard container */}
      <div className="max-w-7xl mx-auto">
        {/* Header Section with 4 key metrics */}
        <div className="mb-8">
          <AnimatePresence>
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 place-items-center"
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
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      (data.systemOverview.growth.usersGrowth ?? 0) === 100
                        ? 'bg-blue-100 text-blue-700'
                        : (data.systemOverview.growth.usersGrowth ?? 0) >= 0
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {(data.systemOverview.growth.usersGrowth ?? 0) === 100
                      ? 'New'
                      : `${(data.systemOverview.growth.usersGrowth ?? 0) >= 0 ? '+' : ''}${
                          data.systemOverview.growth.usersGrowth ?? 0
                        }%`}
                  </span>
                </div>
                <div className="text-3xl font-bold text-gray-800 mb-1">
                  {data.systemOverview.totalUsers.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 font-semibold">
                  Active: {data.userStatistics.activity.monthlyActiveUsers.toLocaleString()}
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
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      (data.systemOverview.growth.eventsGrowth ?? 0) === 100
                        ? 'bg-blue-100 text-blue-700'
                        : (data.systemOverview.growth.eventsGrowth ?? 0) >= 0
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {(data.systemOverview.growth.eventsGrowth ?? 0) === 100
                      ? 'New'
                      : `${(data.systemOverview.growth.eventsGrowth ?? 0) >= 0 ? '+' : ''}${
                          data.systemOverview.growth.eventsGrowth ?? 0
                        }%`}
                  </span>
                </div>
                <div className="text-3xl font-bold text-gray-800 mb-1">
                  {data.systemOverview.totalEvents.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 font-semibold">
                  Completed: {data.systemOverview.completedEvents}
                </div>
                <div className="text-xs text-gray-400">
                  Active: {data.systemOverview.activeEvents}
                </div>
              </motion.div>
              {/* Financial Overview */}
              <motion.div
                className={cardClass}
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500 font-medium">Revenue</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      (data.systemOverview.growth.revenueGrowth ?? 0) === 100
                        ? 'bg-blue-100 text-blue-700'
                        : (data.systemOverview.growth.revenueGrowth ?? 0) >= 0
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {(data.systemOverview.growth.revenueGrowth ?? 0) === 100
                      ? 'New'
                      : `${(data.systemOverview.growth.revenueGrowth ?? 0) >= 0 ? '+' : ''}${
                          data.systemOverview.growth.revenueGrowth ?? 0
                        }%`}
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
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      (data.systemOverview.growth.ticketsGrowth ?? 0) === 100
                        ? 'bg-blue-100 text-blue-700'
                        : (data.systemOverview.growth.ticketsGrowth ?? 0) >= 0
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {(data.systemOverview.growth.ticketsGrowth ?? 0) === 100
                      ? 'New'
                      : `${(data.systemOverview.growth.ticketsGrowth ?? 0) >= 0 ? '+' : ''}${
                          data.systemOverview.growth.ticketsGrowth ?? 0
                        }%`}
                  </span>
                </div>
                <div className="text-3xl font-bold text-gray-800 mb-1">
                  {data.systemOverview.totalTicketsSold.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 font-semibold">
                  Total tickets sold in system
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Notifications and Tasks Section - Combined in same row */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Admin Tasks Overview Panel */}
            <motion.div
              className="bg-white rounded-xl shadow-lg border border-gray-100"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 }}
            >
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{t('systemMetricsOverview')}</h3>
                    <p className="text-sm text-gray-500">{t('keyMetricsAttention')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                    <span className="text-sm font-medium text-gray-600">
                      {adminManagementData.length} metrics
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <ResponsiveContainer width="100%" height={280}>
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="20%"
                    outerRadius="70%"
                    data={adminManagementData}
                    startAngle={-90}
                    endAngle={380}
                  >
                    <RadialBar
                      label={{
                        position: 'insideStart',
                        fill: '#fff',
                        fontSize: 10,
                        fontWeight: 'bold',
                      }}
                      background={{ fill: '#f3f4f6' }}
                      dataKey="value"
                      cornerRadius={4}
                    />
                    <Tooltip content={<CustomRadialTooltip />} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="mt-6 space-y-3">
                  <h4 className="font-semibold text-sm text-gray-700 mb-3">{t('quickActions')}</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {adminManagementData.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.fill }}
                          ></div>
                          <span className="font-medium text-gray-800 text-sm">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-gray-900">{item.value}</span>
                          <span className="text-xs text-gray-500 ml-1">/ {item.total}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Notifications Panel */}
            <motion.div
              className="bg-white rounded-xl shadow-lg border border-gray-100"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{t('recentNotifications')}</h3>
                    <p className="text-sm text-gray-500">{t('systemAlertsUpdates')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-blue-500" />
                    <span className="text-sm font-medium text-gray-600">
                      {notificationStats.totalUnread} unread
                    </span>
                  </div>
                </div>
              </div>
              <div className="h-[620px] overflow-hidden">
                <AdminNotificationList
                  className="border-0 shadow-none h-full"
                  onUnreadCountChange={handleUnreadCountChange}
                />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Chart section */}
        <div className="space-y-6 mt-8">
          {/* Row 1: Revenue & Tickets Sold - Full width */}
          <motion.div
            className="bg-white rounded-xl shadow-lg border border-gray-100 p-6"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">{t('revenueTicketsSold')}</h3>
              <p className="text-sm text-gray-500">{t('performanceTrends')}</p>
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

          {/* Row 2: User Growth - Full width */}
          <motion.div
            className="bg-white rounded-xl shadow-lg border border-gray-100 p-6"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">{t('userGrowth')}</h3>
              <p className="text-sm text-gray-500">{t('newTotalUserTrends')}</p>
            </div>
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

          {/* Row 3: Events by Status (2/3) + User Demographics (1/3) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Events by Status - 2/3 width */}
            <motion.div
              className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-gray-100 p-6"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{t('eventsByStatus')}</h3>
                <p className="text-sm text-gray-500">
                  {t('distributionEventsAcrossStatuses')}
                </p>
              </div>
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

            {/* User Demographics - 1/3 width */}
            <motion.div
              className="bg-white rounded-xl shadow-lg border border-gray-100 p-6"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{t('userDemographics')}</h3>
                <p className="text-sm text-gray-500">
                  {t('breakdownUserDemographics')}
                </p>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={demographicsData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="category" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" fill="#10b981" name="Count" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Row 4: Events by Category + Platform Health Overview - Equal width */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart: Events by Category */}
            <motion.div
              className="bg-white rounded-xl shadow-lg border border-gray-100 p-6"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{t('eventsByCategory')}</h3>
                <p className="text-sm text-gray-500">{t('breakdownEventsByCategories')}</p>
              </div>
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

            {/* Radar Chart: Platform Health Overview */}
            <motion.div
              className="bg-white rounded-xl shadow-lg border border-gray-100 p-6"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
            >
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{t('platformHealthOverview')}</h3>
                <p className="text-sm text-gray-500">
                  {t('comprehensiveHealthMetrics')}
                </p>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={platformHealthData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="metric" className="text-xs font-medium" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                  <Radar
                    name="Health Score"
                    dataKey="value"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.2}
                    strokeWidth={3}
                  />
                  <Tooltip
                    formatter={(value: any) => [`${Math.round(value)}%`, 'Health Score']}
                    labelFormatter={(label: string) => `${label}`}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
