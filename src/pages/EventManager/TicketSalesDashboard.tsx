import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Ticket, Download, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { getEventManagerDashboard, exportAnalyticsExcel } from '@/services/Event Manager/event.service';
import { toast } from 'react-toastify';
import { Dialog } from '@/components/ui/dialog';
import { DialogContent, DialogTitle } from '@/components/ui/dialog';
import { connectEventHub, onEvent } from '@/services/signalr.service';
import { useTranslation } from 'react-i18next';

interface TicketSalesData {
  eventId: string;
  eventName: string;
  ticketsSold: number;
  revenue: number;
  netRevenue?: number;
  eventDate?: string;
  status?: number;
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
  year: 6
};

export default function TicketSalesDashboard() {
  const { t } = useTranslation();
  const [salesData, setSalesData] = useState<TicketSalesData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
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

  const fetchSalesData = async (periodKey: string) => {
    try {
      setLoading(true);
      const period = PERIOD_MAP[periodKey] || 3;
      const dash = await getEventManagerDashboard({ period });
      const revenueByEvent = dash.data?.financial?.revenueByEvent || [];
      const mapped: TicketSalesData[] = revenueByEvent.map((event: TicketSalesData) => ({
        eventId: event.eventId,
        eventName: event.eventName,
        ticketsSold: event.ticketsSold,
        revenue: event.revenue,
        netRevenue: event.netRevenue,
        eventDate: event.eventDate,
        status: event.status
      }));
      setSalesData(mapped);
    } catch {
      toast.error(t('ticketSalesDashboard.errorLoadingData'));
    } finally {
      setLoading(false);
    }
  };

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

  const totalRevenue = salesData
    .filter(item => item.status === 5)
    .reduce((sum, item) => sum + (item.revenue || 0), 0);

  const totalTickets = salesData
    .filter(item => item.status === 5)
    .reduce((sum, item) => sum + (item.ticketsSold || 0), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const filteredSalesData = salesData.filter(item => {
    if (item.status !== 5) return false;
    const nameMatch = item.eventName.toLowerCase().includes(searchTerm.toLowerCase());
    return nameMatch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e] text-white p-8">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl lg:text-5xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-4">
              {t('ticketSalesDashboard.trackingTicketSales')}
            </h1>
            <p className="text-lg text-gray-300">{t('ticketSalesDashboard.analyzingTicketPerformance')}</p>
          </div>
          <div className="flex gap-4">
            <Button onClick={() => handleExport('excel')} disabled={loading} className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-6 py-3 rounded-xl">
              <Download className="mr-2" size={20} />
              {t('ticketSalesDashboard.exportExcel')}
            </Button>
          </div>
        </div>

        {/* Persuasive summary */}
        <div className="mb-8 text-xl font-semibold text-center text-emerald-200">
          {t('ticketSalesDashboard.trackingTicketPerformance')}
        </div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
        >
          <Card className="bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 border-2 border-green-500/30 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-300 text-sm font-semibold">{t('ticketSalesDashboard.totalRevenue')}</p>
                  <p className="text-3xl font-bold text-green-400">{formatCurrency(totalRevenue)}</p>
                </div>
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <DollarSign className="text-green-400" size={40} />
                </motion.div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 border-2 border-blue-500/30 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-300 text-sm font-semibold">{t('ticketSalesDashboard.ticketsSold')}</p>
                  <p className="text-3xl font-bold text-blue-400">{totalTickets.toLocaleString()}</p>
                </div>
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Ticket className="text-blue-400" size={40} />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sales Data Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 rounded-2xl p-6 border-2 border-green-500/30 shadow-2xl"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <h2 className="text-2xl font-bold text-green-300">{t('ticketSalesDashboard.ticketSalesDetailsByEvent')}</h2>
            <div className="flex flex-1 flex-col md:flex-row md:items-center md:justify-end gap-2">
              <div className="flex gap-2">
                {['week', 'month', 'quarter', 'year'].map((period) => (
                  <Button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedPeriod === period
                        ? 'bg-green-600 text-white'
                        : 'bg-[#1a0022]/60 text-gray-300 hover:bg-green-600/20'
                    }`}
                  >
                    {period === 'week' && t('ticketSalesDashboard.week')}
                    {period === 'month' && t('ticketSalesDashboard.month')}
                    {period === 'quarter' && t('ticketSalesDashboard.quarter')}
                    {period === 'year' && t('ticketSalesDashboard.year')}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={t('ticketSalesDashboard.searchEvent')}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-green-400 bg-[#1a0022] text-white focus:outline-none focus:ring-2 focus:ring-green-500 w-full max-w-xs"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-green-500/30">
                  <th className="text-left p-4 text-green-300 font-semibold">{t('ticketSalesDashboard.event')}</th>
                  <th className="text-center p-4 text-green-300 font-semibold">{t('ticketSalesDashboard.sold')}</th>
                  <th className="text-center p-4 text-green-300 font-semibold">{t('ticketSalesDashboard.revenue')}</th>
                  <th className="text-center p-4 text-green-300 font-semibold">{t('ticketSalesDashboard.netRevenue')}</th>
                  <th className="text-center p-4 text-green-300 font-semibold">{t('ticketSalesDashboard.date')}</th>
                  <th className="text-center p-4 text-green-300 font-semibold">{t('ticketSalesDashboard.status')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400">{t('ticketSalesDashboard.loadingData')}</td></tr>
                ) : filteredSalesData.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400">{t('ticketSalesDashboard.noData')}</td></tr>
                ) : filteredSalesData.map((item, index) => (
                  <motion.tr
                    key={item.eventId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border-b border-green-500/10 hover:bg-green-500/5 transition-colors"
                  >
                    <td className="p-4">
                      <div>
                        <p className="font-semibold text-white">{item.eventName}</p>
                        <p className="text-sm text-gray-400">{t('ticketSalesDashboard.eventId')}: {item.eventId}</p>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-green-400 font-semibold">{item.ticketsSold?.toLocaleString()}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-yellow-400 font-semibold">{formatCurrency(item.revenue || 0)}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-blue-400 font-semibold">{formatCurrency(item.netRevenue || 0)}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-purple-400 font-semibold">{item.eventDate ? new Date(item.eventDate).toLocaleDateString('vi-VN') : '-'}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-green-300 font-semibold">{t(`ticketSalesDashboard.statuses.${item.status || 5}`)}</span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}