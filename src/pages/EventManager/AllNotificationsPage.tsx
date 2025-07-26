import { useEffect, useState } from 'react';
import { Check, ArrowLeft, Loader2, AlertCircle, Mail, Star, Settings } from 'lucide-react';
import { getUserNotifications, markAllNotificationsRead } from '@/services/notification.service';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { connectNotificationHub, onNotification } from "@/services/signalr.service";

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
  const [notifLoading, setNotifLoading] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Lấy userId từ localStorage (giả định giống các nơi khác)
  const accountStr = typeof window !== 'undefined' ? localStorage.getItem('account') : null;
  const userId = accountStr ? (() => { try { return JSON.parse(accountStr).userId; } catch { return null; } })() : null;

  // Load notifications function
  const loadNotifications = async () => {
    if (!userId) return;
    setNotifLoading(true);
    try {
      const res = await getUserNotifications(userId, 1, 1000);
      const items = res.data?.data?.items || [];
      setNotifications(items);
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [userId]);

  // SignalR real-time updates
  useEffect(() => {
    if (!userId) return;
    
    connectNotificationHub('http://localhost:5006/notificationHub');
    
    // Listen for new notifications
    onNotification('NotificationCreated', () => {
      loadNotifications();
    });

    onNotification('NotificationUpdated', () => {
      loadNotifications();
    });

    onNotification('NotificationRead', () => {
      loadNotifications();
    });

    onNotification('AllNotificationsRead', () => {
      loadNotifications();
    });
  }, [userId]);

  const handleReadAll = async () => {
    if (userId) {
      setMarkingRead(true);
      await markAllNotificationsRead(userId);
      const res = await getUserNotifications(userId, 1, 1000);
      const items = res.data?.data?.items || [];
      setNotifications(items.map(item => ({ ...item, isRead: true })));
      setMarkingRead(false);
    }
  };


  const getNotificationIcon = (type: number) => {
    switch (type) {
      case 1: return <Star className="w-4 h-4 text-yellow-400" />;
      case 2: return <Settings className="w-4 h-4 text-blue-400" />;
      case 3: return <AlertCircle className="w-4 h-4 text-orange-400" />;
      default: return <Mail className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Main content */}
      <div className="max-w-4xl mx-auto p-6 pt-8">
        {/* Action buttons below header */}
        <div className="flex items-center mb-6 gap-4 mt-16">
          <div className="flex-1">
            <button
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors group px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-sm font-medium">{t('Back')}</span>
            </button>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-lg hover:shadow-purple-500/25"
            onClick={handleReadAll}
            disabled={markingRead || notifications.length === 0 || notifications.every(n => n.isRead)}
          >
            {markingRead ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {t('Mark All As Read')}
          </button>
        </div>
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          {/* Notifications list */}
          <div className="max-h-[600px] overflow-y-auto">
            {notifLoading && notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400 mb-4" />
                <p className="text-white/60">{t('Loading Notifications')}</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <p className="text-white/60 text-lg">{t('No Notifications')}</p>
                <p className="text-white/40 text-sm mt-2">{t('New Notifications Will Appear Here')}</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {notifications.map((notification, index) => (
                  <div
                    key={notification.notificationId}
                    className={`group relative px-6 py-4 transition-all duration-200 cursor-pointer hover:bg-white/5 ${
                      !notification.isRead ? 'bg-gradient-to-r from-purple-600/10 to-transparent' : ''
                    }`}
                    onClick={() => {
                      if (notification.redirectUrl) window.location.href = notification.redirectUrl;
                    }}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Unread indicator */}
                    {!notification.isRead && (
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    )}

                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.notificationType)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold mb-1 line-clamp-2 ${
                          !notification.isRead ? 'text-white' : 'text-white/80'
                        }`}>
                          {notification.notificationTitle}
                        </h3>
                        <p className={`text-sm mb-2 line-clamp-2 ${
                          !notification.isRead ? 'text-white/80' : 'text-white/60'
                        }`}>
                          {notification.notificationMessage}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-white/50">
                          <span>{notification.createdAtVietnam || notification.createdAt}</span>
                          {!notification.isRead && (
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full">
                              {t('New')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Arrow indicator */}
                      {notification.redirectUrl && (
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                            <ArrowLeft className="w-3 h-3 text-white/60 rotate-180" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}