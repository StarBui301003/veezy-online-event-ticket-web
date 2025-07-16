import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Ticket, Download, Filter, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { getEventManagerDashboard, exportDashboardPDF, exportAnalyticsExcel } from '@/services/Event Manager/event.service';
import { toast } from 'react-toastify';
import { Dialog } from '@/components/ui/dialog';
import TicketStatsSection from './components/TicketStatsSection';
import { DialogContent, DialogTitle } from '@/components/ui/dialog';

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
  filterStatus?: string;
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
  const [salesData, setSalesData] = useState<TicketSalesData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterRevenueMin, setFilterRevenueMin] = useState('');
  const [filterRevenueMax, setFilterRevenueMax] = useState('');
  const [filterTicketsMin, setFilterTicketsMin] = useState('');
  const [filterTicketsMax, setFilterTicketsMax] = useState('');

  useEffect(() => {
    fetchSalesData(selectedPeriod);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      toast.error('Không thể tải dữ liệu bán vé!');
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
      if (filterDateFrom) filter.customStartDate = filterDateFrom;
      if (filterDateTo) filter.customEndDate = filterDateTo;
      // Add more advanced filters if needed
      const dash = await getEventManagerDashboard({ period });
      if (!dash.data) {
        toast.error('Không có dữ liệu để xuất file!');
        return;
      }
      if (type === 'pdf') {
        const blob = await exportDashboardPDF(dash.data);
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'dashboard.pdf');
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
      } else {
        const blob = await exportAnalyticsExcel('dashboard', dash.data, filter, 0);
        // Kiểm tra content-type để xác định tên file
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
      toast.error('Xuất báo cáo thất bại!');
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = salesData.reduce((sum, item) => sum + (item.revenue || 0), 0);
  const totalTickets = salesData.reduce((sum, item) => sum + (item.ticketsSold || 0), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Filtered sales data by event name and advanced filters
  const filteredSalesData = salesData.filter(item => {
    const nameMatch = item.eventName.toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = filterStatus ? String(item.status) === filterStatus : true;
    const dateFromMatch = filterDateFrom ? (item.eventDate && new Date(item.eventDate) >= new Date(filterDateFrom)) : true;
    const dateToMatch = filterDateTo ? (item.eventDate && new Date(item.eventDate) <= new Date(filterDateTo)) : true;
    const revenueMinMatch = filterRevenueMin ? (item.revenue || 0) >= Number(filterRevenueMin) : true;
    const revenueMaxMatch = filterRevenueMax ? (item.revenue || 0) <= Number(filterRevenueMax) : true;
    const ticketsMinMatch = filterTicketsMin ? (item.ticketsSold || 0) >= Number(filterTicketsMin) : true;
    const ticketsMaxMatch = filterTicketsMax ? (item.ticketsSold || 0) <= Number(filterTicketsMax) : true;
    return nameMatch && statusMatch && dateFromMatch && dateToMatch && revenueMinMatch && revenueMaxMatch && ticketsMinMatch && ticketsMaxMatch;
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
              THEO DÕI BÁN VÉ
            </h1>
            <p className="text-lg text-gray-300">Phân tích hiệu suất bán vé và doanh thu</p>
          </div>
          <div className="flex gap-4">
            <Button onClick={() => handleExport('pdf')} disabled={loading} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-6 py-3 rounded-xl">
              <Download className="mr-2" size={20} />
              Xuất PDF
            </Button>
            <Button onClick={() => handleExport('excel')} disabled={loading} className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-6 py-3 rounded-xl">
              <Download className="mr-2" size={20} />
              Xuất Excel
            </Button>
            <Button onClick={() => fetchSalesData(selectedPeriod)} disabled={loading} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6 py-3 rounded-xl">
              <Filter className="mr-2" size={20} />
              Lọc Dữ Liệu
            </Button>
          </div>
        </div>

        {/* Persuasive summary */}
        <div className="mb-8 text-xl font-semibold text-center text-emerald-200">
          Theo dõi hiệu suất bán vé và doanh thu của bạn một cách trực quan và dễ hiểu.
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
                  <p className="text-green-300 text-sm font-semibold">Tổng Doanh Thu</p>
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
                  <p className="text-blue-300 text-sm font-semibold">Vé Đã Bán</p>
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
            <h2 className="text-2xl font-bold text-green-300">Chi Tiết Bán Vé Theo Sự Kiện</h2>
            <div className="flex flex-1 flex-col md:flex-row md:items-center md:justify-end gap-2">
              <div className="flex gap-2 mb-2 md:mb-0">
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
                    {period === 'week' && 'Tuần'}
                    {period === 'month' && 'Tháng'}
                    {period === 'quarter' && 'Quý'}
                    {period === 'year' && 'Năm'}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Tìm kiếm sự kiện..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-green-400 bg-[#1a0022] text-white focus:outline-none focus:ring-2 focus:ring-green-500 w-full max-w-xs"
                />
                <Button variant="outline" onClick={() => setAdvancedOpen(true)} className="border-green-400 text-green-300 flex items-center gap-1">
                  <Search size={16} /> Tìm kiếm nâng cao
                </Button>
              </div>
            </div>
          </div>

          {/* Advanced Search Modal */}
          <Dialog open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <DialogContent className="bg-[#1a0022] text-white max-w-lg w-full rounded-xl p-6">
              <DialogTitle className="text-lg font-bold mb-4">Tìm kiếm nâng cao</DialogTitle>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block mb-1">Trạng thái</label>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#2d0036] border border-green-400 text-white">
                    <option value="">Tất cả</option>
                    <option value="1">Đang diễn ra</option>
                    <option value="2">Đã kết thúc</option>
                    <option value="3">Đã hủy</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block mb-1">Từ ngày</label>
                    <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#2d0036] border border-green-400 text-white" />
                  </div>
                  <div className="flex-1">
                    <label className="block mb-1">Đến ngày</label>
                    <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#2d0036] border border-green-400 text-white" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block mb-1">Doanh thu tối thiểu</label>
                    <input type="number" min="0" value={filterRevenueMin} onChange={e => setFilterRevenueMin(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#2d0036] border border-green-400 text-white" />
                  </div>
                  <div className="flex-1">
                    <label className="block mb-1">Doanh thu tối đa</label>
                    <input type="number" min="0" value={filterRevenueMax} onChange={e => setFilterRevenueMax(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#2d0036] border border-green-400 text-white" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block mb-1">Vé bán tối thiểu</label>
                    <input type="number" min="0" value={filterTicketsMin} onChange={e => setFilterTicketsMin(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#2d0036] border border-green-400 text-white" />
                  </div>
                  <div className="flex-1">
                    <label className="block mb-1">Vé bán tối đa</label>
                    <input type="number" min="0" value={filterTicketsMax} onChange={e => setFilterTicketsMax(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#2d0036] border border-green-400 text-white" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => {
                  setFilterStatus(''); setFilterDateFrom(''); setFilterDateTo(''); setFilterRevenueMin(''); setFilterRevenueMax(''); setFilterTicketsMin(''); setFilterTicketsMax(''); setAdvancedOpen(false);
                }} className="border-green-400 text-green-300">Đặt lại</Button>
                <Button onClick={() => setAdvancedOpen(false)} className="bg-green-600 text-white">Áp dụng</Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-green-500/30">
                  <th className="text-left p-4 text-green-300 font-semibold">Sự Kiện</th>
                  <th className="text-center p-4 text-green-300 font-semibold">Đã Bán</th>
                  <th className="text-center p-4 text-green-300 font-semibold">Doanh Thu</th>
                  <th className="text-center p-4 text-green-300 font-semibold">Doanh Thu Thực</th>
                  <th className="text-center p-4 text-green-300 font-semibold">Ngày</th>
                  <th className="text-center p-4 text-green-300 font-semibold">Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400">Đang tải dữ liệu...</td></tr>
                ) : filteredSalesData.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400">Không có dữ liệu</td></tr>
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
                        <p className="text-sm text-gray-400">ID: {item.eventId}</p>
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
                      <span className="text-green-300 font-semibold">{item.status}</span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Ticket Stats Chart */}
        <TicketStatsSection />
      </motion.div>
    </div>
  );
} 