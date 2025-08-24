import { useEffect, useState } from 'react';
import type {
  AdminOverviewRealtimeData,
  AdminOverviewRealtimeResponse,
} from '@/types/Admin/dashboard';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import { toast } from 'react-toastify';
import { AdminNotificationList } from './AdminNotificationList';
import {
  getAdminOverviewDashboard,
  exportAnalyticsToExcel,
} from '@/services/Admin/dashboard.service';
import { RadialBarChart, RadialBar, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, Download } from 'lucide-react';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { PersonalNotificationList } from './PersonalNotificationList';
import { connectAnalyticsHub, onAnalytics } from '@/services/signalr.service';
import { Skeleton } from '@/components/ui/skeleton';
// import { PersonNotificationList } from './PersonNotificationList';

const cardClass =
  'w-full min-w-[180px] max-w-[200px] bg-gradient-to-br from-white/90 to-white/70 dark:from-gray-800/90 dark:to-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 dark:border-gray-700/20 p-4 flex flex-col justify-between';

function CustomRadialTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { name: string; value: number; total: number } }>;
}) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
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
        <p>{`${data.name}: ${data.value}/${data.total}`}</p>
      </div>
    );
  }
  return null;
}

function AdminMetricsPanel({ data }: { data: AdminOverviewRealtimeData }) {
  const metrics = [
    {
      name: 'Event Approvals',
      value: data.pendingEventApprovals,
      total: data.totalEvents,
      fill: '#ef4444',
    },
    {
      name: 'Active Events',
      value: data.activeEvents,
      total: data.totalEvents,
      fill: '#14b8a6',
    },
    {
      name: 'Monthly Active Users',
      value: data.activeUsers,
      total: data.totalUsers,
      fill: '#06b6d4',
    },
    {
      name: 'Withdrawal Requests',
      value: data.pendingWithdrawals,
      total: 0,
      fill: '#f59e42',
    },
    {
      name: 'News Pending',
      value: data.pendingNewsApprovals,
      total: data.totalNews,
      fill: '#a78bfa',
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 flex flex-col h-[700px]">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            System Metrics Overview
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Key metrics requiring attention
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-500" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {metrics.length} metrics
          </span>
        </div>
      </div>
      <div className="flex flex-col items-center my-4">
        <ResponsiveContainer width={220} height={220}>
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="30%"
            outerRadius="90%"
            barSize={18}
            data={metrics}
            startAngle={90}
            endAngle={-270}
          >
            <RadialBar background dataKey="value" cornerRadius={8} />
            <Tooltip content={<CustomRadialTooltip />} />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-6 space-y-3">
        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">
          Quick Actions
        </h4>
        <div className="grid grid-cols-1 gap-2">
          {metrics.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}></div>
                <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                  {item.name}
                </span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {item.value}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                  / {item.total}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const OVERVIEW_FILTERS = [
  { label: 'Day', value: 0 },
  { label: 'Week', value: 1 },
  { label: 'Month', value: 2 },
  { label: 'Year', value: 3 },
  { label: 'All', value: 4 }, // Mặc định
  { label: 'Custom', value: 5 },
];

export const OverviewTabs = () => {
  const [data, setData] = useState<AdminOverviewRealtimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('4'); // Mặc định All
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [exporting, setExporting] = useState(false);

  // Real-time data reload function
  const reloadData = () => {
    if (filter === '5') {
      if (!startDate || !endDate) return;
      if (endDate < startDate) return;
    }
    setLoading(true);
    const params: Record<string, unknown> = {};
    if (filter === '5') {
      params.period = 5;
      params.customStartDate = startDate?.toISOString().slice(0, 10);
      params.customEndDate = endDate?.toISOString().slice(0, 10);
    } else if (filter !== '4') {
      params.period = parseInt(filter, 10);
    }
    getAdminOverviewDashboard(params)
      .then((res: AdminOverviewRealtimeResponse) => setData(res.data))
      .catch(() => {
        toast.error('Unable to load dashboard data. Please try again later.');
        setData(null);
      })
      .finally(() => setLoading(false));
  };

  // Connect to AnalyticsHub for real-time updates
  useEffect(() => {
    connectAnalyticsHub('https://analytics.vezzy.site/analyticsHub');

    // Listen for real-time analytics updates
    onAnalytics('OnAdminRealtimeOverview', (newData: AdminOverviewRealtimeData) => {
      console.log('📊 Received real-time admin overview data:', newData);
      setData(newData);
    });

    // Initial data load
    reloadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, startDate, endDate]);

  // useEffect(() => {
  //   reloadData();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [filter, startDate, endDate]);

  // Export function
  const handleExportData = async () => {
    try {
      setExporting(true);

      // Prepare filter parameters based on current state
      const filterParams: Record<string, string | number> = {};

      if (filter === '5') {
        if (!startDate || !endDate) {
          toast.error('Please select both start and end dates for custom export');
          return;
        }
        if (endDate < startDate) {
          toast.error('End date must be after start date');
          return;
        }
        filterParams.period = 5;
        filterParams.customStartDate = startDate.toISOString().slice(0, 10);
        filterParams.customEndDate = endDate.toISOString().slice(0, 10);
      } else if (filter !== '4') {
        filterParams.period = parseInt(filter, 10);
      }

      const response = await exportAnalyticsToExcel('all', filterParams);

      if (response.isSuccess) {
        // Create download link
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `admin-analytics-all-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success('Export completed successfully!');
      } else {
        toast.error('Export failed. Please try again.');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <SpinnerOverlay show />;
  if (!data)
    return (
      <div className="flex justify-center items-center h-40 text-lg text-red-500">
        Failed to load dashboard data.
      </div>
    );

  return (
    <div className="space-y-6 p-3  min-h-screen">
      <div className="flex gap-4 items-center justify-between mb-4">
        <div className="flex gap-4 items-center">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="border-gray-200 dark:border-gray-600 w-40 border px-3 py-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
              <SelectValue placeholder="Select filter" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
              {OVERVIEW_FILTERS.map((f) => (
                <SelectItem
                  key={f.value}
                  value={String(f.value)}
                  className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filter === '5' && (
            <>
              <input
                type="date"
                value={startDate ? startDate.toISOString().slice(0, 10) : ''}
                onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                className="border px-3 py-1 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600"
                placeholder="Start date"
              />
              <input
                type="date"
                value={endDate ? endDate.toISOString().slice(0, 10) : ''}
                onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                className="border px-3 py-1  rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600"
                placeholder="End date"
              />
            </>
          )}
        </div>
        <button
          type="button"
          disabled={exporting}
          className="flex gap-2 items-center border-2 border-green-500 bg-green-500 rounded-[0.9em] cursor-pointer px-5 py-1 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-green-600 hover:text-white hover:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleExportData}
        >
          <Download className="w-4 h-4" />
          {exporting ? 'Exporting...' : 'Export Data'}
        </button>
      </div>
      {/* 5 card tổng quan */}
      <div className="flex flex-row flex-wrap gap-4 items-stretch justify-between w-full">
        {loading ? (
          <>
            <div className={cardClass}>
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-8 w-16" />
            </div>
            <div className={cardClass}>
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-8 w-16" />
            </div>
            <div className={cardClass}>
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-8 w-16" />
            </div>
            <div className={cardClass}>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </div>
            <div className={cardClass}>
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-8 w-20" />
            </div>
          </>
        ) : (
          <>
            <div className={cardClass}>
              <div className="text-gray-500 dark:text-gray-400 font-medium">Users</div>
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {data.totalUsers.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Active: {data.activeUsers?.toLocaleString?.() ?? 0}
              </div>
            </div>
            <div className={cardClass}>
              <div className="text-gray-500 dark:text-gray-400 font-medium">Events</div>
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {data.totalEvents.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Active: {data.activeEvents}
              </div>
            </div>
            <div className={cardClass}>
              <div className="text-gray-500 dark:text-gray-400 font-medium">News</div>
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {data.totalNews?.toLocaleString?.() ?? 0}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Active: {data.activeNews ?? 0}
              </div>
            </div>
            <div className={cardClass}>
              <div className="text-gray-500 dark:text-gray-400 font-medium">Tickets Sold</div>
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {data.totalTicketsSold?.toLocaleString?.() ?? 0}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Total tickets: {data.totalTickets?.toLocaleString?.() ?? 0}
              </div>
            </div>
            <div className={cardClass}>
              <div className="text-gray-500 dark:text-gray-400 font-medium">Revenue</div>
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {data.totalRevenue?.toLocaleString?.('vi-VN') ?? 0}₫
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Platform: {data.platformRevenue?.toLocaleString?.('vi-VN') ?? 0}₫
              </div>
            </div>
          </>
        )}
      </div>
      {/* Metrics Panel + Admin Notification: Metrics ở trên, Notifications ở dưới, notifications w-full */}
      <div className="flex flex-col gap-8">
        <div className="flex gap-8">
          <div className="flex-1 flex flex-col">
            <AdminMetricsPanel data={data} />
          </div>
          <div className="flex-1 flex flex-col">
            <PersonalNotificationList className="bg-white" />
          </div>
        </div>
        <div className="w-full">
          <AdminNotificationList className="bg-white dark:bg-gray-800 w-full" />
        </div>
      </div>
    </div>
  );
};
