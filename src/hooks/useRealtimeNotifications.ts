import { useNotificationContext } from '@/contexts/NotificationContext';
import { markNotificationRead, markAllNotificationsRead } from '@/services/notification.service';
import { useCallback, useRef } from 'react';

export const useRealtimeNotifications = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refreshNotifications
  } = useNotificationContext();

  // Track notifications that are currently being marked as read to prevent duplicate API calls
  const markingReadRef = useRef<Set<string>>(new Set());

  // Mark single notification as read (with API call)
  const handleMarkAsRead = useCallback(async (notificationId: string, userId: string) => {
    // Prevent duplicate API calls for the same notification
    if (markingReadRef.current.has(notificationId)) {
      console.log('[useRealtimeNotifications] Already marking notification as read:', notificationId);
      return;
    }

    try {
      // Add to marking set to prevent duplicates
      markingReadRef.current.add(notificationId);

      // Update UI immediately
      markAsRead(notificationId);

      // Call API to persist the change
      await markNotificationRead(notificationId, userId);

      console.log('[useRealtimeNotifications] Marked notification as read:', notificationId);
    } catch (error) {
      console.error('[useRealtimeNotifications] Failed to mark notification as read:', error);
      // Could revert UI state here if needed
    } finally {
      // Remove from marking set
      markingReadRef.current.delete(notificationId);
    }
  }, [markAsRead]);

  // Mark all notifications as read (with API call)
  const handleMarkAllAsRead = useCallback(async (userId: string) => {
    try {
      // Update UI immediately
      markAllAsRead();

      // Call API to persist the change
      await markAllNotificationsRead(userId);

      console.log('[useRealtimeNotifications] Marked all notifications as read');
    } catch (error) {
      console.error('[useRealtimeNotifications] Failed to mark all notifications as read:', error);
      // Could revert UI state here if needed
    }
  }, [markAllAsRead]);

  // Handle notification click with redirect
  const handleNotificationClick = useCallback(async (
    notificationId: string,
    userId: string,
    redirectUrl?: string,
    onRedirect?: (url: string) => void
  ) => {
    // Mark as read
    await handleMarkAsRead(notificationId, userId);

    // Handle redirect
    if (redirectUrl && onRedirect) {
      onRedirect(redirectUrl);
    }
  }, [handleMarkAsRead]);

  return {
    notifications,
    unreadCount,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    onNotificationClick: handleNotificationClick,
    refreshNotifications,
  };
};

export default useRealtimeNotifications;
