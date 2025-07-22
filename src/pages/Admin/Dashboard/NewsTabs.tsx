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
} from 'recharts';
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

const FILTERS = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
  { label: 'All', value: 'all' },
  { label: 'Custom', value: '16' },
];

export default function NewsTabs() {
  const [filter, setFilter] = useState('month');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [approvalTrend, setApprovalTrend] = useState<NewsApprovalTrendItem[]>([]);
  const [newsByEvent, setNewsByEvent] = useState<NewsByEvent[]>([]);
  const [newsByAuthor, setNewsByAuthor] = useState<NewsByAuthor[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, unknown> = {};
    if (filter === '16') {
      params.filter = 'custom';
      if (startDate && endDate) {
        params.startDate = startDate.toISOString().slice(0, 10);
        params.endDate = endDate.toISOString().slice(0, 10);
      }
    } else {
      params.filter = filter;
    }
    getNewAnalytics(params)
      .then((res: AdminNewsAnalyticsResponse) => {
        setApprovalTrend(res.data.approvalMetrics.approvalTrend || []);
        setNewsByEvent(res.data.newsByEvent || []);
        setNewsByAuthor(res.data.newsByAuthor || []);
      })
      .finally(() => setLoading(false));
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
              <SelectItem key={f.value} value={f.value}>
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
              className="border px-3 py-2 rounded"
              placeholder="Start date"
            />
            <input
              type="date"
              value={endDate ? endDate.toISOString().slice(0, 10) : ''}
              onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
              className="border px-3 py-2 rounded"
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
                <Tooltip
                  formatter={(value, name, props) => {
                    if (name === 'approved' || name === 'rejected' || name === 'pending') {
                      return [`${Number(value).toLocaleString('vi-VN')}₫`, ''];
                    }
                    return [value, ''];
                  }}
                />
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
