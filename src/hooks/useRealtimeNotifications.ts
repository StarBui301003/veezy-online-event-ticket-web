import { useNotificationContext } from '@/contexts/NotificationContext';
import { markNotificationRead, markAllNotificationsRead, deleteNotification } from '@/services/notification.service';
import { useCallback, useRef, useEffect } from 'react';
import { logNotificationApiCall } from '@/utils/notification-debug';

export const useRealtimeNotifications = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    removeNotification
  } = useNotificationContext();

  // Track notifications that are currently being marked as read to prevent duplicate API calls
  const markingReadRef = useRef<Set<string>>(new Set());

  // Track notifications that are currently being deleted to prevent duplicate API calls
  const deletingNotificationsRef = useRef<Set<string>>(new Set());

  // Track if component is mounted to prevent API calls from unmounted components
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Delete notification (with API call)
  const handleDeleteNotification = useCallback(async (notificationId: string) => {
    // Check if component is still mounted
    if (!isMountedRef.current) {
      console.log('[useRealtimeNotifications] Component unmounted, skipping delete for:', notificationId);
      return;
    }

    // Prevent duplicate delete API calls for the same notification
    if (deletingNotificationsRef.current.has(notificationId)) {
      console.log('[useRealtimeNotifications] Already deleting notification:', notificationId);
      return;
    }

    try {
      // Add to deleting set to prevent duplicates
      deletingNotificationsRef.current.add(notificationId);
      console.log('[useRealtimeNotifications] Starting to delete notification:', notificationId);

      // Call API to delete the notification
      const result = await deleteNotification(notificationId);
      console.log('[useRealtimeNotifications] Delete API result for notification:', notificationId, result);

      if (result.flag && result.data) {
        // Remove from UI immediately after successful API call
        removeNotification(notificationId);
        console.log('[useRealtimeNotifications] Successfully deleted notification from UI:', notificationId);
      } else {
        console.error('[useRealtimeNotifications] Failed to delete notification:', result.message);
      }
    } catch (error) {
      console.error('[useRealtimeNotifications] Failed to delete notification:', error);
    } finally {
      // Only cleanup if component is still mounted
      if (isMountedRef.current) {
        deletingNotificationsRef.current.delete(notificationId);
        console.log('[useRealtimeNotifications] Cleaned up deleting state for notification:', notificationId);
      }
    }
  }, [removeNotification]);

  // Mark single notification as read (with API call)
  const handleMarkAsRead = useCallback(async (notificationId: string, userId: string) => {
    // Log hook call for debugging
    logNotificationApiCall(notificationId, 'useRealtimeNotifications');

    // Check if component is still mounted
    if (!isMountedRef.current) {
      console.log('[useRealtimeNotifications] Component unmounted, skipping API call for:', notificationId);
      return;
    }

    // Prevent duplicate API calls for the same notification
    if (markingReadRef.current.has(notificationId)) {
      console.log('[useRealtimeNotifications] Already marking notification as read:', notificationId);
      return;
    }

    try {
      // Add to marking set to prevent duplicates
      markingReadRef.current.add(notificationId);
      console.log('[useRealtimeNotifications] Starting to mark notification as read:', notificationId);

      // Update UI immediately
      markAsRead(notificationId);

      // Call API to persist the change
      const result = await markNotificationRead(notificationId, userId);
      console.log('[useRealtimeNotifications] API result for notification:', notificationId, result);

      console.log('[useRealtimeNotifications] Successfully marked notification as read:', notificationId);
    } catch (error) {
      console.error('[useRealtimeNotifications] Failed to mark notification as read:', error);
      // Could revert UI state here if needed
    } finally {
      // Only cleanup if component is still mounted
      if (isMountedRef.current) {
        markingReadRef.current.delete(notificationId);
        console.log('[useRealtimeNotifications] Cleaned up marking state for notification:', notificationId);
      }
    }
  }, [markAsRead]);

  // Mark all notifications as read (with API call)
  const handleMarkAllAsRead = useCallback(async (userId: string) => {
    // Check if component is still mounted
    if (!isMountedRef.current) {
      console.log('[useRealtimeNotifications] Component unmounted, skipping mark all as read');
      return;
    }

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
    deleteNotification: handleDeleteNotification,
  };
};

export default useRealtimeNotifications;
