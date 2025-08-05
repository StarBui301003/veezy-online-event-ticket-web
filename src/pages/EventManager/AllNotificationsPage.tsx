import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, ArrowLeft, Loader2, Bell, BellOff, RefreshCw, CheckCheck } from 'lucide-react';
import { getUserNotifications, markAllNotificationsRead, markNotificationRead } from '@/services/notification.service';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { connectNotificationHub, onNotification } from "@/services/signalr.service";
import { format } from 'date-fns';
import { getNotificationIcon } from '@/components/common/getNotificationIcon';

interface Notification {
  notificationId: string;
  userId: string;
  notificationTitle: string;
  notificationMessage: string;
  notificationType: number;
  isRead: boolean;
  redirectUrl?: string;
  createdAt: string;
  createdAtVietnam?: string;
  readAt?: string;
  readAtVietnam?: string;
}

export default function AllNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  
  const isEventManager = location.pathname.startsWith('/event-manager');
  const accountStr = typeof window !== 'undefined' ? localStorage.getItem('account') : null;
  const userId = accountStr ? (() => { 
    try { 
      const account = JSON.parse(accountStr);
      return account.userId || account.accountId; 
    } catch { 
      return null; 
    } 
  })() : null;

  const loadNotifications = useCallback(async (showLoader = true) => {
    if (!userId) {
      setLoading(false);
      setError('User ID not found');
      return;
    }
    if (showLoader) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const userRole = isEventManager ? 2 : 1;
      const res = await getUserNotifications(userId, 1, 100, userRole);
      console.log('API Response:', res);
      // Check for API success using 'flag' field (as per API spec)
      if (res?.data?.flag === true) {
        const items = Array.isArray(res.data.data?.items)
          ? res.data.data.items
          : [];
        if (items.length === 0) {
          console.log('No notifications found');
          setNotifications([]);
        } else {
          const processedItems = items.map(item => ({
            notificationId: item.notificationId || '',
            userId: item.userId || '',
            notificationTitle: item.notificationTitle || 'No Title',
            notificationMessage: item.notificationMessage || 'No message',
            notificationType: item.notificationType || 0,
            isRead: item.isRead || false,
            redirectUrl: item.redirectUrl || '',
            createdAt: item.createdAt || new Date().toISOString(),
            createdAtVietnam: item.createdAtVietnam || item.createdAt || new Date().toISOString(),
            readAt: item.readAt,
            readAtVietnam: item.readAtVietnam || item.readAt
          }));
          console.log('Processed items:', processedItems);
          const sortedItems = [...processedItems].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setNotifications(sortedItems);
        }
      } else {
        const errorMsg = res?.data?.message || `API returned flag: ${res?.data?.flag}, code: ${res?.data?.code}`;
        console.error('API Error:', errorMsg);
        setError(errorMsg);
        setNotifications([]);
      }
    } catch {
      setError('Failed to fetch notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, isEventManager]);

  const handleMarkAllAsRead = async () => {
    if (!userId || notifications.length === 0) return;
    
    const unreadNotifications = notifications.filter(n => !n.isRead);
    if (unreadNotifications.length === 0) return;
    
    setMarkingRead(true);
    try {
      console.log('Marking all as read for userId:', userId);
      const response = await markAllNotificationsRead(userId);
      console.log('Mark all as read response:', response);
      
      if (response?.data?.flag === true) {
        const now = new Date();
        setNotifications(prev => 
          prev.map(n => ({
            ...n, 
            isRead: true,
            readAt: now.toISOString(),
            readAtVietnam: now.toISOString()
          }))
        );
        console.log('All notifications marked as read successfully');
      } else {
        const errorMsg = response?.data?.message || `API returned flag: ${response?.data?.flag}, code: ${response?.data?.code}`;
        console.error('Mark all as read error:', errorMsg);
        setError(errorMsg);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      setError(error instanceof Error ? error.message : 'Failed to mark all as read');
    } finally {
      setMarkingRead(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.isRead && userId) {
      try {
        await markNotificationRead(notification.notificationId, userId);
        setNotifications(prev => 
          prev.map(n => 
            n.notificationId === notification.notificationId 
              ? { ...n, isRead: true, readAt: new Date().toISOString(), readAtVietnam: new Date().toLocaleString('vi-VN') }
              : n
          )
        );
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Navigate to redirect URL if available
    if (notification.redirectUrl) {
      navigate(notification.redirectUrl);
    }
  };

  const formatNotificationDate = (date: string) => {
    try {
      return format(new Date(date), 'PPpp');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return date;
    }
  };

  const handleRefresh = () => {
    loadNotifications(false);
  };

  useEffect(() => {
    let isMounted = true;
    
    const loadAndSubscribe = async () => {
      await loadNotifications();
      
      // Connect to SignalR hub
      try {
        const token = localStorage.getItem('access_token') || localStorage.getItem('token');
        connectNotificationHub('http://localhost:5003/hubs/notifications', token || undefined);
        
        // Subscribe to new notifications
        onNotification('ReceiveNotification', (newNotification: Notification) => {
          if (!isMounted) return;
          
          console.log('Received new notification via SignalR:', newNotification);
          setNotifications(prev => [{
            ...newNotification,
            isRead: false,
            createdAt: newNotification.createdAt || new Date().toISOString(),
            createdAtVietnam: newNotification.createdAtVietnam || new Date().toLocaleString('vi-VN')
          }, ...prev]);
        });

        // Subscribe to notification read events
        onNotification('NotificationRead', (data: { notificationId: string, userId: string }) => {
          if (!isMounted || data.userId !== userId) return;
          
          console.log('Notification marked as read via SignalR:', data);
          setNotifications(prev => 
            prev.map(n => 
              n.notificationId === data.notificationId 
                ? { ...n, isRead: true, readAt: new Date().toISOString() }
                : n
            )
          );
        });

        // Subscribe to all notifications read events
        onNotification('AllNotificationsRead', (readUserId: string) => {
          if (!isMounted || readUserId !== userId) return;
          
          console.log('All notifications marked as read via SignalR');
          setNotifications(prev => 
            prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
          );
        });

        // Subscribe to notifications fetched events (auto-refresh)
        onNotification('UserNotificationsFetched', (data: { items: Notification[] }) => {
          if (!isMounted) return;
          
          console.log('User notifications refreshed via SignalR:', data);
          // Auto-refresh the UI with new data
          if (data && Array.isArray(data.items)) {
            const processedItems = data.items.map((item: Notification) => ({
              notificationId: item.notificationId || '',
              userId: item.userId || '',
              notificationTitle: item.notificationTitle || 'No Title',
              notificationMessage: item.notificationMessage || 'No message',
              notificationType: item.notificationType || 0,
              isRead: item.isRead || false,
              redirectUrl: item.redirectUrl || '',
              createdAt: item.createdAt || new Date().toISOString(),
              createdAtVietnam: item.createdAtVietnam || item.createdAt || new Date().toISOString(),
              readAt: item.readAt,
              readAtVietnam: item.readAtVietnam || item.readAt
            }));
            
            const sortedItems = [...processedItems].sort((a, b) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            
            setNotifications(sortedItems);
          }
        });

        // Subscribe to notification deletion events (if implemented)
        onNotification('NotificationDeleted', (data: { notificationId: string, userId: string }) => {
          if (!isMounted || data.userId !== userId) return;
          
          console.log('Notification deleted via SignalR:', data);
          setNotifications(prev => 
            prev.filter(n => n.notificationId !== data.notificationId)
          );
        });

        // Subscribe to notification updates (if notification content changes)
        onNotification('NotificationUpdated', (updatedNotification: Notification) => {
          if (!isMounted || updatedNotification.userId !== userId) return;
          
          console.log('Notification updated via SignalR:', updatedNotification);
          setNotifications(prev => 
            prev.map(n => 
              n.notificationId === updatedNotification.notificationId 
                ? { ...updatedNotification }
                : n
            )
          );
        });
      } catch (error) {
        console.error('SignalR connection error:', error);
      }
    };
    
    loadAndSubscribe().catch(console.error);
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [userId, loadNotifications]);

  if (loading) {
    return (
      <div className={`min-h-screen bg-gray-900 text-gray-100`}>
        <div className="relative">
          <div className="absolute inset-0 bg-gray-900 -mt-24 pt-24">
            <div className="max-w-4xl mx-auto p-4 sm:p-6">
              <div className="flex justify-center items-center h-64">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
                  <p className="text-gray-300">
                    {t('loading') || 'Đang tải thông báo...'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter(notification => !notification.isRead).length;

  return (
    <div className={`min-h-screen bg-gray-900 text-gray-100`}>
      {/* Main content with spacing for the fixed header */}
      <div className="pt-20">
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 p-4 rounded-xl bg-gray-800 border border-gray-700 sticky top-20 z-10">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate(-1)}
                className="p-2 rounded-full transition-colors hover:bg-gray-700 text-gray-300 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-2">
                <Bell className="w-6 h-6 text-blue-400" />
                <h1 className="text-xl font-semibold text-white">
                  {t('notifications') || 'Thông báo'}
                </h1>
              </div>
              
              {unreadCount > 0 && (
                <span className="px-3 py-1 text-xs rounded-full font-semibold bg-blue-900/50 text-blue-300 border border-blue-700">
                  {unreadCount} {t('new') || 'mới'}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 rounded-lg transition-all hover:bg-gray-700 text-gray-400 hover:text-white"
                title={t('refresh') || 'Làm mới'}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              
              {notifications.length > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={markingRead || unreadCount === 0}
                  className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 font-medium transition-all ${
                    unreadCount === 0
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 active:scale-95'
                  }`}
                >
                  {markingRead ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : unreadCount === 0 ? (
                    <CheckCheck className="w-4 h-4" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {unreadCount === 0 
                    ? (t('allRead') || 'Đã đọc hết')
                    : (t('markAllAsRead') || 'Đọc tất cả')
                  }
                </button>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 rounded-xl border bg-red-900/20 border-red-700 text-red-300">
              <p className="text-sm">
                <strong>{t('error') || 'Lỗi'}:</strong> {error}
              </p>
              <button 
                onClick={() => loadNotifications()}
                className="mt-2 text-sm underline text-red-400 hover:text-red-300"
              >
                {t('retry') || 'Thử lại'}
              </button>
            </div>
          )}

        
          {/* Notifications List */}
          <div className="rounded-xl overflow-hidden bg-gray-800 border border-gray-700">
            {notifications.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="relative inline-block">
                  <BellOff className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  {!error && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                  )}
                </div>
                <h3 className="text-lg font-medium mb-2 text-gray-200">
                  {error ? (t('errorLoadingNotifications') || 'Không thể tải thông báo') : (t('noNotifications') || 'Không có thông báo')}
                </h3>
                <p className="text-sm text-gray-400">
                  {error 
                    ? (t('checkConnectionAndRetry') || 'Kiểm tra kết nối và thử lại')
                    : (t('noNotificationsDescription') || 'Các thông báo sẽ xuất hiện ở đây khi có cập nhật mới')
                  }
                </p>
                {error && (
                  <button 
                    onClick={() => loadNotifications()}
                    className="mt-4 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {t('retry') || 'Thử lại'}
                  </button>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-gray-700">
                {notifications.map((notification) => (
                  <li 
                    key={notification.notificationId}
                    className={`p-4 cursor-pointer transition-all duration-200 hover:bg-gray-750 ${
                      !notification.isRead 
                        ? 'bg-gray-750 border-l-4 border-blue-500'
                        : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Unread indicator */}
                      {!notification.isRead && (
                        <div className="absolute left-2 top-6 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      )}
                      
                      {/* Icon */}
                      <div className={`flex-shrink-0 p-2.5 rounded-full transition-all ${
                        !notification.isRead 
                          ? 'bg-blue-900/50 text-blue-400'
                          : 'bg-gray-700 text-gray-400'
                      }`}>
                        {getNotificationIcon ? getNotificationIcon(notification.notificationType) : <Bell className="w-5 h-5" />}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium mb-1 ${
                          !notification.isRead 
                            ? 'text-white'
                            : 'text-gray-300'
                        }`}>
                          {notification.notificationTitle}
                        </p>
                        <p className="text-sm mb-2 line-clamp-2 text-gray-400">
                          {notification.notificationMessage}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {formatNotificationDate(notification.createdAt)}
                          </span>
                          {!notification.isRead && (
                            <span className="px-2 py-1 text-xs rounded-full font-medium bg-blue-900/50 text-blue-300 border border-blue-700">
                              {t('new') || 'Mới'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}