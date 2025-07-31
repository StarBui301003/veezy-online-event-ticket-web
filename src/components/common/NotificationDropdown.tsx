import { ExternalLink, Check, Bell, CheckCheck } from 'lucide-react';
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
    markAsRead,
    markAllAsRead: markAllAsReadInHook,
    onNotificationClick,
    refreshNotifications
  } = useRealtimeNotifications();

  const handleMarkAllAsRead = async () => {
    if (!userId) return;
    
    try {
      // This will handle both UI update and API call
      await markAllAsReadInHook(userId);
      // Refresh to ensure UI is in sync
      refreshNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      // Refresh notifications to sync with server state
      refreshNotifications();
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (userId) {
      try {
        if (!notification.isRead) {
          const response = await markAsRead(notification.notificationId, userId);
          // Check if response uses 'flag' field for success
          if (response?.data?.flag === false && response?.data?.success === false) {
            console.error('Failed to mark notification as read:', response?.data?.message);
          }
        }
        if (notification.redirectUrl) {
          onRedirect?.(notification.redirectUrl);
        }
      } catch (error) {
        console.error('Error handling notification click:', error);
      }
    }
  };

  return (
    <div className="absolute right-0 z-50 mt-2 w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="relative p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-white" />
            <h3 className="font-bold text-lg text-white">
              {t('notifications') || 'Thông báo'}
            </h3>
            {unreadCount > 0 && (
              <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full font-semibold border border-white/20">
                {unreadCount} {t('new') || 'mới'}
              </span>
            )}
          </div>
          
          <button
            onClick={handleMarkAllAsRead}
            disabled={notifications.length === 0 || unreadCount === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs font-medium ${
              notifications.length === 0 || unreadCount === 0
                ? 'text-white/50 cursor-not-allowed bg-white/10'
                : 'text-white bg-white/20 hover:bg-white/30 active:bg-white/40 hover:scale-105 active:scale-95 backdrop-blur-sm border border-white/20'
            }`}
            title={
              notifications.length === 0 
                ? t('noNotifications') || 'Không có thông báo' 
                : unreadCount === 0 
                ? t('allRead') || 'Tất cả đã đọc'
                : t('markAllAsRead') || 'Đánh dấu tất cả đã đọc'
            }
          >
            {unreadCount === 0 ? (
              <CheckCheck className="w-4 h-4" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {unreadCount === 0 
                ? (t('allRead') || 'Đã đọc hết')
                : (t('markAllAsRead') || 'Đọc tất cả')
              }
            </span>
          </button>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-purple-500/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-purple-400"></div>
      </div>

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto custom-scrollbar">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative">
              <Bell className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
            <p className="text-gray-600 dark:text-gray-300 font-medium text-lg mb-1">
              {t('noNotifications') || 'Không có thông báo mới'}
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center max-w-xs">
              {t('notificationHint') || 'Các thông báo sẽ xuất hiện ở đây khi có cập nhật mới'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {notifications.map((notification, index) => (
              <div
                key={notification.notificationId}
                className={`group relative p-4 cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                  !notification.isRead 
                    ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-l-4 border-blue-500 dark:border-blue-400' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'
                }`}
                onClick={() => handleNotificationClick(notification)}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Unread indicator dot */}
                {!notification.isRead && (
                  <div className="absolute top-4 left-2 w-2.5 h-2.5 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse shadow-sm"></div>
                )}

                <div className="flex items-start gap-3 pl-4">
                  {/* Icon */}
                  <div className={`flex-shrink-0 p-2.5 rounded-full transition-all duration-200 ${
                    !notification.isRead 
                      ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/70' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-700'
                  }`}>
                    {getNotificationIcon(notification.notificationType)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className={`font-semibold text-sm line-clamp-2 ${
                        !notification.isRead 
                          ? 'text-gray-900 dark:text-white' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {notification.notificationTitle}
                      </h4>
                      {notification.redirectUrl && (
                        <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:text-blue-500 dark:hover:text-blue-400" />
                      )}
                    </div>
                    
                    <p className={`text-xs line-clamp-2 mb-3 leading-relaxed ${
                      !notification.isRead 
                        ? 'text-gray-700 dark:text-gray-300' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {notification.notificationMessage}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {notification.createdAtVietnam || notification.createdAt}
                      </span>
                      {!notification.isRead && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full font-semibold border border-blue-200 dark:border-blue-700/50">
                          {t('new') || 'Mới'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <button
          className="w-full py-3 text-center text-blue-600 dark:text-blue-400 font-semibold rounded-xl transition-all text-sm bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-700/50 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md"
          onClick={onViewAll}
        >
          {t('viewAllNotifications') || 'Xem tất cả thông báo'} →
        </button>
      </div>

      <style >{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgb(156 163 175 / 0.5);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgb(156 163 175 / 0.7);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgb(75 85 99 / 0.5);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgb(75 85 99 / 0.7);
        }
      `}</style>
    </div>
  );
};