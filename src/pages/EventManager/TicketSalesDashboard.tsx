import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, DollarSign, Ticket, Users, Calendar, ArrowUpRight, Download, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { getMyApprovedEvents } from '@/services/Event Manager/event.service';
import { toast } from 'react-toastify';
import { connectEventHub, onEvent } from '@/services/signalr.service';

interface TicketSalesData {
  eventId: string;
  eventName: string;
  totalTickets: number;
  soldTickets: number;
  revenue: number;
  averagePrice: number;
  conversionRate: number;
}

export default function TicketSalesDashboard() {
  const [salesData, setSalesData] = useState<TicketSalesData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  // const [_loading, setLoading] = useState(true);

  useEffect(() => {
    connectEventHub('http://localhost:5004/notificationHub');
    fetchSalesData();
    // Lắng nghe realtime SignalR
    const reload = () => fetchSalesData();
    onEvent('OnEventCreated', reload);
    onEvent('OnEventUpdated', reload);
    onEvent('OnEventDeleted', reload);
    onEvent('OnEventCancelled', reload);
    onEvent('OnEventApproved', reload);
    // Cleanup: không cần offEvent vì signalr.service chưa hỗ trợ
  }, []);

  const fetchSalesData = async () => {
    try {
      //setLoading(true);
      const events = await getMyApprovedEvents(1, 100);
      
      // Mock data - thay bằng API thực tế
      const mockSalesData: TicketSalesData[] = events.map((event, index) => ({
        eventId: event.eventId,
        eventName: event.eventName,
        totalTickets: 100 + (index * 50),
        soldTickets: Math.floor((100 + (index * 50)) * (0.3 + Math.random() * 0.6)),
        revenue: Math.floor((100 + (index * 50)) * (0.3 + Math.random() * 0.6) * (50000 + Math.random() * 200000)),
        averagePrice: 50000 + Math.random() * 200000,
        conversionRate: 0.3 + Math.random() * 0.6
      }));
      
      setSalesData(mockSalesData);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error('Không thể tải dữ liệu bán vé!');
    } finally {
      // setLoading(false);
    }
  };

  const totalRevenue = salesData.reduce((sum, item) => sum + item.revenue, 0);
  const totalTickets = salesData.reduce((sum, item) => sum + item.soldTickets, 0);
  const averageConversion = salesData.reduce((sum, item) => sum + item.conversionRate, 0) / salesData.length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

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
            <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-6 py-3 rounded-xl">
              <Download className="mr-2" size={20} />
              Xuất Báo Cáo
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-6 py-3 rounded-xl">
              <Filter className="mr-2" size={20} />
              Lọc Dữ Liệu
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          <Card className="bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 border-2 border-green-500/30 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-300 text-sm font-semibold">Tổng Doanh Thu</p>
                  <p className="text-3xl font-bold text-green-400">{formatCurrency(totalRevenue)}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="text-green-400 mr-1" size={16} />
                    <span className="text-green-400 text-sm">+12.5% so với tháng trước</span>
                  </div>
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
                  <div className="flex items-center mt-2">
                    <TrendingUp className="text-blue-400 mr-1" size={16} />
                    <span className="text-blue-400 text-sm">+8.3% so với tháng trước</span>
                  </div>
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

          <Card className="bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 border-2 border-purple-500/30 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-300 text-sm font-semibold">Tỷ Lệ Chuyển Đổi</p>
                  <p className="text-3xl font-bold text-purple-400">{formatPercentage(averageConversion)}</p>
                  <div className="flex items-center mt-2">
                    <TrendingDown className="text-red-400 mr-1" size={16} />
                    <span className="text-red-400 text-sm">-2.1% so với tháng trước</span>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Users className="text-purple-400" size={40} />
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
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-green-300">Chi Tiết Bán Vé Theo Sự Kiện</h2>
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
                  {period === 'week' && 'Tuần'}
                  {period === 'month' && 'Tháng'}
                  {period === 'quarter' && 'Quý'}
                  {period === 'year' && 'Năm'}
                </Button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-green-500/30">
                  <th className="text-left p-4 text-green-300 font-semibold">Sự Kiện</th>
                  <th className="text-center p-4 text-green-300 font-semibold">Tổng Vé</th>
                  <th className="text-center p-4 text-green-300 font-semibold">Đã Bán</th>
                  <th className="text-center p-4 text-green-300 font-semibold">Doanh Thu</th>
                  <th className="text-center p-4 text-green-300 font-semibold">Giá TB</th>
                  <th className="text-center p-4 text-green-300 font-semibold">Tỷ Lệ</th>
                  <th className="text-center p-4 text-green-300 font-semibold">Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {salesData.map((item, index) => (
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
                      <span className="text-blue-400 font-semibold">{item.totalTickets.toLocaleString()}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-green-400 font-semibold">{item.soldTickets.toLocaleString()}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-yellow-400 font-semibold">{formatCurrency(item.revenue)}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-purple-400 font-semibold">{formatCurrency(item.averagePrice)}</span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center">
                        <div className="w-16 bg-gray-700 rounded-full h-2 mr-2">
                          <div 
                            className="bg-gradient-to-r from-green-400 to-emerald-400 h-2 rounded-full"
                            style={{ width: `${item.conversionRate * 100}%` }}
                          />
                        </div>
                        <span className="text-green-400 text-sm font-semibold">
                          {formatPercentage(item.conversionRate)}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-3 py-1 rounded-lg text-sm">
                        <ArrowUpRight size={16} />
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Performance Chart Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 rounded-2xl p-6 border-2 border-blue-500/30 shadow-2xl"
        >
          <h3 className="text-xl font-bold text-blue-300 mb-4">Biểu Đồ Hiệu Suất Bán Vé</h3>
          <div className="h-64 bg-[#1a0022]/40 rounded-xl border border-blue-500/20 flex items-center justify-center">
            <div className="text-center">
              <Calendar className="text-blue-400 mx-auto mb-4" size={48} />
              <p className="text-blue-300">Biểu đồ sẽ được hiển thị ở đây</p>
              <p className="text-gray-400 text-sm">Tích hợp với thư viện biểu đồ</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
} 