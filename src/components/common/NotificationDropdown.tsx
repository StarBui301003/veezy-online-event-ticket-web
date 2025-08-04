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

  // Use the hook for API and UI update
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    onNotificationClick,
    refreshNotifications
  } = useRealtimeNotifications();


  // Always call the hook's markAllAsRead(userId) which does both UI and API
  const handleMarkAllAsRead = async () => {
    if (!userId) return;
    try {
      await markAllAsRead(userId);
      await refreshNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      await refreshNotifications();
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (userId) {
      try {
        if (!notification.isRead) {
          await markAsRead(notification.notificationId, userId);
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
    <div className="absolute right-0 z-50 mt-2 w-96 bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 overflow-hidden animate-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="relative p-4 bg-gradient-to-r from-blue-800 to-purple-900 text-white border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 relative">
            <span className="relative">
              <Bell className="w-5 h-5 text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-2 min-w-[18px] h-5 px-1 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-gray-900">
                  {unreadCount}
                </span>
              )}
            </span>
            <h3 className="font-bold text-lg text-white">
              {t('notifications') || 'Thông báo'}
            </h3>
          </div>
          
          <button
            onClick={() => {
              if (userId && unreadCount > 0) handleMarkAllAsRead();
            }}
            disabled={notifications.length === 0 || unreadCount === 0}
            className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all text-xs font-medium shadow-sm ${
              notifications.length === 0 || unreadCount === 0
                ? 'text-gray-500 cursor-not-allowed bg-gray-800'
                : 'text-blue-200 bg-blue-800/40 hover:bg-blue-700/60 active:bg-blue-900/60 hover:scale-105 active:scale-95 border border-blue-700/40'
            }`}
            style={{ fontSize: '12px', height: '28px', minHeight: 'unset' }}
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
      <div className="max-h-80 overflow-y-auto custom-scrollbar bg-gray-900">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative">
              <Bell className="w-16 h-16 text-gray-600 mb-4" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
            <p className="text-gray-300 font-medium text-lg mb-1">
              {t('noNotifications') || 'Không có thông báo mới'}
            </p>
            <p className="text-gray-400 text-sm text-center max-w-xs">
              {t('notificationHint') || 'Các thông báo sẽ xuất hiện ở đây khi có cập nhật mới'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {notifications.map((notification, index) => (
              <div
                key={notification.notificationId}
                className={`group relative p-4 cursor-pointer transition-all duration-200 ${
                  !notification.isRead 
                    ? 'bg-gradient-to-r from-blue-900/40 to-purple-900/40 border-l-4 border-blue-500' 
                    : 'hover:bg-gray-800/60'
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
                      ? 'bg-blue-900 text-blue-300 group-hover:bg-blue-800' 
                      : 'bg-gray-800 text-gray-400 group-hover:bg-gray-700'
                  }`}>
                    {getNotificationIcon(notification.notificationType)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className={`font-semibold text-sm line-clamp-2 ${
                        !notification.isRead 
                          ? 'text-white' 
                          : 'text-gray-300'
                      }`}>
                        {notification.notificationTitle}
                      </h4>
                      {notification.redirectUrl && (
                        <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:text-blue-500 dark:hover:text-blue-400" />
                      )}
                    </div>
                    
                    <p className={`text-xs line-clamp-2 mb-3 leading-relaxed ${
                      !notification.isRead 
                        ? 'text-gray-200' 
                        : 'text-gray-400'
                    }`}>
                      {notification.notificationMessage}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400 font-medium">
                        {notification.createdAtVietnam || notification.createdAt}
                      </span>
                      {!notification.isRead && (
                        <span className="px-2 py-1 bg-blue-900/40 text-blue-200 text-xs rounded-full font-semibold border border-blue-700/50">
                          {t('new') || 'Mới'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 to-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800 bg-gray-900">
        <button
          className="w-full py-3 text-center text-blue-200 font-semibold rounded-xl transition-all text-sm bg-blue-900/30 hover:bg-blue-800/40 border border-blue-700/50 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md"
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