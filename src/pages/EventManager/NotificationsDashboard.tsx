import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Check, X, Trash2, Filter, Search, Mail, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  isRead: boolean;
  createdAt: string;
  category: string;
}

export default function NotificationsDashboard() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // Mock data - thay bằng API thực tế
      const mockNotifications: Notification[] = [
        {
          id: '1',
          title: 'Sự kiện mới được duyệt',
          message: 'Sự kiện "Workshop React 2024" đã được admin duyệt thành công.',
          type: 'success',
          isRead: false,
          createdAt: '2024-01-15T10:30:00Z',
          category: 'event'
        },
        {
          id: '2',
          title: 'Có vé mới được mua',
          message: 'Khách hàng đã mua 5 vé cho sự kiện "Concert Mùa Hè".',
          type: 'info',
          isRead: false,
          createdAt: '2024-01-15T09:15:00Z',
          category: 'ticket'
        },
        {
          id: '3',
          title: 'Cảnh báo: Sự kiện sắp diễn ra',
          message: 'Sự kiện "Tech Conference 2024" sẽ diễn ra trong 2 ngày tới.',
          type: 'warning',
          isRead: true,
          createdAt: '2024-01-14T16:45:00Z',
          category: 'reminder'
        },
        {
          id: '4',
          title: 'Lỗi hệ thống',
          message: 'Có lỗi xảy ra khi xử lý thanh toán. Vui lòng kiểm tra lại.',
          type: 'error',
          isRead: false,
          createdAt: '2024-01-14T14:20:00Z',
          category: 'system'
        },
        {
          id: '5',
          title: 'Cộng tác viên mới',
          message: 'Nguyễn Văn A đã được thêm làm cộng tác viên cho sự kiện.',
          type: 'info',
          isRead: true,
          createdAt: '2024-01-14T11:30:00Z',
          category: 'collaborator'
        },
        {
          id: '6',
          title: 'Đánh giá mới',
          message: 'Có đánh giá mới cho sự kiện "Workshop React 2024".',
          type: 'success',
          isRead: false,
          createdAt: '2024-01-14T10:15:00Z',
          category: 'review'
        }
      ];
      
      setNotifications(mockNotifications);
    } catch (error) {
      toast.error('Không thể tải thông báo!');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
    toast.success('Đã đánh dấu đã đọc!');
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    );
    toast.success('Đã đánh dấu tất cả đã đọc!');
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
    toast.success('Đã xóa thông báo!');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'error': return X;
      default: return Info;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-400 bg-green-400/20';
      case 'warning': return 'text-yellow-400 bg-yellow-400/20';
      case 'error': return 'text-red-400 bg-red-400/20';
      default: return 'text-blue-400 bg-blue-400/20';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Vừa xong';
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    if (diffInHours < 48) return 'Hôm qua';
    return date.toLocaleDateString('vi-VN');
  };

  const filteredNotifications = notifications.filter(notif => {
    const matchesFilter = filter === 'all' || notif.category === filter;
    const matchesSearch = notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notif.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a0022] via-[#3a0ca3] to-[#ff008e] text-white p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-400 mx-auto mb-4"></div>
          <p className="text-xl text-orange-300">Đang tải thông báo...</p>
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
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-center justify-between mb-12">
          <div className="flex items-center gap-4 mb-6 lg:mb-0">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Bell className="text-orange-400" size={48} />
            </motion.div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">
                THÔNG BÁO
              </h1>
              <p className="text-lg text-gray-300">Quản lý và theo dõi tất cả thông báo</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <Button 
              onClick={markAllAsRead}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-6 py-3 rounded-xl"
            >
              <Check className="mr-2" size={20} />
              Đánh Dấu Tất Cả Đã Đọc
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-6 py-3 rounded-xl">
              <Filter className="mr-2" size={20} />
              Cài Đặt
            </Button>
          </div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card className="bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 border-2 border-orange-500/30 shadow-2xl">
            <CardContent className="p-6 text-center">
              <Bell className="text-orange-400 mx-auto mb-4" size={32} />
              <p className="text-3xl font-bold text-orange-400">{notifications.length}</p>
              <p className="text-orange-300 text-sm">Tổng Thông Báo</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 border-2 border-red-500/30 shadow-2xl">
            <CardContent className="p-6 text-center">
              <Mail className="text-red-400 mx-auto mb-4" size={32} />
              <p className="text-3xl font-bold text-red-400">{unreadCount}</p>
              <p className="text-red-300 text-sm">Chưa Đọc</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 border-2 border-green-500/30 shadow-2xl">
            <CardContent className="p-6 text-center">
              <CheckCircle className="text-green-400 mx-auto mb-4" size={32} />
              <p className="text-3xl font-bold text-green-400">{notifications.length - unreadCount}</p>
              <p className="text-green-300 text-sm">Đã Đọc</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 border-2 border-blue-500/30 shadow-2xl">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="text-blue-400 mx-auto mb-4" size={32} />
              <p className="text-3xl font-bold text-blue-400">
                {notifications.filter(n => n.type === 'error').length}
              </p>
              <p className="text-blue-300 text-sm">Cảnh Báo</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col lg:flex-row gap-4 mb-8"
        >
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm thông báo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-4 pl-12 rounded-xl bg-[#2d0036]/80 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 border-2 border-orange-500/30"
            />
          </div>
          
          <div className="flex gap-2">
            {['all', 'event', 'ticket', 'reminder', 'system', 'collaborator', 'review'].map((filterType) => (
              <Button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === filterType
                    ? 'bg-orange-600 text-white'
                    : 'bg-[#2d0036]/60 text-gray-300 hover:bg-orange-600/20'
                }`}
              >
                {filterType === 'all' && 'Tất Cả'}
                {filterType === 'event' && 'Sự Kiện'}
                {filterType === 'ticket' && 'Vé'}
                {filterType === 'reminder' && 'Nhắc Nhở'}
                {filterType === 'system' && 'Hệ Thống'}
                {filterType === 'collaborator' && 'Cộng Tác'}
                {filterType === 'review' && 'Đánh Giá'}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Notifications List */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-[#2d0036]/90 to-[#3a0ca3]/90 rounded-2xl p-6 border-2 border-orange-500/30 shadow-2xl"
        >
          <h2 className="text-2xl font-bold text-orange-300 mb-6">Danh Sách Thông Báo</h2>
          
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="text-gray-400 mx-auto mb-4" size={64} />
              <p className="text-gray-400 text-lg">Không có thông báo nào</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification, index) => {
                const TypeIcon = getTypeIcon(notification.type);
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className={`p-4 rounded-xl border transition-all ${
                      notification.isRead 
                        ? 'bg-[#1a0022]/40 border-gray-600/30' 
                        : 'bg-[#1a0022]/80 border-orange-500/30 shadow-lg'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${getTypeColor(notification.type)}`}>
                        <TypeIcon size={20} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className={`font-semibold ${notification.isRead ? 'text-gray-400' : 'text-white'}`}>
                              {notification.title}
                            </h3>
                            <p className={`mt-1 ${notification.isRead ? 'text-gray-500' : 'text-gray-300'}`}>
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-xs text-gray-500">{formatDate(notification.createdAt)}</span>
                              <span className="text-xs px-2 py-1 bg-gray-600/30 rounded-full text-gray-400">
                                {notification.category}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            {!notification.isRead && (
                              <Button
                                onClick={() => markAsRead(notification.id)}
                                className="p-2 bg-green-600 hover:bg-green-500 text-white rounded-lg"
                                size="sm"
                              >
                                <Check size={16} />
                              </Button>
                            )}
                            <Button
                              onClick={() => deleteNotification(notification.id)}
                              className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-lg"
                              size="sm"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
} 