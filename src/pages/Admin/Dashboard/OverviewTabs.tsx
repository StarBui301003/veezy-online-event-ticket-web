import { useEffect, useState } from 'react';
import type {
  AdminOverviewRealtimeData,
  AdminOverviewRealtimeResponse,
} from '@/types/Admin/dashboard';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import { toast } from 'react-toastify';
import { AdminNotificationList } from './AdminNotificationList';
import { getAdminOverviewDashboard } from '@/services/Admin/dashboard.service';
import { RadialBarChart, RadialBar, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock } from 'lucide-react';

const cardClass =
  'w-full min-w-[180px] max-w-[220px] bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4 flex flex-col justify-between';

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
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">System Metrics Overview</h3>
          <p className="text-sm text-gray-500">Key metrics requiring attention</p>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-500" />
          <span className="text-sm font-medium text-gray-600">{metrics.length} metrics</span>
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
        <h4 className="font-semibold text-sm text-gray-700 mb-3">Quick Actions</h4>
        <div className="grid grid-cols-1 gap-2">
          {metrics.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}></div>
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
  );
}

export const OverviewTabs = () => {
  const [data, setData] = useState<AdminOverviewRealtimeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAdminOverviewDashboard()
      .then((res: AdminOverviewRealtimeResponse) => setData(res.data))
      .catch(() => {
        toast.error('Unable to load dashboard data. Please try again later.');
        setData(null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <SpinnerOverlay show />;
  if (!data)
    return (
      <div className="flex justify-center items-center h-40 text-lg text-red-500">
        Failed to load dashboard data.
      </div>
    );

  return (
    <div className="flex flex-col gap-8 w-full p-2">
      {/* 5 card tổng quan */}
      <div className="flex flex-row flex-wrap gap-4 items-stretch justify-between w-full">
        <div className={cardClass}>
          <div className="text-gray-500 font-medium">Users</div>
          <div className="text-2xl font-bold text-gray-800">{data.totalUsers.toLocaleString()}</div>
          <div className="text-xs text-gray-500">
            Active: {data.activeUsers?.toLocaleString?.() ?? 0}
          </div>
        </div>
        <div className={cardClass}>
          <div className="text-gray-500 font-medium">Events</div>
          <div className="text-2xl font-bold text-gray-800">
            {data.totalEvents.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">Active: {data.activeEvents}</div>
        </div>
        <div className={cardClass}>
          <div className="text-gray-500 font-medium">News</div>
          <div className="text-2xl font-bold text-gray-800">
            {data.totalNews?.toLocaleString?.() ?? 0}
          </div>
          <div className="text-xs text-gray-500">Active: {data.activeNews ?? 0}</div>
        </div>
        <div className={cardClass}>
          <div className="text-gray-500 font-medium">Tickets Sold</div>
          <div className="text-2xl font-bold text-gray-800">
            {data.totalTicketsSold?.toLocaleString?.() ?? 0}
          </div>
          <div className="text-xs text-gray-500">
            Total tickets: {data.totalTickets?.toLocaleString?.() ?? 0}
          </div>
        </div>
        <div className={cardClass}>
          <div className="text-gray-500 font-medium">Revenue</div>
          <div className="text-2xl font-bold text-gray-800">
            {data.totalRevenue?.toLocaleString?.('vi-VN') ?? 0}₫
          </div>
          <div className="text-xs text-gray-500">
            Platform: {data.platformRevenue?.toLocaleString?.('vi-VN') ?? 0}₫
          </div>
        </div>
      </div>
      {/* Metrics Panel + Admin Notification nằm cạnh nhau, cùng chiều cao */}
      <div className="flex flex-col md:flex-row gap-8 ">
        <div className="flex-1 h-full flex flex-col">
          <AdminMetricsPanel data={data} />
        </div>
        <div className="flex-1 h-full flex flex-col">
          <AdminNotificationList className="bg-white" />
        </div>
      </div>
    </div>
  );
};
