import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Ticket, Download, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  getEventManagerDashboard,
  exportAnalyticsExcel,
} from '@/services/Event Manager/event.service';
import { toast } from 'react-toastify';
import { Dialog } from '@/components/ui/dialog';
import { DialogContent, DialogTitle } from '@/components/ui/dialog';
import { connectEventHub, onEvent } from '@/services/signalr.service';
import { useTranslation } from 'react-i18next';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';

interface TicketSalesData {
  eventId: string;
  eventName: string;
  ticketsSold: number;
  revenue: number;
  netRevenue?: number;
  eventDate?: string;
  status?: number;
  statusName?: string;
}

interface ExportFilter {
  period: number;
  groupBy: number;
  customStartDate?: string;
  customEndDate?: string;
  filterRevenueMin?: number;
  filterRevenueMax?: number;
  filterTicketsMin?: number;
  filterTicketsMax?: number;
  [key: string]: string | number | boolean | undefined;
}

const PERIOD_MAP: Record<string, number> = {
  week: 3,
  month: 4,
  quarter: 5,
  year: 6,
};

const TICKET_STATUS = {
  4: 'Active',
  5: 'Completed',
};

export default function TicketSalesDashboard() {
  const { t } = useTranslation();
  const { getThemeClass } = useThemeClasses();
  const [salesData, setSalesData] = useState<TicketSalesData[]>([]);
  const [filteredData, setFilteredData] = useState<TicketSalesData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedStatus, setSelectedStatus] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSalesData(selectedPeriod);
    // eslint-disable-next-line
  }, [selectedPeriod]);

  useEffect(() => {
    connectEventHub('http://localhost:5004/notificationHub');
    const reload = () => fetchSalesData(selectedPeriod);
    onEvent('OnEventCreated', reload);
    onEvent('OnEventUpdated', reload);
    onEvent('OnEventDeleted', reload);
    onEvent('OnEventCancelled', reload);
    onEvent('OnEventApproved', reload);
  }, [selectedPeriod]);

  useEffect(() => {
    let result = [...salesData];

    // Filter by search term
    if (searchTerm) {
      result = result.filter((item) =>
        item.eventName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status - show Active (4) and Completed (5) when 'all' is selected
    if (selectedStatus !== 'all') {
      result = result.filter((item) => item.status === selectedStatus);
    } else {
      result = result.filter((item) => item.status === 4 || item.status === 5);
    }

    setFilteredData(result);
  }, [salesData, searchTerm, selectedStatus]);

  const fetchSalesData = async (periodKey: string) => {
    try {
      setLoading(true);
      const period = PERIOD_MAP[periodKey] || 3;
      const dash = await getEventManagerDashboard({ period });

      // Only include events that belong to the current event manager
      const revenueByEvent = dash.data?.financial?.revenueByEvent || [];
      const mapped: TicketSalesData[] = revenueByEvent.map((event: TicketSalesData) => ({
        eventId: event.eventId,
        eventName: event.eventName,
        ticketsSold: event.ticketsSold || 0,
        revenue: event.revenue || 0,
        netRevenue: event.netRevenue || 0,
        eventDate: event.eventDate,
        status: event.status,
        statusName: TICKET_STATUS[event.status as keyof typeof TICKET_STATUS] || 'Unknown',
      }));

      setSalesData(mapped);
    } catch {
      toast.error(t('ticketSalesDashboard.errorLoadingData'));
    } finally {
      setLoading(false);
    }
  };

  // Format currency function - show full VND amount without abbreviation
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate total revenue and tickets sold
  const totalRevenue = filteredData.reduce((sum, item) => sum + (item.revenue || 0), 0);
  const totalTickets = filteredData.reduce((sum, item) => sum + (item.ticketsSold || 0), 0);

  const handleExport = async (type: 'pdf' | 'excel') => {
    try {
      setLoading(true);
      const period = PERIOD_MAP[selectedPeriod] || 3;
      const filter: ExportFilter = {
        period,
        groupBy: 1,
      };
      const dash = await getEventManagerDashboard({ period });
      if (!dash.data) {
        toast.error(t('ticketSalesDashboard.noDataToExport'));
        return;
      }
      if (type === 'excel') {
        const blob = await exportAnalyticsExcel('dashboard', dash.data, filter, 0);
        let fileName = 'analytics.xlsx';
        if (blob && blob.type === 'text/csv') {
          fileName = 'analytics.csv';
        }
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
      }
    } catch {
      toast.error(t('ticketSalesDashboard.exportReportFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={cn(
        'min-h-screen p-8',
        getThemeClass(
          'bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 text-gray-900',
          'bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e] text-white'
        )
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-center justify-between mb-12">
          <div>
            <h1
              className={cn(
                'text-4xl lg:text-5xl font-black tracking-wider text-transparent bg-clip-text mb-4',
                getThemeClass(
                  'bg-gradient-to-r from-blue-600 to-purple-600',
                  'bg-gradient-to-r from-green-400 to-emerald-400'
                )
              )}
            >
              {t('ticketSalesDashboard.trackingTicketSales')}
            </h1>
            <p className={cn('text-lg', getThemeClass('text-gray-700', 'text-gray-300'))}>
              {t('ticketSalesDashboard.analyzingTicketPerformance')}
            </p>
          </div>
          <div className="flex gap-4">
            <Button
              onClick={() => handleExport('excel')}
              disabled={loading}
              className={cn(
                'px-6 py-3 rounded-xl',
                getThemeClass(
                  'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white',
                  'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white'
                )
              )}
            >
              <Download className="mr-2" size={20} />
              {t('ticketSalesDashboard.exportExcel')}
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex flex-col w-full md:w-auto">
            <h2
              className={cn(
                'text-2xl font-bold mb-2',
                getThemeClass('text-blue-600', 'text-green-300')
              )}
            >
              {t('ticketSalesDashboard.ticketSalesDetailsByEvent')}
            </h2>
            <div className="flex flex-wrap gap-2">
              {['week', 'month', 'quarter', 'year'].map((period) => (
                <Button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    selectedPeriod === period
                      ? getThemeClass('bg-blue-600 text-white', 'bg-green-600 text-white')
                      : getThemeClass(
                          'bg-white/60 text-gray-700 hover:bg-blue-600/20',
                          'bg-[#1a0022]/60 text-gray-300 hover:bg-green-600/20'
                        )
                  )}
                >
                  {period === 'week' && t('ticketSalesDashboard.week')}
                  {period === 'month' && t('ticketSalesDashboard.month')}
                  {period === 'quarter' && t('ticketSalesDashboard.quarter')}
                  {period === 'year' && t('ticketSalesDashboard.year')}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="relative flex-1">
              <Search
                className={cn(
                  'absolute left-3 top-1/2 transform -translate-y-1/2',
                  getThemeClass('text-gray-400', 'text-gray-400')
                )}
                size={20}
              />
              <input
                type="text"
                placeholder={t('searchEvents')}
                className={cn(
                  'w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 min-w-[180px] appearance-none pr-8',
                  getThemeClass(
                    'bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500',
                    'bg-[#1a0022] border border-white/20 text-white placeholder-gray-400 focus:ring-blue-500'
                  )
                )}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <select
                className={cn(
                  'px-4 py-2 rounded-lg focus:outline-none focus:ring-2 min-w-[180px] appearance-none pr-8',
                  getThemeClass(
                    'bg-white border border-gray-300 text-gray-900 focus:ring-blue-500',
                    'bg-[#1a0022] border border-white/20 text-white focus:ring-blue-500'
                  )
                )}
                value={selectedStatus}
                onChange={(e) =>
                  setSelectedStatus(e.target.value === 'all' ? 'all' : Number(e.target.value))
                }
              >
                <option value="all">All Statuses</option>
                <option value={4}>Active</option>
                <option value={5}>Completed</option>
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg
                  className={cn('w-4 h-4', getThemeClass('text-gray-600', 'text-white'))}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        >
          <Card
            className={cn(
              'border-2 shadow-2xl',
              getThemeClass(
                'bg-white/95 border-blue-300/30',
                'bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 border-green-500/30'
              )
            )}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={cn(
                      'text-sm font-semibold',
                      getThemeClass('text-blue-600', 'text-green-300')
                    )}
                  >
                    {t('totalRevenue')}
                  </p>
                  <p
                    className={cn(
                      'text-3xl font-bold',
                      getThemeClass('text-blue-600', 'text-green-400')
                    )}
                  >
                    {formatCurrency(totalRevenue)}
                  </p>
                </div>
                <DollarSign
                  className={cn(getThemeClass('text-blue-600', 'text-green-400'))}
                  size={40}
                />
              </div>
            </CardContent>
          </Card>

          <Card
            className={cn(
              'border-2 shadow-2xl',
              getThemeClass(
                'bg-white/95 border-purple-300/30',
                'bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 border-blue-500/30'
              )
            )}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={cn(
                      'text-sm font-semibold',
                      getThemeClass('text-purple-600', 'text-blue-300')
                    )}
                  >
                    {t('ticketsSold')}
                  </p>
                  <p
                    className={cn(
                      'text-3xl font-bold',
                      getThemeClass('text-purple-600', 'text-blue-400')
                    )}
                  >
                    {totalTickets.toLocaleString()}
                  </p>
                </div>
                <Ticket
                  className={cn(getThemeClass('text-purple-600', 'text-blue-400'))}
                  size={40}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Events Table */}
        <Card
          className={cn(
            'border overflow-hidden',
            getThemeClass(
              'bg-white/95 border-gray-200',
              'bg-white/5 backdrop-blur-sm border-white/10'
            )
          )}
        >
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={cn(getThemeClass('bg-gray-50', 'bg-white/5'))}>
                  <tr>
                    <th
                      className={cn(
                        'px-6 py-4 text-left text-xs font-medium uppercase tracking-wider',
                        getThemeClass('text-gray-700', 'text-gray-300')
                      )}
                    >
                      {t('eventName')}
                    </th>
                    <th
                      className={cn(
                        'px-6 py-4 text-center text-xs font-medium uppercase tracking-wider',
                        getThemeClass('text-gray-700', 'text-gray-300')
                      )}
                    >
                      {t('status')}
                    </th>
                    <th
                      className={cn(
                        'px-6 py-4 text-right text-xs font-medium uppercase tracking-wider',
                        getThemeClass('text-gray-700', 'text-gray-300')
                      )}
                    >
                      {t('ticketsSold')}
                    </th>
                    <th
                      className={cn(
                        'px-6 py-4 text-right text-xs font-medium uppercase tracking-wider',
                        getThemeClass('text-gray-700', 'text-gray-300')
                      )}
                    >
                      {t('revenue')}
                    </th>
                    <th
                      className={cn(
                        'px-6 py-4 text-right text-xs font-medium uppercase tracking-wider',
                        getThemeClass('text-gray-700', 'text-gray-300')
                      )}
                    >
                      {t('date')}
                    </th>
                  </tr>
                </thead>
                <tbody
                  className={cn('divide-y', getThemeClass('divide-gray-200', 'divide-white/10'))}
                >
                  {filteredData.length > 0 ? (
                    filteredData.map((item) => (
                      <tr
                        key={item.eventId}
                        className={cn(
                          'transition-colors',
                          getThemeClass('hover:bg-gray-50', 'hover:bg-white/5')
                        )}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div
                            className={cn(
                              'text-sm font-medium',
                              getThemeClass('text-gray-900', 'text-white')
                            )}
                          >
                            {item.eventName}
                          </div>
                          <div
                            className={cn(
                              'text-xs',
                              getThemeClass('text-gray-500', 'text-gray-400')
                            )}
                          >
                            ID: {item.eventId}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span
                            className={cn(
                              'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                              item.status === 5
                                ? getThemeClass(
                                    'bg-green-100 text-green-800',
                                    'bg-green-100 text-green-800'
                                  )
                                : item.status === 4
                                ? getThemeClass(
                                    'bg-blue-100 text-blue-800',
                                    'bg-blue-100 text-blue-800'
                                  )
                                : getThemeClass(
                                    'bg-gray-100 text-gray-800',
                                    'bg-gray-100 text-gray-800'
                                  )
                            )}
                          >
                            {item.statusName}
                          </span>
                        </td>
                        <td
                          className={cn(
                            'px-6 py-4 whitespace-nowrap text-right text-sm',
                            getThemeClass('text-gray-700', 'text-gray-300')
                          )}
                        >
                          {item.ticketsSold?.toLocaleString()}
                        </td>
                        <td
                          className={cn(
                            'px-6 py-4 whitespace-nowrap text-right text-sm font-medium',
                            getThemeClass('text-green-600', 'text-green-400')
                          )}
                        >
                          {formatCurrency(item.revenue || 0)}
                        </td>
                        <td
                          className={cn(
                            'px-6 py-4 whitespace-nowrap text-right text-sm',
                            getThemeClass('text-gray-700', 'text-gray-300')
                          )}
                        >
                          {item.eventDate
                            ? new Date(item.eventDate).toLocaleDateString('vi-VN')
                            : '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className={cn(
                          'px-6 py-8 text-center',
                          getThemeClass('text-gray-500', 'text-gray-400')
                        )}
                      >
                        {loading ? t('loading') : t('noEventsFound')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
