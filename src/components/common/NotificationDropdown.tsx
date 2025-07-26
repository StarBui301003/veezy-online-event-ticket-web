
import { ExternalLink, Check, Bell } from 'lucide-react';
import { getNotificationIcon } from '../common/getNotificationIcon';
import type { Notification } from '@/hooks/useNotifications';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

interface NotificationDropdownProps {
  userId?: string;
  onViewAll: () => void;
  t: (key: string) => string;
  onRedirect?: (url: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  userId,
  onViewAll,
  t,
  onRedirect,
}) => {
  const { 
    notifications, 
    unreadCount, 
    markAllAsRead, 
    onNotificationClick 
  } = useRealtimeNotifications();

  const handleMarkAllAsRead = async () => {
    if (userId) {
      await markAllAsRead(userId);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (userId) {
      await onNotificationClick(
        notification.notificationId, 
        userId, 
        notification.redirectUrl,
        onRedirect
      );
    }
  };

  return (
    <div className="absolute right-0 z-50 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="relative p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            <h3 className="font-semibold text-lg">{t('notification') || 'Thông báo'}</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-1 bg-white/20 text-xs rounded-full font-medium">
                {unreadCount} {t('new') || 'mới'}
              </span>
            )}
          </div>
          <button
            className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
            onClick={handleMarkAllAsRead}
            disabled={notifications.length === 0 || unreadCount === 0}
          >
            <Check className="w-3 h-3" />
            {t('markAllRead') || 'Đọc tất cả'}
          </button>
        </div>
        <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-blue-500/20 to-transparent"></div>
      </div>

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Bell className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">{t('noNotifications') || 'Không có thông báo mới'}</p>
            <p className="text-gray-400 text-sm mt-1">{t('notificationHint') || 'Các thông báo sẽ xuất hiện ở đây'}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification, index) => (
              <div
                key={notification.notificationId}
                className={`group relative p-4 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                  !notification.isRead ? 'bg-gradient-to-r from-purple-50 to-blue-50 border-l-4 border-purple-400' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Unread indicator dot */}
                {!notification.isRead && (
                  <div className="absolute top-4 left-2 w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                )}

                <div className="flex items-start gap-3 pl-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 p-2 bg-gray-100 rounded-full group-hover:bg-gray-200 transition-colors">
                    {getNotificationIcon(notification.notificationType)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h4 className={`font-semibold text-sm line-clamp-2 mb-1 ${
                        !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {notification.notificationTitle}
                      </h4>
                      {notification.redirectUrl && (
                        <ExternalLink className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                    <p className={`text-xs line-clamp-2 mb-2 ${
                      !notification.isRead ? 'text-gray-600' : 'text-gray-500'
                    }`}>
                      {notification.notificationMessage}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {notification.createdAtVietnam || notification.createdAt}
                      </span>
                      {!notification.isRead && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                          {t('new') || 'Mới'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-purple-50">
        <button
          className="block w-full py-2 text-center text-purple-600 font-semibold hover:text-purple-700 hover:bg-white/50 rounded-lg transition-all text-sm"
          onClick={onViewAll}
        >
          {t('viewAllNotifications') || 'Xem tất cả thông báo →'}
        </button>
      </div>
    </div>
  );
};
