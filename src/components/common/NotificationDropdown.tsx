/* eslint-disable @typescript-eslint/no-unused-vars */
import { ExternalLink, Check, Bell, CheckCheck } from 'lucide-react';
import { getNotificationIcon } from '../common/getNotificationIcon';
import type { Notification } from '@/hooks/useNotifications';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';

interface NotificationDropdownProps {
  userId?: string;
  onViewAll: () => void;
  t: (key: string) => string;
  onRedirect?: (url: string) => void;
}

const NotificationDropdown = ({ userId, onViewAll, t, onRedirect }: NotificationDropdownProps) => {
  const { getThemeClass } = useThemeClasses();

  // Use the hook for API and UI update
  const { notifications, markAsRead, markAllAsRead, refreshNotifications } =
    useRealtimeNotifications();

  // Calculate unread count from notifications to ensure accuracy
  const actualUnreadCount = notifications.filter((n) => !n.isRead).length;

  // Always call the hook's markAllAsRead(userId) which does both UI and API
  const handleMarkAllAsRead = async () => {
    if (!userId) return;
    try {
      await markAllAsRead(userId);
      await refreshNotifications();
    } catch (error) {
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
        } else {
          onViewAll();
        }
      } catch (error) {
        /* empty */
      }
    }
  };

  return (
    <div
      className={cn(
        'absolute right-0 z-50 mt-2 w-96 rounded-2xl shadow-2xl border overflow-hidden animate-in slide-in-from-top-2 duration-200',
        getThemeClass('bg-white border-gray-200', 'bg-gray-900 border-gray-800')
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'relative p-4 text-white border-b',
          getThemeClass(
            'bg-gradient-to-r from-blue-600 to-purple-600 border-gray-200',
            'bg-gradient-to-r from-blue-800 to-purple-900 border-gray-800'
          )
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 relative">
            <span className="relative">
              <Bell className="w-5 h-5 text-white" />
              {actualUnreadCount > 0 && (
                <span
                  className={cn(
                    'absolute -top-1 -right-2 min-w-[18px] h-5 px-1 text-white text-xs font-bold rounded-full flex items-center justify-center border-2',
                    getThemeClass('bg-blue-500 border-white', 'bg-blue-500 border-gray-900')
                  )}
                >
                  {actualUnreadCount}
                </span>
              )}
            </span>
            <h3 className="font-bold text-lg text-white">{t('notifications') || 'Thông báo'}</h3>
          </div>
          <button
            onClick={() => {
              if (userId && actualUnreadCount > 0) handleMarkAllAsRead();
            }}
            disabled={notifications.length === 0 || actualUnreadCount === 0}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-md transition-all text-xs font-medium shadow-sm',
              notifications.length === 0 || actualUnreadCount === 0
                ? getThemeClass(
                    'text-gray-500 cursor-not-allowed bg-gray-200',
                    'text-gray-500 cursor-not-allowed bg-gray-800'
                  )
                : getThemeClass(
                    'text-blue-700 bg-blue-100/80 hover:bg-blue-200/90 active:bg-blue-300/90 hover:scale-105 active:scale-95 border border-blue-300/60',
                    'text-blue-200 bg-blue-800/40 hover:bg-blue-700/60 active:bg-blue-900/60 hover:scale-105 active:scale-95 border border-blue-700/40'
                  )
            )}
            style={{ fontSize: '12px', height: '28px', minHeight: 'unset' }}
            title={
              notifications.length === 0
                ? t('noNotifications') || 'Không có thông báo'
                : actualUnreadCount === 0
                ? t('allRead') || 'Tất cả đã đọc'
                : t('markAllAsRead') || 'Đánh dấu tất cả đã đọc'
            }
          >
            {actualUnreadCount === 0 ? (
              <CheckCheck className="w-4 h-4" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {actualUnreadCount === 0
                ? t('allRead') || 'Đã đọc hết'
                : t('markAllAsRead') || 'Đọc tất cả'}
            </span>
          </button>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-purple-500/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-purple-400"></div>
      </div>

      {/* Notifications List */}
      <div
        className={cn(
          'max-h-80 overflow-y-auto custom-scrollbar',
          getThemeClass('bg-white', 'bg-gray-900')
        )}
      >
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative">
              <Bell
                className={cn('w-16 h-16 mb-4', getThemeClass('text-gray-400', 'text-gray-600'))}
              />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
            <p
              className={cn(
                'font-medium text-lg mb-1',
                getThemeClass('text-gray-700', 'text-gray-300')
              )}
            >
              {t('noNotifications') || 'Không có thông báo mới'}
            </p>
            <p
              className={cn(
                'text-sm text-center max-w-xs',
                getThemeClass('text-gray-500', 'text-gray-400')
              )}
            >
              {t('notificationHint') || 'Các thông báo sẽ xuất hiện ở đây khi có cập nhật mới'}
            </p>
          </div>
        ) : (
          <div className={cn('divide-y', getThemeClass('divide-gray-200', 'divide-gray-800'))}>
            {notifications.map((notification, index) => (
              <div
                key={notification.notificationId}
                className={cn(
                  'group relative p-4 cursor-pointer transition-all duration-200',
                  !notification.isRead
                    ? getThemeClass(
                        'bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500',
                        'bg-gradient-to-r from-blue-900/40 to-purple-900/40 border-l-4 border-blue-500'
                      )
                    : getThemeClass('hover:bg-gray-50', 'hover:bg-gray-800/60')
                )}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleNotificationClick(notification);
                }}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Unread indicator dot */}
                {!notification.isRead && (
                  <div className="absolute top-4 left-2 w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shadow-sm"></div>
                )}

                <div className="flex items-start gap-3 pl-4">
                  {/* Icon */}
                  <div
                    className={cn(
                      'flex-shrink-0 p-2.5 rounded-full transition-all duration-200',
                      !notification.isRead
                        ? getThemeClass(
                            'bg-blue-100 text-blue-600 group-hover:bg-blue-200',
                            'bg-blue-900 text-blue-300 group-hover:bg-blue-800'
                          )
                        : getThemeClass(
                            'bg-gray-100 text-gray-600 group-hover:bg-gray-200',
                            'bg-gray-800 text-gray-400 group-hover:bg-gray-700'
                          )
                    )}
                  >
                    {getNotificationIcon(notification.notificationType)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h4
                        className={cn(
                          'font-semibold text-sm line-clamp-2',
                          !notification.isRead
                            ? getThemeClass('text-gray-900', 'text-white')
                            : getThemeClass('text-gray-700', 'text-gray-300')
                        )}
                      >
                        {notification.notificationTitle}
                      </h4>
                      {notification.redirectUrl && (
                        <ExternalLink
                          className={cn(
                            'w-4 h-4 mt-0.5 flex-shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-all duration-200',
                            getThemeClass(
                              'text-gray-400 hover:text-blue-500',
                              'text-gray-500 hover:text-blue-400'
                            )
                          )}
                        />
                      )}
                    </div>

                    <p
                      className={cn(
                        'text-xs line-clamp-2 mb-3 leading-relaxed',
                        !notification.isRead
                          ? getThemeClass('text-gray-600', 'text-gray-200')
                          : getThemeClass('text-gray-500', 'text-gray-400')
                      )}
                    >
                      {notification.notificationMessage}
                    </p>

                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          'text-xs font-medium',
                          getThemeClass('text-gray-500', 'text-gray-400')
                        )}
                      >
                        {notification.createdAtVietnam || notification.createdAt}
                      </span>
                      {!notification.isRead && (
                        <span
                          className={cn(
                            'px-2 py-1 text-xs rounded-full font-semibold border',
                            getThemeClass(
                              'bg-blue-100 text-blue-700 border-blue-300',
                              'bg-blue-900/40 text-blue-200 border-blue-700/50'
                            )
                          )}
                        >
                          {t('new') || 'Mới'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Hover effect overlay */}
                <div
                  className={cn(
                    'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none',
                    getThemeClass(
                      'bg-gradient-to-r from-blue-50/20 to-purple-50/20',
                      'bg-gradient-to-r from-blue-900/10 to-purple-900/10'
                    )
                  )}
                ></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className={cn(
          'p-4 border-t',
          getThemeClass('border-gray-200 bg-white', 'border-gray-800 bg-gray-900')
        )}
      >
        <button
          className={cn(
            'w-full py-3 text-center font-semibold rounded-xl transition-all text-sm hover:scale-[1.02] active:scale-[0.98] hover:shadow-md relative',
            getThemeClass(
              'text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200',
              'text-blue-200 bg-blue-900/30 hover:bg-blue-800/40 border border-blue-700/50'
            )
          )}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onViewAll();
          }}
        >
          {t('viewAllNotifications') || 'Xem tất cả thông báo'} →
        </button>
      </div>

      <style>{`
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

export default NotificationDropdown;
