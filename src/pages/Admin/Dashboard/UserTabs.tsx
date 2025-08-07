/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from 'react';
import { getUserAnalytics } from '@/services/Admin/dashboard.service';
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { onAnalytics, offAnalytics } from '@/services/signalr.service';
import type { AdminUserAnalyticsResponse } from '@/types/Admin/dashboard';
import type { UserGrowth, UserDemographics } from '@/types/Admin/dashboard';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'react-toastify';
import { RingLoader } from 'react-spinners';

const FILTERS = [
  { label: 'Last 30 Days', value: 12 }, // Last30Days
  { label: 'This Week', value: 3 }, // ThisWeek
  { label: 'This Month', value: 5 }, // ThisMonth
  { label: 'This Year', value: 9 }, // ThisYear
  { label: 'All Time', value: 15 }, // AllTime
  { label: 'Custom', value: 16 }, // Custom
];

export default function UserTabs() {
  const [filter, setFilter] = useState<string>('12'); // Last 30 Days mặc định
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  // const [data, setData] = useState<UserGrowthChartItem[]>([]);
  // const [loading, setLoading] = useState(false);
  const [growth, setGrowth] = useState<UserGrowth | null>(null);
  const [demographics, setDemographics] = useState<UserDemographics | null>(null);

  const filterRef = useRef(filter);
  const startDateRef = useRef(startDate);
  const endDateRef = useRef(endDate);

  // Keep refs in sync with state
  useEffect(() => {
    filterRef.current = filter;
    startDateRef.current = startDate;
    endDateRef.current = endDate;
  }, [filter, startDate, endDate]);

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
    const params: Record<string, unknown> = {};
    if (filter === '16') {
      params.period = 16;
      params.customStartDate = startDate?.toISOString().slice(0, 10);
      params.customEndDate = endDate?.toISOString().slice(0, 10);
    } else if (filter !== '12') {
      params.period = parseInt(filter, 10);
    }
    getUserAnalytics(params).then((res: AdminUserAnalyticsResponse) => {
      setGrowth(res.data.growth);
      setDemographics(res.data.demographics);
    });
  };

  // Setup Analytics Hub listeners using global connections
  useEffect(() => {
    // Analytics hub connection is managed globally in App.tsx

    // Handler reference for cleanup
    const handler = (data: any) => {
      // Chỉ reload nếu tab đang hiển thị và dữ liệu thực sự thay đổi
      if (document.visibilityState === 'visible') {
        // So sánh dữ liệu mới với dữ liệu hiện tại
        if (
          !growth ||
          JSON.stringify(data.growth) !== JSON.stringify(growth) ||
          !demographics ||
          JSON.stringify(data.demographics) !== JSON.stringify(demographics)
        ) {
          setGrowth(data.growth);
          setDemographics(data.demographics);
        }
      }
    };
    onAnalytics('OnUserAnalytics', handler);

    // Initial data load
    reloadData();

    // Cleanup to avoid duplicate listeners
    return () => {
      offAnalytics('OnUserAnalytics', handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    reloadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, startDate, endDate]);

  const cardClass =
    'w-full min-w-[180px] max-w-[200px] bg-gradient-to-br from-white/90 to-white/70 dark:from-gray-800/90 dark:to-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 dark:border-gray-700/20 p-4 flex flex-col justify-between';

  // Pie colors
  const PIE_COLORS = ['#60a5fa', '#fbbf24', '#a78bfa', '#f472b6', '#34d399', '#f59e42'];

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
      {/* Card tổng quan user */}
      <div className="flex flex-row flex-wrap gap-4 items-stretch justify-between w-full mb-4">
        {!growth ? (
          <div className="flex w-full items-center justify-center h-[100px]">
            <RingLoader size={40} color="#60a5fa" />
          </div>
        ) : (
          <>
            <div className={cardClass}>
              <div className="text-gray-500 dark:text-gray-400 font-medium">Total Users</div>
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {growth.totalUsers.toLocaleString()}
              </div>
            </div>
            <div className={cardClass}>
              <div className="text-gray-500 dark:text-gray-400 font-medium">New Users</div>
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {growth.newUsers.toLocaleString()}
              </div>
            </div>
            <div className={cardClass}>
              <div className="text-gray-500 dark:text-gray-400 font-medium">Active New Users</div>
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {growth.activeNewUsers.toLocaleString()}
              </div>
            </div>
            <div className={cardClass}>
              <div className="text-gray-500 dark:text-gray-400 font-medium">Inactive New Users</div>
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {growth.inactiveNewUsers.toLocaleString()}
              </div>
            </div>
            <div className={cardClass}>
              <div className="text-gray-500 dark:text-gray-400 font-medium">Online Users</div>
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {growth.onlineUsers.toLocaleString()}
              </div>
            </div>
          </>
        )}
      </div>
      {/* Biểu đồ phụ demographics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
        {/* PieChart usersByRole */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col items-center border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Users by Role</h4>
          {growth && growth.usersByRole && Object.keys(growth.usersByRole).length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={Object.entries(growth.usersByRole).map(([role, value]) => ({
                    name: role,
                    value,
                  }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  label
                >
                  {Object.keys(growth.usersByRole).map((_role, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => v.toLocaleString()} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[180px]">
              <RingLoader size={40} color="#60a5fa" />
            </div>
          )}
        </div>
        {/* PieChart usersByGender */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col items-center border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Users by Gender</h4>
          {demographics &&
          demographics.usersByGender &&
          Object.keys(demographics.usersByGender).length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={Object.entries(demographics.usersByGender).map(([gender, value]) => ({
                    name: gender,
                    value,
                  }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  label
                >
                  {Object.keys(demographics.usersByGender).map((_gender, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => v.toLocaleString()} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[180px]">
              <RingLoader size={40} color="#fbbf24" />
            </div>
          )}
        </div>
        {/* BarChart usersByAgeGroup */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col items-center border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
            Users by Age Group
          </h4>
          {demographics &&
          demographics.usersByAgeGroup &&
          Object.keys(demographics.usersByAgeGroup).length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={Object.entries(demographics.usersByAgeGroup).map(([age, value]) => ({
                  age,
                  value,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="age" />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(v) => v.toLocaleString()} />
                <Bar dataKey="value" fill="#60a5fa" name="Users" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[180px]">
              <RingLoader size={40} color="#a78bfa" />
            </div>
          )}
          {demographics && demographics.averageAge && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Avg. Age: {demographics.averageAge}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
