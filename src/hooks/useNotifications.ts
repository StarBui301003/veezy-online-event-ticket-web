import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/services/notification.service';
import { onNotification } from '@/services/signalr.service';

export interface Notification {
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

interface UseNotificationsOptions {
  userId: string | undefined;
  maxNotifications?: number;
  language?: string;
  enableRealtime?: boolean;
}

export function useNotifications({ userId, maxNotifications = 30, language, enableRealtime = true }: UseNotificationsOptions) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifHasUnread, setNotifHasUnread] = useState(false);
  const [notifPage, setNotifPage] = useState(1);
  const [notifHasMore, setNotifHasMore] = useState(true);
  const notifRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setNotifLoading(true);
    try {
      const res = await getUserNotifications(userId, 1, maxNotifications);
      const items = res.data?.data?.items || [];
      setNotifications(items.slice(0, maxNotifications));
      setNotifHasUnread(items.some((n: Notification) => !n.isRead));
      setNotifPage(1);
      setNotifHasMore(res.data?.data?.hasNextPage ?? false);
    } finally {
      setNotifLoading(false);
    }
  }, [userId, maxNotifications]);

  // Initial fetch and refetch on userId/language change
  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, language]);

  // Setup realtime notification listening
  useEffect(() => {
    if (!enableRealtime || !userId) return;

    console.log('[useNotifications] Setting up realtime listener for user:', userId);

    const handleRealtimeNotification = (notification: Notification) => {
      console.log('[useNotifications] Received realtime notification:', notification);
      
      // Add new notification to the top of the list and ensure we don't exceed maxNotifications
      setNotifications(prev => {
        const newNotifications = [notification, ...prev].slice(0, maxNotifications);
        return newNotifications;
      });
      
      // Update unread status
      if (!notification.isRead) {
        setNotifHasUnread(true);
      }
    };

    // Listen for realtime notifications
    onNotification('ReceiveNotification', handleRealtimeNotification);

    // Cleanup: Note that onNotification doesn't return cleanup function, 
    // but the connection should handle multiple listeners properly
    return () => {
      console.log('[useNotifications] Cleaning up realtime listener for user:', userId);
      // The SignalR service should handle connection cleanup in App.tsx
    };
  }, [userId, enableRealtime, maxNotifications]);

  // Mark one notification as read
  const handleReadNotification = useCallback(async (notification: Notification, onRedirect?: (url: string) => void) => {
    if (!notification.isRead && userId) {
      await markNotificationRead(notification.notificationId, userId);
    }
    await fetchNotifications();
    if (notification.redirectUrl && onRedirect) {
      onRedirect(notification.redirectUrl);
    }
  }, [userId, fetchNotifications]);

  // Mark all as read
  const handleReadAll = useCallback(async () => {
    if (userId) {
      await markAllNotificationsRead(userId);
      await fetchNotifications();
    }
  }, [userId, fetchNotifications]);

  // Load more notifications
  const handleLoadMore = useCallback(async () => {
    if (!userId || notifLoading || !notifHasMore) return;
    setNotifLoading(true);
    const nextPage = notifPage + 1;
    const res = await getUserNotifications(userId, nextPage, 5);
    const items: Notification[] = res.data?.data?.items || [];
    setNotifications((prev) => {
      const merged = [...prev, ...items].slice(0, maxNotifications);
      return merged;
    });
    setNotifPage(nextPage);
    setNotifHasMore(res.data?.data?.hasNextPage ?? false);
    setNotifLoading(false);
  }, [userId, notifLoading, notifHasMore, notifPage, maxNotifications]);

  return {
    notifications,
    notifLoading,
    notifHasUnread,
    notifPage,
    notifHasMore,
    notifRef,
    fetchNotifications,
    handleReadNotification,
    handleReadAll,
    handleLoadMore,
    setNotifications,
    setNotifDropdown: () => {}, // for compatibility
  };
}
