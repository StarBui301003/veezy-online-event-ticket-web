/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { getEventAnalytics } from '@/services/Admin/dashboard.service';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  BarChart,
  Bar,
  Legend,
  Cell,
} from 'recharts';
import { connectAnalyticsHub, onAnalytics, offAnalytics } from '@/services/signalr.service';
import type {
  EventApprovalTrendItem,
  EventByCategory,
  EventTopPerformingEvent,
  AdminEventAnalyticsResponse,
} from '@/types/Admin/dashboard';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { RingLoader } from 'react-spinners';
import { toast } from 'react-toastify';

const FILTERS = [
  { label: 'Last 30 Days', value: 12 }, // Last30Days
  { label: 'This Week', value: 3 }, // ThisWeek
  { label: 'This Month', value: 5 }, // ThisMonth
  { label: 'This Year', value: 9 }, // ThisYear
  { label: 'All Time', value: 15 }, // AllTime
  { label: 'Custom', value: 16 }, // Custom
];

// PieChart colors
const PIE_COLORS = ['#fbbf24', '#a78bfa', '#f472b6', '#34d399', '#60a5fa', '#f59e42'];

export default function EventTabs() {
  const [filter, setFilter] = useState<string>('12'); // Last 30 Days mặc định
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [approvalTrend, setApprovalTrend] = useState<EventApprovalTrendItem[]>([]);
  const [eventsByCategory, setEventsByCategory] = useState<EventByCategory[]>([]);
  const [topEvents, setTopEvents] = useState<EventTopPerformingEvent[]>([]);
  const [loading, setLoading] = useState(false);

  // Real-time data reload function
  const reloadData = () => {
    if (filter === '16') {
      if (!startDate || !endDate) {
        if (startDate || endDate) {
          toast.warn('Please select both start and end date!');
        }
        return;
      }
      if (endDate < startDate) {
        toast.error('End date must be after start date!');
        return;
      }
    }
    setLoading(true);
    const params: Record<string, unknown> = {};
    if (filter === '16') {
      params.period = 16;
      params.customStartDate = startDate?.toISOString().slice(0, 10);
      params.customEndDate = endDate?.toISOString().slice(0, 10);
    } else if (filter !== '12') {
      params.period = parseInt(filter, 10);
    }
    getEventAnalytics(params)
      .then((res: AdminEventAnalyticsResponse) => {
        setApprovalTrend(res.data.approvalMetrics.approvalTrend || []);
        setEventsByCategory(res.data.eventsByCategory || []);
        setTopEvents(res.data.topPerformingEvents || []);
      })
      .finally(() => setLoading(false));
  };

  // Connect to AnalyticsHub for real-time updates
  useEffect(() => {
    connectAnalyticsHub('http://localhost:5006/analyticsHub');

    // Handler reference for cleanup
    const handler = (data: any) => {
      if (document.visibilityState === 'visible') {
        if (
          !approvalTrend ||
          JSON.stringify(data.approvalTrend) !== JSON.stringify(approvalTrend) ||
          !eventsByCategory ||
          JSON.stringify(data.eventsByCategory) !== JSON.stringify(eventsByCategory) ||
          !topEvents ||
          JSON.stringify(data.topEvents) !== JSON.stringify(topEvents)
        ) {
          setApprovalTrend(data.approvalTrend);
          setEventsByCategory(data.eventsByCategory);
          setTopEvents(data.topEvents);
        }
      }
    };
    onAnalytics('OnEventAnalytics', handler);

    // Initial data load
    reloadData();

    // Cleanup to avoid duplicate listeners
    return () => {
      offAnalytics('OnEventAnalytics', handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    reloadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, startDate, endDate]);

  return (
    <div className="space-y-6 p-3 min-h-screen">
      <div className="flex gap-4 items-center mb-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="border-gray-200 dark:border-gray-600 w-[180px] border px-3 py-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            <SelectValue placeholder="Select filter" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
            {FILTERS.map((f) => (
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
        {filter === '16' && (
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
              className="border px-3 py-1 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600"
              placeholder="End date"
            />
          </>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-200">Approval Trend</h3>
          {loading ? (
            <div className="flex items-center justify-center h-[260px]">
              <RingLoader size={64} color="#fbbf24" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={approvalTrend} margin={{ top: 16, right: 16, left: 48, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="periodLabel" />
                <YAxis
                  tickFormatter={(v) => {
                    if (!v) return '';
                    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
                    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
                    return v.toString();
                  }}
                />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="approved"
                  stackId="1"
                  stroke="#22c55e"
                  fill="#bbf7d0"
                  name="Approved"
                />
                <Area
                  type="monotone"
                  dataKey="rejected"
                  stackId="1"
                  stroke="#ef4444"
                  fill="#fecaca"
                  name="Rejected"
                />
                <Area
                  type="monotone"
                  dataKey="pending"
                  stackId="1"
                  stroke="#f59e42"
                  fill="#fde68a"
                  name="Pending"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-200">
            Events by Category
          </h3>
          {loading ? (
            <div className="flex items-center justify-center h-[260px]">
              <RingLoader size={64} color="#a78bfa" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={eventsByCategory}
                  dataKey="count"
                  nameKey="categoryName"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {eventsByCategory.map((_entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 col-span-1 md:col-span-2 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-200">
            Top Performing Events
          </h3>
          {loading ? (
            <div className="flex items-center justify-center h-[260px]">
              <RingLoader size={64} color="#60a5fa" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topEvents} margin={{ top: 16, right: 16, left: 48, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="eventName" />
                <YAxis
                  yAxisId="left"
                  tickFormatter={(v) => (v ? `${Number(v).toLocaleString('vi-VN')}₫` : '')}
                  orientation="left"
                />
                <YAxis
                  yAxisId="right"
                  tickFormatter={(v) => (v ? `${Number(v).toLocaleString('vi-VN')}` : '')}
                  orientation="right"
                />
                <Tooltip
                  formatter={(value, name) =>
                    name === 'Revenue'
                      ? `${Number(value).toLocaleString('vi-VN')}₫`
                      : Number(value).toLocaleString('vi-VN')
                  }
                />
                <Legend />
                <Bar dataKey="revenue" fill="#fbbf24" name="Revenue" yAxisId="left" />
                <Bar dataKey="ticketsSold" fill="#60a5fa" name="Tickets Sold" yAxisId="right" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
