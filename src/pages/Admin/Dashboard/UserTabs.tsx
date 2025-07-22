import { useState, useEffect } from 'react';
import { getUserAnalytics } from '@/services/Admin/dashboard.service';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { UserGrowthChartItem, AdminUserAnalyticsResponse } from '@/types/Admin/dashboard';
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

export default function UserTabs() {
  const [filter, setFilter] = useState('month');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [data, setData] = useState<UserGrowthChartItem[]>([]);
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
    getUserAnalytics(params)
      .then((res: AdminUserAnalyticsResponse) => setData(res.data.growth.growthChart || []))
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
      <div className="bg-white rounded-xl shadow p-4">
        <h3 className="font-semibold mb-2">User Growth</h3>
        {loading ? (
          <div className="flex items-center justify-center h-[320px]">
            <RingLoader size={64} color="#60a5fa" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={data} margin={{ top: 16, right: 16, left: 48, bottom: 0 }}>
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
              <Line type="monotone" dataKey="newUsers" stroke="#60a5fa" name="New Users" />
              <Line type="monotone" dataKey="totalUsers" stroke="#fbbf24" name="Total Users" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
