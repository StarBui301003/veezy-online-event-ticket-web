import { useState, useEffect } from 'react';
import { getFinancialAnalytics } from '@/services/Admin/dashboard.service';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Legend,
  Cell,
} from 'recharts';
import type {
  FinancialRevenueTimelineItem,
  FinancialTopEventByRevenue,
  FinancialPlatformFees,
  AdminFinancialAnalyticsResponse,
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

export default function FinancialTabs() {
  const [filter, setFilter] = useState('month');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [revenueTimeline, setRevenueTimeline] = useState<FinancialRevenueTimelineItem[]>([]);
  const [topEvents, setTopEvents] = useState<FinancialTopEventByRevenue[]>([]);
  const [platformFees, setPlatformFees] = useState<FinancialPlatformFees['topContributingEvents']>(
    []
  );
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
    getFinancialAnalytics(params)
      .then((res: AdminFinancialAnalyticsResponse) => {
        setRevenueTimeline(res.data.revenueTimeline || []);
        setTopEvents(res.data.topEventsByRevenue || []);
        setPlatformFees(res.data.platformFees?.topContributingEvents || []);
      })
      .finally(() => setLoading(false));
  }, [filter, startDate, endDate]);

  // PieChart colors
  const PIE_COLORS = ['#fbbf24', '#a78bfa', '#f472b6', '#34d399', '#60a5fa', '#f59e42'];

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
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold mb-2">Revenue Timeline</h3>
          {loading ? (
            <div className="flex items-center justify-center h-[260px]">
              <RingLoader size={64} color="#fbbf24" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart
                data={revenueTimeline}
                margin={{ top: 16, right: 16, left: 48, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="periodLabel" />
                <YAxis tickFormatter={(v) => (v ? `${Number(v).toLocaleString('vi-VN')}₫` : '')} />
                <Tooltip
                  formatter={(value, name) =>
                    name === 'Revenue' || name === 'Platform Fee'
                      ? `${Number(value).toLocaleString('vi-VN')}₫`
                      : value
                  }
                />
                <Line type="monotone" dataKey="revenue" stroke="#fbbf24" name="Revenue" />
                <Line type="monotone" dataKey="platformFee" stroke="#a78bfa" name="Platform Fee" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold mb-2">Top Events by Revenue</h3>
          {loading ? (
            <div className="flex items-center justify-center h-[260px]">
              <RingLoader size={64} color="#60a5fa" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topEvents} margin={{ top: 16, right: 16, left: 48, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="eventName" />
                <YAxis tickFormatter={(v) => (v ? `${Number(v).toLocaleString('vi-VN')}₫` : '')} />
                <Tooltip
                  formatter={(value, name) =>
                    name === 'Revenue' ? `${Number(value).toLocaleString('vi-VN')}₫` : value
                  }
                />
                <Legend />
                <Bar dataKey="revenue" fill="#fbbf24" name="Revenue" />
                <Bar dataKey="ticketsSold" fill="#60a5fa" name="Tickets Sold" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold mb-2">Platform Fee</h3>
          {loading ? (
            <div className="flex items-center justify-center h-[260px]">
              <RingLoader size={64} color="#a78bfa" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={platformFees}
                  dataKey="feeCollected"
                  nameKey="eventName"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `${Number(entry.feeCollected).toLocaleString('vi-VN')}₫`}
                >
                  {platformFees.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${Number(value).toLocaleString('vi-VN')}₫`} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
