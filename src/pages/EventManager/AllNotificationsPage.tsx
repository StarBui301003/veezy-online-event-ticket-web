import { useEffect, useState, useCallback } from 'react';
import {
  CheckCircle,
  ArrowLeft,
  Loader2,
  Bell,
  BellOff,
  RefreshCw,
  CheckCheck,
} from 'lucide-react';
import {
  getUserNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/notification.service';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { onNotification } from '@/services/signalr.service';
import { format } from 'date-fns';
import { getNotificationIcon } from '@/components/common/getNotificationIcon';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';

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
  const { getThemeClass } = useThemeClasses();

  const isEventManager = location.pathname.startsWith('/event-manager');
  const accountStr = typeof window !== 'undefined' ? localStorage.getItem('account') : null;
  const userId = accountStr
    ? (() => {
        try {
          const account = JSON.parse(accountStr);
          return account.userId || account.accountId;
        } catch {
          return null;
        }
      })()
    : null;

  const loadNotifications = useCallback(
    async (showLoader = true) => {
      if (!userId) {
        setLoading(false);
                       setError(t('notifications.userIdNotFound'));
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
          const items = Array.isArray(res.data.data?.items) ? res.data.data.items : [];
          if (items.length === 0) {
            console.log('No notifications found');
            setNotifications([]);
          } else {
            const processedItems = items.map((item) => ({
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
              readAtVietnam: item.readAtVietnam || item.readAt,
            }));
            console.log('Processed items:', processedItems);
            const sortedItems = [...processedItems].sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            setNotifications(sortedItems);
          }
        } else {
          const errorMsg =
            res?.data?.message || `API returned flag: ${res?.data?.flag}, code: ${res?.data?.code}`;
          console.error('API Error:', errorMsg);
          setError(errorMsg);
          setNotifications([]);
        }
      } catch {
                       setError(t('notifications.failedToFetchNotifications'));
        setNotifications([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId, isEventManager]
  );

  const handleMarkAllAsRead = async () => {
    if (!userId || notifications.length === 0) return;

    const unreadNotifications = notifications.filter((n) => !n.isRead);
    if (unreadNotifications.length === 0) return;

    setMarkingRead(true);
    try {
      console.log('Marking all as read for userId:', userId);
      const response = await markAllNotificationsRead(userId);
      console.log('Mark all as read response:', response);

      if (response?.data?.flag === true) {
        const now = new Date();
        setNotifications((prev) =>
          prev.map((n) => ({
            ...n,
            isRead: true,
            readAt: now.toISOString(),
            readAtVietnam: now.toISOString(),
          }))
        );
        console.log('All notifications marked as read successfully');
      } else {
        const errorMsg =
          response?.data?.message ||
          `API returned flag: ${response?.data?.flag}, code: ${response?.data?.code}`;
        console.error('Mark all as read error:', errorMsg);
        setError(errorMsg);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
                     setError(error instanceof Error ? error.message : t('notifications.failedToFetchNotifications'));
    } finally {
      setMarkingRead(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.isRead && userId) {
      try {
        await markNotificationRead(notification.notificationId, userId);
        setNotifications((prev) =>
          prev.map((n) =>
            n.notificationId === notification.notificationId
              ? {
                  ...n,
                  isRead: true,
                  readAt: new Date().toISOString(),
                  readAtVietnam: new Date().toLocaleString('vi-VN'),
                }
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

      // Setup SignalR listeners using global connections
      try {
        // Notification hub connection is managed globally in App.tsx

        // Subscribe to new notifications
        onNotification('ReceiveNotification', (newNotification: Notification) => {
          if (!isMounted) return;

          console.log('Received new notification via SignalR:', newNotification);
          setNotifications((prev) => [
            {
              ...newNotification,
              isRead: false,
              createdAt: newNotification.createdAt || new Date().toISOString(),
              createdAtVietnam:
                newNotification.createdAtVietnam || new Date().toLocaleString('vi-VN'),
            },
            ...prev,
          ]);
        });

        // Subscribe to notification read events
        onNotification('NotificationRead', (data: { notificationId: string; userId: string }) => {
          if (!isMounted || data.userId !== userId) return;

          console.log('Notification marked as read via SignalR:', data);
          setNotifications((prev) =>
            prev.map((n) =>
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
          setNotifications((prev) =>
            prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
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
              readAtVietnam: item.readAtVietnam || item.readAt,
            }));

            const sortedItems = [...processedItems].sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            setNotifications(sortedItems);
          }
        });

        // Subscribe to notification deletion events (if implemented)
        onNotification(
          'NotificationDeleted',
          (data: { notificationId: string; userId: string }) => {
            if (!isMounted || data.userId !== userId) return;

            console.log('Notification deleted via SignalR:', data);
            setNotifications((prev) =>
              prev.filter((n) => n.notificationId !== data.notificationId)
            );
          }
        );

        // Subscribe to notification updates (if notification content changes)
        onNotification('NotificationUpdated', (updatedNotification: Notification) => {
          if (!isMounted || updatedNotification.userId !== userId) return;

          console.log('Notification updated via SignalR:', updatedNotification);
          setNotifications((prev) =>
            prev.map((n) =>
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
      <div
        className={cn(
          'min-h-screen',
          getThemeClass(
            'bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 text-gray-900',
            'bg-gray-900 text-gray-100'
          )
        )}
      >
        <div className="relative">
          <div
            className={cn(
              'absolute inset-0 -mt-24 pt-24',
              getThemeClass(
                'bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100',
                'bg-gray-900'
              )
            )}
          >
            <div className="max-w-4xl mx-auto p-4 sm:p-6">
              <div className="flex justify-center items-center h-64">
                <div className="text-center">
                  <Loader2
                    className={cn(
                      'w-8 h-8 animate-spin mx-auto mb-2',
                      getThemeClass('text-blue-500', 'text-blue-500')
                    )}
                  />
                  <p className={cn(getThemeClass('text-gray-700', 'text-gray-300'))}>
                                               {t('notifications.loadingNotifications')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  return (
    <div
      className={cn(
        'min-h-screen',
        getThemeClass(
          'bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 text-gray-900',
          'bg-gray-900 text-gray-100'
        )
      )}
    >
      {/* Main content with spacing for the fixed header */}
      <div className="pt-20">
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
          {/* Header */}
          <div
            className={cn(
              'flex items-center justify-between mb-6 p-4 rounded-xl sticky top-20 z-10',
              getThemeClass(
                'bg-white/95 border border-gray-200/60 shadow-xl',
                'bg-gray-800 border border-gray-700'
              )
            )}
          >
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className={cn(
                  'p-2 rounded-full transition-colors',
                  getThemeClass(
                    'hover:bg-gray-100 text-gray-600 hover:text-gray-900',
                    'hover:bg-gray-700 text-gray-300 hover:text-white'
                  )
                )}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                <Bell className={cn('w-6 h-6', getThemeClass('text-blue-600', 'text-blue-400'))} />
                <h1
                  className={cn(
                    'text-xl font-semibold',
                    getThemeClass('text-gray-900', 'text-white')
                  )}
                >
                                           {t('notifications.title')}
                </h1>
              </div>

              {unreadCount > 0 && (
                <span
                  className={cn(
                    'px-3 py-1 text-xs rounded-full font-semibold border',
                    getThemeClass(
                      'bg-blue-100 text-blue-700 border-blue-300',
                      'bg-blue-900/50 text-blue-300 border-blue-700'
                    )
                  )}
                >
                                           {unreadCount} {t('notifications.new')}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={cn(
                  'p-2 rounded-lg transition-all',
                  getThemeClass(
                    'hover:bg-gray-100 text-gray-600 hover:text-gray-900',
                    'hover:bg-gray-700 text-gray-400 hover:text-white'
                  )
                )}
                                       title={t('notifications.refresh')}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              {notifications.length > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={markingRead || unreadCount === 0}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm flex items-center gap-2 font-medium transition-all',
                    unreadCount === 0
                      ? getThemeClass(
                          'bg-gray-200 text-gray-500 cursor-not-allowed',
                          'bg-gray-700 text-gray-400 cursor-not-allowed'
                        )
                      : getThemeClass(
                          'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 active:scale-95',
                          'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 active:scale-95'
                        )
                  )}
                >
                  {markingRead ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : unreadCount === 0 ? (
                    <CheckCheck className="w-4 h-4" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {unreadCount === 0
                                               ? t('notifications.allRead')
                           : t('notifications.markAllAsRead')}
                </button>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              className={cn(
                'mb-4 p-4 rounded-xl border',
                getThemeClass(
                  'bg-red-50/10 border-red-300 text-red-700',
                  'bg-red-900/20 border-red-700 text-red-300'
                )
              )}
            >
              <p className="text-sm">
                                       <strong>{t('notifications.error')}:</strong> {error}
              </p>
              <button
                onClick={() => loadNotifications()}
                className={cn(
                  'mt-2 text-sm underline',
                  getThemeClass(
                    'text-red-600 hover:text-red-700',
                    'text-red-400 hover:text-red-300'
                  )
                )}
              >
                {t('notifications.retry')}
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div
            className={cn(
              'rounded-xl overflow-hidden border',
              getThemeClass(
                'bg-white/95 border-gray-200/60 shadow-xl',
                'bg-gray-800 border border-gray-700'
              )
            )}
          >
            {notifications.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="relative inline-block">
                  <BellOff
                    className={cn(
                      'w-16 h-16 mx-auto mb-4',
                      getThemeClass('text-gray-400', 'text-gray-600')
                    )}
                  />
                  {!error && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                  )}
                </div>
                <h3
                  className={cn(
                    'text-lg font-medium mb-2',
                    getThemeClass('text-gray-800', 'text-gray-200')
                  )}
                >
                  {error
                    ? t('notifications.errorLoadingNotifications')
                    : t('notifications.noNotifications')}
                </h3>
                <p className={cn('text-sm', getThemeClass('text-gray-600', 'text-gray-400'))}>
                  {error
                    ? t('notifications.checkConnectionAndRetry')
                    : t('notifications.noNotificationsDescription')}
                </p>
                {error && (
                  <button
                    onClick={() => loadNotifications()}
                    className={cn(
                      'mt-4 px-4 py-2 rounded-lg text-sm font-medium',
                      getThemeClass(
                        'bg-blue-600 hover:bg-blue-700 text-white',
                        'bg-blue-600 hover:bg-blue-700 text-white'
                      )
                    )}
                  >
                    {t('notifications.retry')}
                  </button>
                )}
              </div>
            ) : (
              <ul className={cn('divide-y', getThemeClass('divide-gray-200', 'divide-gray-700'))}>
                {notifications.map((notification) => (
                  <li
                    key={notification.notificationId}
                    className={cn(
                      'p-4 cursor-pointer transition-all duration-200 relative',
                      !notification.isRead
                        ? getThemeClass(
                            'bg-blue-50/50 border-l-4 border-blue-500',
                            'bg-gray-750 border-l-4 border-blue-500'
                          )
                        : getThemeClass('hover:bg-gray-50/50', 'hover:bg-gray-750')
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Unread indicator */}
                      {!notification.isRead && (
                        <div className="absolute left-2 top-6 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      )}

                      {/* Icon */}
                      <div
                        className={cn(
                          'flex-shrink-0 p-2.5 rounded-full transition-all',
                          !notification.isRead
                            ? getThemeClass(
                                'bg-blue-100 text-blue-600',
                                'bg-blue-900/50 text-blue-400'
                              )
                            : getThemeClass(
                                'bg-gray-100 text-gray-500',
                                'bg-gray-700 text-gray-400'
                              )
                        )}
                      >
                        {getNotificationIcon ? (
                          getNotificationIcon(notification.notificationType)
                        ) : (
                          <Bell className="w-5 h-5" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'text-sm font-medium mb-1',
                            !notification.isRead
                              ? getThemeClass('text-gray-900', 'text-white')
                              : getThemeClass('text-gray-700', 'text-gray-300')
                          )}
                        >
                          {notification.notificationTitle}
                        </p>
                        <p
                          className={cn(
                            'text-sm mb-2 line-clamp-2',
                            getThemeClass('text-gray-600', 'text-gray-400')
                          )}
                        >
                          {notification.notificationMessage}
                        </p>
                        <div className="flex items-center justify-between">
                          <span
                            className={cn(
                              'text-xs',
                              getThemeClass('text-gray-500', 'text-gray-500')
                            )}
                          >
                            {formatNotificationDate(notification.createdAt)}
                          </span>
                          {!notification.isRead && (
                            <span
                              className={cn(
                                'px-2 py-1 text-xs rounded-full font-medium border',
                                getThemeClass(
                                  'bg-blue-100 text-blue-700 border-blue-300',
                                  'bg-blue-900/50 text-blue-300 border-blue-700'
                                )
                              )}
                            >
                              {t('notifications.new')}
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
