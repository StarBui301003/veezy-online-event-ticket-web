import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, DollarSign, Users, Calendar, ArrowUpRight, Ticket, Percent, ChartBar, Newspaper, Bell, MessageCircle, Eye, Clock, CheckCircle, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getMyEvents, getEventFund, getCollaboratorsForEvent } from '@/services/Event Manager/event.service';
import { toast } from 'react-toastify';
import { getUserNotifications } from '@/services/notification.service';

interface Event {
  eventId: string;
  eventName: string;
  eventLocation: string;
  startAt: string;
  endAt: string;
  isApproved: number;
  isCancelled: boolean;
}

interface DashboardStats {
  totalEvents: number;
  pendingEvents: number;
  approvedEvents: number;
  totalRevenue: number;
  totalCollaborators: number;
}

interface NotificationApi {
  notificationId: string;
  notificationTitle: string;
  notificationMessage: string;
  notificationType: number;
  isRead: boolean;
  createdAt: string;
  createdAtVietnam?: string;
  category?: string;
}

export default function EventManagerHome() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    pendingEvents: 0,
    approvedEvents: 0,
    totalRevenue: 0,
    totalCollaborators: 0,
  });

  const [notifDropdown, setNotifDropdown] = useState(false);
  const [notifications, setNotifications] = useState<NotificationApi[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [notifPage, setNotifPage] = useState(1);
  const [notifHasMore, setNotifHasMore] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const fetchNotifs = async (page = 1, append = false) => {
      try {
        setNotifLoading(true);
        const accStr = localStorage.getItem('account');
        const userId = accStr ? JSON.parse(accStr).userId : null;
        if (!userId) return;
        const res = await getUserNotifications(userId, page, 5);
        const items = res.data?.data?.items || [];
        if (append) {
          setNotifications(prev => [...prev, ...items]);
        } else {
          setNotifications(items);
        }
        setNotifHasMore(items.length === 5); // Nếu trả về đủ 5 thì còn nữa
      } finally {
        setNotifLoading(false);
      }
    };
    if (notifDropdown) fetchNotifs(1, false);
  }, [notifDropdown]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifDropdown(false);
      }
    };
    if (notifDropdown) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [notifDropdown]);

  const fetchDashboardData = async () => {
    try {
      const eventData = await getMyEvents(1, 1000); // Assuming 1000 events is enough
      const allEvents: Event[] = Array.isArray(eventData.items) ? eventData.items : [];
      
      const approvedEventsList = allEvents.filter(e => e.isApproved === 1 && !e.isCancelled);
      const pendingEventsCount = allEvents.filter(e => e.isApproved === 0 && !e.isCancelled).length;

      let totalRevenue = 0;
      let totalCollaborators = 0;

      if (approvedEventsList.length > 0) {
        const fundPromises = approvedEventsList.map(e => getEventFund(e.eventId));
        const collaboratorPromises = approvedEventsList.map(e => getCollaboratorsForEvent(e.eventId));

        const fundResults = await Promise.all(fundPromises);
        totalRevenue = fundResults.reduce((sum, res) => sum + (res.data?.totalRevenue || 0), 0);
        
        const collaboratorResults = await Promise.all(collaboratorPromises);
        totalCollaborators = collaboratorResults.reduce((sum, res) => sum + (Array.isArray(res) ? res.length : 0), 0);
      }

      setStats({
        totalEvents: pendingEventsCount + approvedEventsList.length,
        pendingEvents: pendingEventsCount,
        approvedEvents: approvedEventsList.length,
        totalRevenue: totalRevenue,
        totalCollaborators: totalCollaborators,
      });

    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
      toast.error('Không thể tải dữ liệu dashboard!');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const dashboardSections = [
    {
      title: "Quản lý sự kiện",
      icon: Calendar,
      color: "from-blue-500 to-cyan-500",
      items: [
        { name: "Tạo sự kiện mới", path: "/event-manager/create-event", icon: Plus },
        { name: "Đang chờ duyệt", path: "/event-manager/pending-events", icon: Clock, count: stats.pendingEvents },
        { name: "Đã duyệt", path: "/event-manager/approved-events", icon: CheckCircle, count: stats.approvedEvents },
        { name: "Cộng tác viên", path: "/event-manager/collaborators", icon: Users, count: stats.totalCollaborators }
      ]
    },
    {
      title: "Quản lý vé",
      icon: Ticket,
      color: "from-green-500 to-emerald-500",
      items: [
        { name: "Quản lý vé", path: "/event-manager/tickets/manage", icon: Ticket },
        { name: "Mã giảm giá", path: "/event-manager/discount-codes", icon: Percent },
        { name: "Theo dõi bán vé", path: "/event-manager/ticket-sales", icon: ChartBar },
        { name: "Check-in & QR", path: "/event-manager/check-ins", icon: CheckCircle }
      ]
    },
    {
      title: "Báo cáo & Phân tích",
      icon: ChartBar,
      color: "from-purple-500 to-pink-500",
      items: [
        { name: "Tổng quan", path: "/event-manager/analytics/overview", icon: ChartBar },
        { name: "Danh sách tham gia", path: "/event-manager/analytics/participants", icon: Users },
        { name: "Đánh giá sự kiện", path: "/event-manager/reviews", icon: Eye },
        { name: "Dự đoán AI", path: "/event-manager/analytics/predictions", icon: ChartBar }
      ]
    },
    {
      title: "Nội dung & Liên lạc",
      icon: Newspaper,
      color: "from-orange-500 to-red-500",
      items: [
        { name: "Quản lý tin tức", path: "/event-manager/news", icon: Newspaper },
        { name: "Thông báo", path: "/event-manager/notifications", icon: Bell },
        { name: "Chat hỗ trợ", path: "/event-manager/chat", icon: MessageCircle }
      ]
    }
  ];

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
          <motion.h1 
            className="text-5xl lg:text-6xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-yellow-400 to-purple-400 mb-6 lg:mb-0"
            animate={{ 
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{ backgroundSize: '200% 200%' }}
          >
            EVENT MANAGER DASHBOARD
          </motion.h1>
          <div className="flex items-center gap-4">
            <Link to="/event-manager/create-event">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white px-8 py-4 rounded-2xl text-lg shadow-2xl">
                  <Plus size={24} className="mr-2" /> Tạo Sự Kiện Mới
                </Button>
              </motion.div>
            </Link>
            {/* Nút chuông thông báo */}
            <div className="relative" ref={notifRef}>
              <button
                className="ml-1 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 hover:scale-110 transition-all shadow-lg relative"
                onClick={() => setNotifDropdown((v) => !v)}
                title="Thông báo"
              >
                <Bell className="text-white text-2xl" />
                {notifications.some(n => !n.isRead) && (
                  <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
              </button>
              {notifDropdown && (
                <div className="absolute right-0 z-30 mt-2 w-80 bg-white text-gray-900 rounded-xl shadow-2xl border border-pink-400/30 overflow-hidden animate-fadeIn">
                  <div className="p-4 border-b font-bold text-pink-600 flex items-center gap-2">
                    <Bell className="text-pink-400" /> Thông báo mới
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifLoading ? (
                      <div className="p-4 text-center text-gray-400">Đang tải...</div>
                    ) : notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-400">Không có thông báo mới</div>
                    ) : notifications.map((n) => (
                      <div key={n.notificationId} className={`px-4 py-3 border-b last:border-b-0 ${n.isRead ? 'bg-white' : 'bg-pink-50'}`}> 
                        <div className="font-semibold text-sm text-pink-700 truncate">{n.notificationTitle}</div>
                        <div className="text-xs text-gray-600 truncate">{n.notificationMessage}</div>
                        <div className="text-[10px] text-gray-400 mt-1">{n.createdAtVietnam || n.createdAt}</div>
                      </div>
                    ))}
                  </div>
                  <button
                    className={`w-full py-3 text-center text-pink-600 font-semibold hover:bg-pink-50 border-t border-pink-100 ${!notifHasMore ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={async () => {
                      if (!notifHasMore) return;
                      const nextPage = notifPage + 1;
                      setNotifPage(nextPage);
                      setNotifLoading(true);
                      const accStr = localStorage.getItem('account');
                      const userId = accStr ? JSON.parse(accStr).userId : null;
                      if (!userId) return;
                      const res = await getUserNotifications(userId, nextPage, 5);
                      const items = res.data?.data?.items || [];
                      setNotifications(prev => [...prev, ...items]);
                      setNotifHasMore(items.length === 5);
                      setNotifLoading(false);
                    }}
                    disabled={!notifHasMore}
                  >
                    {notifHasMore ? 'Xem thông báo trước đó' : 'Đã xem hết thông báo'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
        >
          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 border-2 border-pink-500/30 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-pink-300 text-sm font-semibold">Tổng Sự Kiện</p>
                    <p className="text-3xl font-bold text-yellow-400">{stats.totalEvents}</p>
                  </div>
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Calendar className="text-pink-400" size={32} />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 border-2 border-pink-500/30 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-pink-300 text-sm font-semibold">Tổng Doanh Thu</p>
                    <p className="text-3xl font-bold text-green-400">{formatCurrency(stats.totalRevenue)}</p>
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <DollarSign className="text-green-400" size={32} />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 border-2 border-pink-500/30 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-pink-300 text-sm font-semibold">Sự kiện đã duyệt</p>
                    <p className="text-3xl font-bold text-blue-400">{stats.approvedEvents}</p>
                  </div>
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <CheckCircle className="text-blue-400" size={32} />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 border-2 border-pink-500/30 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-pink-300 text-sm font-semibold">Cộng tác viên</p>
                    <p className="text-3xl font-bold text-purple-400">{stats.totalCollaborators}</p>
                  </div>
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  >
                    <Users className="text-purple-400" size={32} />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Dashboard Sections */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {dashboardSections.map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              variants={itemVariants}
              className="bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 rounded-2xl p-6 border-2 border-pink-500/30 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${section.color}`}>
                  <section.icon className="text-white" size={24} />
                </div>
                <h2 className="text-2xl font-bold text-white">{section.title}</h2>
              </div>
              
              <div className="space-y-3">
                {section.items.map((item, itemIndex) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: sectionIndex * 0.1 + itemIndex * 0.05 }}
                  >
                    <Link to={item.path}>
                      <div className="flex items-center justify-between p-4 bg-[#1a0022]/60 rounded-xl border border-pink-500/20 hover:border-pink-400/40 transition-all duration-200 group">
                        <div className="flex items-center gap-3">
                          <item.icon className="text-pink-400 group-hover:text-pink-300 transition-colors" size={20} />
                          <span className="text-white font-medium group-hover:text-pink-200 transition-colors">
                            {item.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.count !== undefined && (
                            <span className="px-2 py-1 bg-pink-500/20 text-pink-300 text-xs font-bold rounded-full">
                              {item.count}
                            </span>
                          )}
                          <ArrowUpRight className="text-pink-400 group-hover:text-pink-300 transition-colors" size={16} />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-12"
        >
          <h3 className="text-2xl font-bold text-cyan-300 mb-6">Hành Động Nhanh</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link to="/event-manager/create-event">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 rounded-2xl p-6 border-2 border-cyan-500/30 shadow-2xl hover:border-cyan-400 transition-all cursor-pointer"
              >
                <div className="text-center">
                  <Plus className="text-cyan-400 mx-auto mb-4" size={40} />
                  <h4 className="text-lg font-bold text-cyan-300 mb-2">Tạo Sự Kiện</h4>
                  <p className="text-gray-400 text-sm">Tạo sự kiện mới</p>
                </div>
              </motion.div>
            </Link>

            <Link to="/event-manager/ticket-sales">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 rounded-2xl p-6 border-2 border-green-500/30 shadow-2xl hover:border-green-400 transition-all cursor-pointer"
              >
                <div className="text-center">
                  <ChartBar className="text-green-400 mx-auto mb-4" size={40} />
                  <h4 className="text-lg font-bold text-green-300 mb-2">Báo Cáo Bán Vé</h4>
                  <p className="text-gray-400 text-sm">Xem thống kê bán vé</p>
                </div>
              </motion.div>
            </Link>

            <Link to="/event-manager/analytics/overview">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 rounded-2xl p-6 border-2 border-purple-500/30 shadow-2xl hover:border-purple-400 transition-all cursor-pointer"
              >
                <div className="text-center">
                  <ChartBar className="text-purple-400 mx-auto mb-4" size={40} />
                  <h4 className="text-lg font-bold text-purple-300 mb-2">Phân Tích</h4>
                  <p className="text-gray-400 text-sm">Xem báo cáo chi tiết</p>
                </div>
              </motion.div>
            </Link>

            <Link to="/event-manager/notifications">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 rounded-2xl p-6 border-2 border-orange-500/30 shadow-2xl hover:border-orange-400 transition-all cursor-pointer"
              >
                <div className="text-center">
                  <Bell className="text-orange-400 mx-auto mb-4" size={40} />
                  <h4 className="text-lg font-bold text-orange-300 mb-2">Thông Báo</h4>
                  <p className="text-gray-400 text-sm">Xem thông báo mới</p>
                </div>
              </motion.div>
            </Link>
          </div>

          {/* Additional Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            <Link to="/event-manager/fund-management">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 rounded-2xl p-6 border-2 border-emerald-500/30 shadow-2xl hover:border-emerald-400 transition-all cursor-pointer"
              >
                <div className="text-center">
                  <Wallet className="text-emerald-400 mx-auto mb-4" size={40} />
                  <h4 className="text-lg font-bold text-emerald-300 mb-2">Quản Lý Quỹ</h4>
                  <p className="text-gray-400 text-sm">Theo dõi doanh thu & rút tiền</p>
                </div>
              </motion.div>
            </Link>

            <Link to="/event-manager/collaborators">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 rounded-2xl p-6 border-2 border-blue-500/30 shadow-2xl hover:border-blue-400 transition-all cursor-pointer"
              >
                <div className="text-center">
                  <Users className="text-blue-400 mx-auto mb-4" size={40} />
                  <h4 className="text-lg font-bold text-blue-300 mb-2">Cộng Tác Viên</h4>
                  <p className="text-gray-400 text-sm">Quản lý team</p>
                </div>
              </motion.div>
            </Link>

            <Link to="/event-manager/news">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 rounded-2xl p-6 border-2 border-pink-500/30 shadow-2xl hover:border-pink-400 transition-all cursor-pointer"
              >
                <div className="text-center">
                  <Newspaper className="text-pink-400 mx-auto mb-4" size={40} />
                  <h4 className="text-lg font-bold text-pink-300 mb-2">Tin Tức</h4>
                  <p className="text-gray-400 text-sm">Quản lý nội dung</p>
                </div>
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
