/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react';
import { getNewAnalytics } from '@/services/Admin/dashboard.service';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
} from 'recharts';
import { connectAnalyticsHub, onAnalytics } from '@/services/signalr.service';
import type {
  NewsApprovalTrendItem,
  NewsByEvent,
  NewsByAuthor,
  AdminNewsAnalyticsResponse,
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

// Custom Tooltip cho Approval Trend
function CustomApprovalTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: NewsApprovalTrendItem }>;
}) {
  if (active && payload && payload.length && payload[0] && payload[0].payload) {
    const data = payload[0].payload;
    return (
      <div
        style={{
          background: 'white',
          border: '1px solid #eee',
          borderRadius: 8,
          padding: 8,
          minWidth: 120,
        }}
      >
        <div style={{ fontWeight: 600 }}>{data.periodLabel}</div>
        <div style={{ color: '#22c55e' }}>Approved: {data.approved}</div>
        <div style={{ color: '#ef4444' }}>Rejected: {data.rejected}</div>
        <div style={{ color: '#f59e42' }}>Pending: {data.pending}</div>
      </div>
    );
  }
  return null;
}

// Custom Tooltip cho Approval Trend (RadialBarChart)
function CustomRadialTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { name: string; value: number; fill: string } }>;
}) {
  if (active && payload && payload.length && payload[0] && payload[0].payload) {
    const data = payload[0].payload;
    return (
      <div
        style={{
          background: 'white',
          border: '1px solid #eee',
          borderRadius: 8,
          padding: 8,
          minWidth: 100,
          fontSize: 13,
          color: data.fill,
        }}
      >
        <b>{data.name}</b>: {data.value}
      </div>
    );
  }
  return null;
}

export default function NewsTabs() {
  const [filter, setFilter] = useState<string>('12'); // Last 30 Days mặc định
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [approvalTrend, setApprovalTrend] = useState<NewsApprovalTrendItem[]>([]);
  const [newsByEvent, setNewsByEvent] = useState<NewsByEvent[]>([]);
  const [newsByAuthor, setNewsByAuthor] = useState<NewsByAuthor[]>([]);
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
    getNewAnalytics(params)
      .then((res: AdminNewsAnalyticsResponse) => {
        setApprovalTrend(res.data.approvalMetrics.approvalTrend || []);
        setNewsByEvent(res.data.newsByEvent || []);
        setNewsByAuthor(res.data.newsByAuthor || []);
      })
      .finally(() => setLoading(false));
  };

  // Connect to AnalyticsHub for real-time updates
  useEffect(() => {
    connectAnalyticsHub('http://localhost:5006/analyticsHub');
    
    // Listen for real-time news analytics updates
    onAnalytics('OnNewsAnalytics', (data: any) => {
      console.log('📰 Received real-time news analytics:', data);
      reloadData();
    });

    // Initial data load
    reloadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    reloadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, startDate, endDate]);

  return (
    <div className="space-y-6 p-3">
      <div className="flex gap-4 items-center mb-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="border-gray-200 w-40 border px-3 py-2 rounded">
            <SelectValue placeholder="Select filter" />
          </SelectTrigger>
          <SelectContent>
            {FILTERS.map((f) => (
              <SelectItem key={f.value} value={String(f.value)}>
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
              className="border px-3 py-1 rounded"
              placeholder="Start date"
            />
            <input
              type="date"
              value={endDate ? endDate.toISOString().slice(0, 10) : ''}
              onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
              className="border px-3 py-1 rounded"
              placeholder="End date"
            />
          </>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold mb-2">Approval Trend</h3>
          {loading ? (
            <div className="flex items-center justify-center h-[260px]">
              <RingLoader size={64} color="#fbbf24" />
            </div>
          ) : approvalTrend.length === 1 ? (
            <div className="flex flex-row items-center justify-center h-[260px] gap-6">
              {/* Chart bên trái */}
              <RadialBarChart
                width={180}
                height={180}
                cx="50%"
                cy="50%"
                innerRadius="30%"
                outerRadius="90%"
                barSize={18}
                data={[
                  { name: 'Approved', value: approvalTrend[0]?.approved ?? 0, fill: '#22c55e' },
                  { name: 'Pending', value: approvalTrend[0]?.pending ?? 0, fill: '#f59e42' },
                  { name: 'Rejected', value: approvalTrend[0]?.rejected ?? 0, fill: '#ef4444' },
                ]}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar
                  background
                  dataKey="value"
                  label={{ position: 'inside', fill: '#333', fontSize: 12 }}
                />
                <Tooltip content={<CustomRadialTooltip />} />
              </RadialBarChart>
              {/* Legend bên phải, tách biệt */}
              <div className="flex flex-col gap-2 ml-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: '#22c55e' }}></span>{' '}
                  <span>Approved</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: '#f59e42' }}></span>{' '}
                  <span>Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: '#ef4444' }}></span>{' '}
                  <span>Rejected</span>
                </div>
              </div>
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
                <Tooltip content={<CustomApprovalTooltip />} />
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
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold mb-2">News by Event</h3>
          {loading ? (
            <div className="flex items-center justify-center h-[260px]">
              <RingLoader size={64} color="#60a5fa" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={newsByEvent} margin={{ top: 16, right: 16, left: 48, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="eventName" />
                <YAxis tickFormatter={(v) => (v ? `${Number(v).toLocaleString('vi-VN')}` : '')} />
                <Tooltip />
                <Bar dataKey="count" fill="#60a5fa" name="News Count" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="bg-white rounded-xl shadow p-4 col-span-1 md:col-span-2">
          <h3 className="font-semibold mb-2">News by Author</h3>
          {loading ? (
            <div className="flex items-center justify-center h-[260px]">
              <RingLoader size={64} color="#a78bfa" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={newsByAuthor}>
                <PolarGrid />
                <PolarAngleAxis dataKey="authorName" />
                <PolarRadiusAxis />
                <Radar
                  name="News"
                  dataKey="count"
                  stroke="#a78bfa"
                  fill="#a78bfa"
                  fillOpacity={0.6}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
