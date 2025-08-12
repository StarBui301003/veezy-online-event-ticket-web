/* eslint-disable @typescript-eslint/no-explicit-any */
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
  Cell,
} from 'recharts';
import { connectAnalyticsHub, onAnalytics, offAnalytics } from '@/services/signalr.service';
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
import { toast } from 'react-toastify';
import { Skeleton } from '@/components/ui/skeleton';

const FILTERS = [
  { label: 'Last 30 Days', value: 12 }, // Last30Days
  { label: 'This Week', value: 3 }, // ThisWeek
  { label: 'This Month', value: 5 }, // ThisMonth
  { label: 'This Year', value: 9 }, // ThisYear
  { label: 'All Time', value: 15 }, // AllTime
  { label: 'Custom', value: 16 }, // Custom
];

const cardClass =
  'w-full min-w-[180px] max-w-[220px] bg-gradient-to-br from-white/90 to-white/70 dark:from-gray-800/90 dark:to-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 dark:border-gray-700/20 p-4 flex flex-col justify-between';

export default function FinancialTabs() {
  const [filter, setFilter] = useState<string>('12'); // Last 30 Days mặc định
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [revenueTimeline, setRevenueTimeline] = useState<FinancialRevenueTimelineItem[]>([]);
  const [topEvents, setTopEvents] = useState<FinancialTopEventByRevenue[]>([]);
  const [platformFees, setPlatformFees] = useState<FinancialPlatformFees['topContributingEvents']>(
    []
  );
  const [summary, setSummary] = useState<{
    totalRevenue: number;
    netRevenue: number;
    platformFee: number;
    topEventRevenue: number;
    topEventPlatformFee: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // Real-time data reload function
  const reloadData = () => {
    console.log(
      '🔄 reloadData called with filter:',
      filter,
      'startDate:',
      startDate,
      'endDate:',
      endDate
    );
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
    console.log('📡 API call params:', params);
    getFinancialAnalytics(params)
      .then((res: AdminFinancialAnalyticsResponse) => {
        console.log('📊 API Response:', res.data);
        console.log('🎯 topEventsByRevenue:', res.data?.topEventsByRevenue);
        console.log('📈 revenueTimeline:', res.data?.revenueTimeline);
        console.log('💰 platformFees:', res.data?.platformFees);

        // Safely set the data with proper null checks
        const safeRevenueTimeline = res.data?.revenueTimeline || [];
        const safeTopEvents = res.data?.topEventsByRevenue || [];
        const safePlatformFees = res.data?.platformFees?.topContributingEvents || [];

        setRevenueTimeline(safeRevenueTimeline);
        setTopEvents(safeTopEvents);
        setPlatformFees(safePlatformFees);

        console.log('🔄 State updated - topEvents:', safeTopEvents);

        // Safely set summary with proper null checks
        const firstTopEvent = safeTopEvents.length > 0 ? safeTopEvents[0] : null;
        const firstPlatformFeeEvent = safePlatformFees.length > 0 ? safePlatformFees[0] : null;

        setSummary({
          totalRevenue: res.data?.totalRevenue || 0,
          netRevenue: res.data?.netRevenue ?? 0, // Use direct netRevenue from API
          platformFee: res.data?.platformFee ?? 0, // Use direct platformFee from API
          topEventRevenue: firstTopEvent?.revenue ?? 0,
          topEventPlatformFee: firstPlatformFeeEvent?.feeCollected ?? 0,
        });

        console.log('🔄 Summary set:', {
          totalRevenue: res.data?.totalRevenue || 0,
          netRevenue: res.data?.netRevenue ?? 0,
          platformFee: res.data?.platformFee ?? 0,
          topEventRevenue: firstTopEvent?.revenue ?? 0,
          topEventPlatformFee: firstPlatformFeeEvent?.feeCollected ?? 0,
        });

        // Verify that the data was actually set
        setTimeout(() => {
          console.log('🔍 After setSummary - Current summary state:', summary);
          console.log('🔍 After setSummary - Current revenueTimeline state:', revenueTimeline);
          console.log('🔍 After setSummary - Current topEvents state:', topEvents);
          console.log('🔍 After setSummary - Current platformFees state:', platformFees);
        }, 100);

        // Force a re-render to ensure the data is displayed
        console.log('🔄 Forcing re-render with new data');
      })
      .catch((error) => {
        console.error('❌ Error loading financial analytics:', error);
        console.error('❌ Error details:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });
        toast.error('Failed to load financial data');
        // Set default values on error
        setRevenueTimeline([]);
        setTopEvents([]);
        setPlatformFees([]);
        setSummary({
          totalRevenue: 0,
          netRevenue: 0,
          platformFee: 0,
          topEventRevenue: 0,
          topEventPlatformFee: 0,
        });
      })
      .finally(() => setLoading(false));
  };

  // Connect to AnalyticsHub for real-time updates
  useEffect(() => {
    console.log('🚀 FinancialTabs mounted - connecting to AnalyticsHub...');
    connectAnalyticsHub('https://analytics.vezzy.site/analyticsHub');

    // Handler reference for cleanup
    const handler = (data: any) => {
      if (document.visibilityState === 'visible') {
        console.log('📡 SignalR Update Received:', data);
        console.log('🎯 SignalR topEvents:', data.topEvents);
        console.log('📈 SignalR revenueTimeline:', data.revenueTimeline);
        console.log('💰 SignalR platformFees:', data.platformFees);
        console.log('📊 SignalR summary:', data.summary);
        console.log('💵 SignalR netRevenue:', data.netRevenue);
        console.log('🏦 SignalR platformFee:', data.platformFee);

        // Defensive: always ensure platformFees is an array
        const safePlatformFees = Array.isArray(data.platformFees)
          ? data.platformFees
          : data.platformFees?.topContributingEvents || [];

        // Safely handle all data arrays
        const safeTopEvents = Array.isArray(data.topEvents) ? data.topEvents : [];
        const safeRevenueTimeline = Array.isArray(data.revenueTimeline) ? data.revenueTimeline : [];

        // Handle both old and new SignalR data structures
        const signalRSummary = data.summary || {
          totalRevenue: data.totalRevenue || 0,
          netRevenue: data.netRevenue || 0,
          platformFee: data.platformFee || 0,
          topEventRevenue: safeTopEvents[0]?.revenue || 0,
          topEventPlatformFee: safePlatformFees[0]?.feeCollected || 0,
        };

        if (
          !summary ||
          JSON.stringify(signalRSummary) !== JSON.stringify(summary) ||
          !revenueTimeline ||
          JSON.stringify(safeRevenueTimeline) !== JSON.stringify(revenueTimeline) ||
          !topEvents ||
          JSON.stringify(safeTopEvents) !== JSON.stringify(topEvents) ||
          !platformFees ||
          JSON.stringify(safePlatformFees) !== JSON.stringify(platformFees)
        ) {
          console.log('🔄 SignalR: Updating states due to data changes');
          setSummary(signalRSummary);
          setRevenueTimeline(safeRevenueTimeline);
          setTopEvents(safeTopEvents);
          setPlatformFees(safePlatformFees);
        } else {
          console.log('⏭️ SignalR: No changes detected, skipping update');
        }
      }
    };
    onAnalytics('OnFinancialAnalytics', handler);

    // Cleanup to avoid duplicate listeners
    return () => {
      console.log('🧹 FinancialTabs cleanup - disconnecting from AnalyticsHub...');
      offAnalytics('OnFinancialAnalytics', handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    console.log(
      '🔄 useEffect triggered - filter:',
      filter,
      'startDate:',
      startDate,
      'endDate:',
      endDate
    );
    reloadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, startDate, endDate]);

  // Debug useEffect to monitor state changes
  useEffect(() => {
    console.log('🔍 State changed - summary:', summary);
    console.log('🔍 State changed - revenueTimeline:', revenueTimeline);
    console.log('🔍 State changed - topEvents:', topEvents);
    console.log('🔍 State changed - platformFees:', platformFees);
  }, [summary, revenueTimeline, topEvents, platformFees]);

  // PieChart colors
  const PIE_COLORS = ['#fbbf24', '#a78bfa', '#f472b6', '#34d399', '#60a5fa', '#f59e42'];

  // Custom tick cho eventName
  interface EventNameTickProps {
    x?: number;
    y?: number;
    payload: { value: string };
  }
  function EventNameTick({ x = 0, y = 0, payload }: EventNameTickProps) {
    const maxLen = 16;
    const value = payload?.value || '';
    const showValue = value.length > maxLen ? value.slice(0, maxLen) + '...' : value;
    return (
      <g transform={`translate(${x},${y})`}>
        <title>{value}</title>
        <text
          x={0}
          y={0}
          dy={16}
          textAnchor="middle"
          fill="#666"
          style={{ fontSize: 12, cursor: 'pointer' }}
        >
          {showValue}
        </text>
      </g>
    );
  }

  return (
    <div className="space-y-6 p-3 min-h-screen">
      {/* Filter trên cùng */}
      <div className="flex gap-4 items-center mb-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="border-gray-200 dark:border-gray-600 w-40 border px-3 py-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
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
      {/* Card tổng quan financial */}
      <div className="flex flex-row flex-wrap gap-4 items-stretch justify-between w-full mb-4">
        {(() => {
          console.log('🎨 Rendering Summary Cards - loading:', loading, 'summary:', summary);
          return null;
        })()}
        {loading ? (
          <>
            <div className={cardClass}>
              <Skeleton className="h-4 w-28 mb-2 bg-slate-400 dark:bg-gray-700 rounded-full" />
              <Skeleton className="h-4 w-24 bg-slate-400 dark:bg-gray-700 rounded-full" />
            </div>
            <div className={cardClass}>
              <Skeleton className="h-4 w-24 mb-2 bg-slate-400 dark:bg-gray-700 rounded-full" />
              <Skeleton className="h-4 w-20 bg-slate-400 dark:bg-gray-700 rounded-full" />
            </div>
            <div className={cardClass}>
              <Skeleton className="h-4 w-24 mb-2 bg-slate-400 dark:bg-gray-700 rounded-full" />
              <Skeleton className="h-4 w-20 bg-slate-400 dark:bg-gray-700 rounded-full" />
            </div>
          </>
        ) : (
          <>
            <div className={cardClass}>
              <div className="text-gray-500 dark:text-gray-400 font-medium">Total Revenue</div>
              <div className="text-xl font-bold text-gray-800 dark:text-gray-200">
                {summary?.totalRevenue?.toLocaleString('vi-VN') || '0'}₫
              </div>
            </div>
            <div className={cardClass}>
              <div className="text-gray-500 dark:text-gray-400 font-medium">Net Revenue</div>
              <div className="text-xl font-bold text-gray-800 dark:text-gray-200">
                {summary?.netRevenue?.toLocaleString('vi-VN') || '0'}₫
              </div>
            </div>
            <div className={cardClass}>
              <div className="text-gray-500 dark:text-gray-400 font-medium">Platform Fee</div>
              <div className="text-xl font-bold text-gray-800 dark:text-gray-200">
                {summary?.platformFee?.toLocaleString('vi-VN') || '0'}₫
              </div>
            </div>
          </>
        )}
      </div>
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Revenue Timeline</h3>
          {(() => {
            console.log(
              '🎨 Rendering Revenue Timeline - loading:',
              loading,
              'revenueTimeline:',
              revenueTimeline,
              'length:',
              revenueTimeline?.length,
              'type:',
              typeof revenueTimeline,
              'isArray:',
              Array.isArray(revenueTimeline)
            );
            return null;
          })()}
          {loading ? (
            <div className="flex items-center justify-center h-[260px]">
              <RingLoader size={64} color="#fbbf24" />
            </div>
          ) : !revenueTimeline || revenueTimeline.length === 0 ? (
            <div className="flex items-center justify-center h-[260px] text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <div>No revenue data available</div>
                <div className="text-sm mt-2">
                  Debug: revenueTimeline = {JSON.stringify(revenueTimeline)}
                </div>
              </div>
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
            Top Events by Revenue
          </h3>
          {(() => {
            console.log(
              '🎨 Rendering Top Events - loading:',
              loading,
              'topEvents:',
              topEvents,
              'length:',
              topEvents?.length,
              'type:',
              typeof topEvents,
              'isArray:',
              Array.isArray(topEvents)
            );
            return null;
          })()}
          {loading ? (
            <div className="flex items-center justify-center h-[260px]">
              <RingLoader size={64} color="#60a5fa" />
            </div>
          ) : !topEvents || topEvents.length === 0 ? (
            <div className="flex items-center justify-center h-[260px] text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <div>No top events data available</div>
                <div className="text-sm mt-2">Debug: topEvents = {JSON.stringify(topEvents)}</div>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topEvents} margin={{ top: 16, right: 16, left: 48, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="eventName" tick={EventNameTick} />
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
                <Bar dataKey="revenue" fill="#fbbf24" name="Revenue" yAxisId="left" />
                <Bar dataKey="ticketsSold" fill="#60a5fa" name="Tickets Sold" yAxisId="right" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Platform Fee</h3>
          {(() => {
            console.log(
              '🎨 Rendering Platform Fee - loading:',
              loading,
              'platformFees:',
              platformFees,
              'length:',
              platformFees?.length,
              'type:',
              typeof platformFees,
              'isArray:',
              Array.isArray(platformFees)
            );
            return null;
          })()}
          {loading ? (
            <div className="flex items-center justify-center h-[260px]">
              <RingLoader size={64} color="#a78bfa" />
            </div>
          ) : !platformFees || platformFees.length === 0 ? (
            <div className="flex items-center justify-center h-[260px] text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <div>No platform fee data available</div>
                <div className="text-sm mt-2">
                  Debug: platformFees = {JSON.stringify(platformFees)}
                </div>
              </div>
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
                  {platformFees.map((_entry, idx) => (
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
