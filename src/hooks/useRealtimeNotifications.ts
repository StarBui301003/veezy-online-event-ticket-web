import { useNotificationContext } from '@/contexts/NotificationContext';
import { markNotificationRead, markAllNotificationsRead } from '@/services/notification.service';
import { useCallback } from 'react';

export const useRealtimeNotifications = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    refreshNotifications 
  } = useNotificationContext();

  // Mark single notification as read (with API call)
  const handleMarkAsRead = useCallback(async (notificationId: string, userId: string) => {
    try {
      // Update UI immediately
      markAsRead(notificationId);
      
      // Call API to persist the change
      await markNotificationRead(notificationId, userId);
      
      console.log('[useRealtimeNotifications] Marked notification as read:', notificationId);
    } catch (error) {
      console.error('[useRealtimeNotifications] Failed to mark notification as read:', error);
      // Could revert UI state here if needed
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
