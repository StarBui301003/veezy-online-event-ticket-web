import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Wallet, 
  CreditCard, 
  Download, 
  RefreshCw, 
  Search
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  getMyApprovedEvents,
  getEventFund,
  getEventBalance,
  getEventRevenue,
  getEventTransactions,
  requestWithdrawal
} from '@/services/Event Manager/event.service';
import { toast } from 'react-toastify';

interface Event {
  eventId: string;
  eventName: string;
  eventLocation: string;
  startAt: string;
  endAt: string;
}

interface FundData {
  fundId: string;
  eventId: string;
  eventManagerId: string;
  totalRevenue: number;
  totalWithdrawn: number;
  availableBalance: number;
  platformFeeRate: number;
  platformFeePaid: number;
  fundStatus: number;
  isWithdrawalEnabled: boolean;
  withdrawalRequestedAt: string | null;
  lastWithdrawalAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Transaction {
  transactionId: string;
  eventId: string;
  orderId: string;
  transactionType: number;
  amount: number;
  transactionDescription: string;
  relatedEntityType: number;
  relatedEntityId: string;
  transactionStatus: number;
  initiatedBy: string;
  processedBy: string | null;
  notes: string;
  createdAt: string;
  processedAt: string | null;
}

export default function FundManagement() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [fundData, setFundData] = useState<FundData | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [revenue, setRevenue] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawalAmount, setWithdrawalAmount] = useState<string>('');
  const [withdrawalNotes, setWithdrawalNotes] = useState<string>('');
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchFundData(selectedEvent.eventId);
    }
  }, [selectedEvent]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await getMyApprovedEvents(1, 100);
      setEvents(data);
      if (data.length > 0) {
        setSelectedEvent(data[0]);
      }
    } catch {
      toast.error('Không thể tải danh sách sự kiện!');
    } finally {
      setLoading(false);
    }
  };

  const fetchFundData = async (eventId: string) => {
    try {
      const [fundRes, balanceRes, revenueRes, transactionsRes] = await Promise.all([
        getEventFund(eventId),
        getEventBalance(eventId),
        getEventRevenue(eventId),
        getEventTransactions(eventId)
      ]);

      setFundData(fundRes.data || null);
      setBalance(balanceRes.data || 0);
      setRevenue(revenueRes.data || 0);
      setTransactions(transactionsRes.data || []);
    } catch (error) {
      console.error('Error fetching fund data:', error);
      toast.error('Không thể tải dữ liệu quỹ!');
    }
  };

  const handleRequestWithdrawal = async () => {
    if (!selectedEvent || !withdrawalAmount) {
      toast.error('Vui lòng nhập số tiền!');
      return;
    }

    const amount = parseFloat(withdrawalAmount);
    if (amount <= 0 || amount > balance) {
      toast.error('Số tiền không hợp lệ!');
      return;
    }

    try {
      await requestWithdrawal(selectedEvent.eventId, amount);
      toast.success('Đã gửi yêu cầu rút tiền!');
      setShowWithdrawalModal(false);
      setWithdrawalAmount('');
      setWithdrawalNotes('');
      fetchFundData(selectedEvent.eventId);
    } catch {
      toast.error('Không thể gửi yêu cầu rút tiền!');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const getTransactionStatusText = (status: number) => {
    if (status === 0) return 'Thành công';
    if (status === 1) return 'Thất bại';
    return '';
  };

  const filteredTransactions = transactions.filter(transaction => {
    const search = searchTerm.toLowerCase();
    return (
      transaction.transactionId.toLowerCase().includes(search) ||
      transaction.orderId.toLowerCase().includes(search) ||
      transaction.amount.toString().includes(search) ||
      transaction.transactionDescription.toLowerCase().includes(search) ||
      formatDate(transaction.createdAt).includes(search) ||
      formatDateTime(transaction.createdAt).includes(search)
    ) &&
      (filterStatus === 'all' || transaction.transactionStatus.toString() === filterStatus);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e] text-white p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-xl text-green-300">Đang tải dữ liệu quỹ...</p>
        </div>
      </div>
    );
  }

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
          <div className="flex items-center gap-4 mb-6 lg:mb-0">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Wallet className="text-green-400" size={48} />
            </motion.div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                QUẢN LÝ QUỸ
              </h1>
              <p className="text-lg text-gray-300">Theo dõi doanh thu và quản lý rút tiền</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <Button 
              onClick={() => fetchFundData(selectedEvent?.eventId || '')}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-6 py-3 rounded-xl"
            >
              <RefreshCw className="mr-2" size={20} />
              Làm Mới
            </Button>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6 py-3 rounded-xl">
              <Download className="mr-2" size={20} />
              Xuất Báo Cáo
            </Button>
          </div>
        </div>

        {/* Event Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <label className="text-lg font-semibold text-green-300">Chọn Sự Kiện:</label>
            <select
              value={selectedEvent?.eventId || ''}
              onChange={(e) => {
                const event = events.find(ev => ev.eventId === e.target.value);
                setSelectedEvent(event || null);
              }}
              className="flex-1 p-3 rounded-xl bg-[#2d0036]/80 text-white border-2 border-green-500/30 focus:outline-none focus:border-green-400"
            >
              {events.map((event) => (
                <option key={event.eventId} value={event.eventId}>
                  {event.eventName} - {formatDate(event.startAt)}
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Fund Overview */}
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
          >
            <Card className="bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 border-2 border-green-500/30 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-300 text-sm font-semibold">Tổng Doanh Thu</p>
                    <p className="text-3xl font-bold text-green-400">{formatCurrency(revenue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 border-2 border-blue-500/30 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-300 text-sm font-semibold">Số Dư Khả Dụng</p>
                    <p className="text-3xl font-bold text-blue-400">{formatCurrency(balance)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 border-2 border-yellow-500/30 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-300 text-sm font-semibold">Đã Rút</p>
                    <p className="text-3xl font-bold text-yellow-400">
                      {formatCurrency(fundData?.totalWithdrawn || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 border-2 border-purple-500/30 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-300 text-sm font-semibold">Phí Platform</p>
                    <p className="text-3xl font-bold text-purple-400">
                      {formatCurrency(fundData?.platformFeePaid || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Fund Actions */}
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <div className="bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 rounded-2xl p-6 border-2 border-green-500/30 shadow-2xl">
              <h2 className="text-2xl font-bold text-green-300 mb-6">Yêu Cầu Rút Tiền</h2>
              <Button
                onClick={() => setShowWithdrawalModal(true)}
                disabled={balance <= 0}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-6 py-3 rounded-xl disabled:opacity-50"
              >
                <Download className="mr-2" size={20} />
                Yêu Cầu Rút Tiền
              </Button>
            </div>
          </motion.div>
        )}

        {/* Transactions */}
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 rounded-2xl p-6 border-2 border-blue-500/30 shadow-2xl"
          >
            <div className="flex flex-col lg:flex-row items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-blue-300 mb-4 lg:mb-0">Lịch Sử Giao Dịch</h2>
              
              <div className="flex gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    type="text"
                    placeholder="Tìm kiếm giao dịch..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-[#1a0022]/60 border-blue-500/30 text-white placeholder-gray-400"
                  />
                </div>
                
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 rounded-lg bg-[#1a0022]/60 border border-blue-500/30 text-white"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="0">Thành công</option>
                  <option value="1">Thất bại</option>
                </select>
              </div>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="text-gray-400 mx-auto mb-4" size={64} />
                <p className="text-gray-400 text-lg">Không có giao dịch nào</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-blue-500/30">
                      <th className="text-left p-4 text-blue-300 font-semibold">Transaction ID</th>
                      <th className="text-left p-4 text-blue-300 font-semibold">Order ID</th>
                      <th className="text-left p-4 text-blue-300 font-semibold">Mô Tả</th>
                      <th className="text-center p-4 text-blue-300 font-semibold">Số Tiền</th>
                      <th className="text-center p-4 text-blue-300 font-semibold">Trạng Thái</th>
                      <th className="text-center p-4 text-blue-300 font-semibold">Ngày Tạo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction, index) => (
                      <motion.tr
                        key={transaction.transactionId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border-b border-blue-500/10 hover:bg-blue-500/5 transition-colors"
                      >
                        <td className="p-4">{transaction.transactionId}</td>
                        <td className="p-4">{transaction.orderId}</td>
                        <td className="p-4">
                          <div>
                            <p className="font-semibold text-white">{transaction.transactionDescription}</p>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`font-semibold ${transaction.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(Math.abs(transaction.amount))}</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`text-sm font-semibold ${transaction.transactionStatus === 0 ? 'text-green-400' : 'text-red-400'}`}>{getTransactionStatusText(transaction.transactionStatus)}</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="text-gray-400 text-sm">{formatDateTime(transaction.createdAt)}</span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* Withdrawal Modal */}
        {showWithdrawalModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowWithdrawalModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gradient-to-br from-[#2d0036] to-[#3a0ca3] rounded-2xl p-8 border-2 border-green-500/30 shadow-2xl max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-green-300 mb-6">Yêu Cầu Rút Tiền</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-green-300 text-sm font-semibold mb-2">
                    Số Tiền (VND)
                  </label>
                  <Input
                    type="number"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    placeholder="Nhập số tiền muốn rút"
                    className="bg-[#1a0022]/60 border-green-500/30 text-white"
                  />
                  <p className="text-sm text-gray-400 mt-1">
                    Số dư khả dụng: {formatCurrency(balance)}
                  </p>
                </div>
                
                <div>
                  <label className="block text-green-300 text-sm font-semibold mb-2">
                    Ghi Chú (Tùy chọn)
                  </label>
                  <textarea
                    value={withdrawalNotes}
                    onChange={(e) => setWithdrawalNotes(e.target.value)}
                    placeholder="Ghi chú về yêu cầu rút tiền"
                    className="w-full p-3 rounded-lg bg-[#1a0022]/60 border border-green-500/30 text-white placeholder-gray-400 resize-none"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex gap-4 mt-6">
                <Button
                  onClick={handleRequestWithdrawal}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white"
                >
                  Gửi Yêu Cầu
                </Button>
                <Button
                  onClick={() => setShowWithdrawalModal(false)}
                  className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white"
                >
                  Hủy
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
} 