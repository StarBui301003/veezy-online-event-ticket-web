import { useEffect, useState } from 'react';
import { CheckCircle, ArrowLeft, Loader2, Bell, BellOff } from 'lucide-react';
import { getUserNotifications, markAllNotificationsRead } from '@/services/notification.service';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { connectNotificationHub, onNotification } from "@/services/signalr.service";
import { format } from 'date-fns';

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

  const loadNotifications = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const res = await getUserNotifications(userId, 1, 100);
      
      if (res?.data?.success) {
        const items = Array.isArray(res.data.data?.items) 
          ? res.data.data.items 
          : Array.isArray(res.data.data)
            ? res.data.data
            : [];
        
        const processedItems = items.map(item => ({
          notificationId: item.notificationId || item.id || '',
          userId: item.userId || '',
          notificationTitle: item.notificationTitle || item.title || 'No Title',
          notificationMessage: item.notificationMessage || item.message || 'No message',
          notificationType: item.notificationType || 0,
          isRead: item.isRead || false,
          redirectUrl: item.redirectUrl || '',
          createdAt: item.createdAt || new Date().toISOString(),
          createdAtVietnam: item.createdAtVietnam || new Date().toLocaleString('vi-VN')
        }));
        
        const sortedItems = [...processedItems].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        setNotifications(sortedItems);
      } else {
        console.error('Failed to load notifications:', res?.data?.message || 'No success response');
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!userId || notifications.length === 0) return;
    
    setMarkingRead(true);
    try {
      const response = await markAllNotificationsRead(userId);
      
      if (response?.data?.success) {
        setNotifications(prev => 
          prev.map(n => ({
            ...n, 
            isRead: true,
            readAt: new Date().toISOString(),
            readAtVietnam: new Date().toLocaleString('vi-VN')
          }))
        );
      } else {
        console.error('Failed to mark all as read:', response?.data?.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setMarkingRead(false);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.redirectUrl) {
      navigate(notification.redirectUrl);
    }
  };

  const formatNotificationDate = (date: string) => {
    return format(new Date(date), 'PPpp');
  };

  useEffect(() => {
    let isMounted = true;
    
    const loadAndSubscribe = async () => {
      await loadNotifications();
      
      // Connect to SignalR hub
      connectNotificationHub();
      
      // Subscribe to notifications
      onNotification('ReceiveNotification', (newNotification: Notification) => {
        if (!isMounted) return;
        
        setNotifications(prev => [{
          ...newNotification,
          isRead: false,
          createdAt: new Date().toISOString(),
          createdAtVietnam: new Date().toLocaleString('vi-VN')
        }, ...prev]);
      });
    };
    
    loadAndSubscribe().catch(console.error);
    
    // Cleanup function
    return () => {
      isMounted = false;
      // No need to stop the connection here as it's managed by the signalr service
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const unreadCount = notifications.filter(notification => !notification.isRead).length;

  return (
    <div className={`min-h-screen ${isEventManager ? 'bg-gray-900 text-gray-100' : 'bg-gray-50'}`}>
      <div className={`max-w-4xl mx-auto p-4 sm:p-6 ${isEventManager ? 'pt-20' : ''}`}>
        {/* Header */}
        <div className={`flex items-center justify-between mb-6 p-4 rounded-lg ${
          isEventManager ? 'bg-gray-800' : 'bg-white shadow-sm'
        }`}>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate(-1)}
              className={`p-2 rounded-full ${
                isEventManager 
                  ? 'hover:bg-gray-700 text-gray-300' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold">
              {t('notifications')}
            </h1>
            {unreadCount > 0 && (
              <span className={`px-2 py-1 text-xs rounded-full ${
                isEventManager 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {unreadCount} {t('new')}
              </span>
            )}
          </div>
          
          {notifications.length > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markingRead || unreadCount === 0}
              className={`px-3 py-1.5 rounded-md text-sm flex items-center ${
                isEventManager
                  ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-700'
                  : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300'
              }`}
            >
              {markingRead ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              {t('markAllAsRead')}
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className={`rounded-xl overflow-hidden ${
          isEventManager 
            ? 'bg-gray-800 border border-gray-700' 
            : 'bg-white shadow-sm border border-gray-200'
        }`}>
          {notifications.length === 0 ? (
            <div className="text-center py-16 px-4">
              <BellOff className={`w-14 h-14 mx-auto mb-4 ${
                isEventManager ? 'text-gray-600' : 'text-gray-300'
              }`} />
              <h3 className={`text-lg font-medium mb-1 ${
                isEventManager ? 'text-gray-200' : 'text-gray-900'
              }`}>
                {t('noNotifications')}
              </h3>
              <p className={isEventManager ? 'text-gray-400' : 'text-gray-500'}>
                {t('noNotificationsDescription')}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.map((notification) => (
                <li 
                  key={notification.notificationId}
                  className={`p-4 cursor-pointer transition-colors ${
                    isEventManager 
                      ? 'hover:bg-gray-750' 
                      : 'hover:bg-gray-50'
                  } ${
                    !notification.isRead 
                      ? isEventManager 
                        ? 'bg-gray-750' 
                        : 'bg-blue-50'
                      : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      notification.isRead 
                        ? isEventManager 
                          ? 'bg-gray-700' 
                          : 'bg-gray-100'
                        : 'bg-blue-100 dark:bg-blue-900/50'
                    }`}>
                      <Bell className={`h-5 w-5 ${
                        notification.isRead 
                          ? isEventManager 
                            ? 'text-gray-400' 
                            : 'text-gray-400'
                          : 'text-blue-600 dark:text-blue-400'
                      }`} />
                    </div>
                    <div className="ml-3 flex-1">
                      <p className={`text-sm ${
                        !notification.isRead 
                          ? 'font-semibold text-gray-900 dark:text-white' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {notification.notificationTitle}
                      </p>
                      <p className={`mt-1 text-sm ${
                        isEventManager ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {notification.notificationMessage}
                      </p>
                      <div className={`mt-1 text-xs ${
                        isEventManager ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {formatNotificationDate(notification.createdAt)}
                      </div>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}