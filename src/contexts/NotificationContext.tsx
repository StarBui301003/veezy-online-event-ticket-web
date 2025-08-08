import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onNotification } from '@/services/signalr.service';
import { getUserNotifications } from '@/services/notification.service';
import type { Notification } from '@/hooks/useNotifications';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: React.ReactNode;
  userId?: string;
  userRole?: number;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  userId,
  userRole,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Add new notification to the list
  const addNotification = useCallback((notification: Notification) => {
    console.log('[NotificationContext] Adding new notification:', notification);

    setNotifications((prev) => {
      // Check if notification already exists to avoid duplicates
      const exists = prev.some((n) => n.notificationId === notification.notificationId);
      if (exists) {
        console.log('[NotificationContext] Notification already exists, skipping');
        return prev;
      }

      // Add to beginning and limit to 50 notifications
      const newNotifications = [notification, ...prev].slice(0, 50);
      return newNotifications;
    });

    // Update unread count
    if (!notification.isRead) {
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.notificationId === notificationId
          ? { ...n, isRead: true, readAt: new Date().toISOString() }
          : n
      )
    );

    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
    );
    setUnreadCount(0);
  }, []);

  // Refresh notifications from server
  const refreshNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await getUserNotifications(userId, 1, 50, userRole);
      const items = res.data?.data?.items || [];
      // Only filter by userRole if userRole is provided and not in event dashboard
      setNotifications(items);
      const unreadItems = items.filter((n: Notification) => !n.isRead);
      setUnreadCount(unreadItems.length);
    } catch (error) {
      console.error('[NotificationContext] Failed to refresh notifications:', error);
    }
  }, [userId, userRole]);

  // Initial fetch and setup realtime listener
  useEffect(() => {
    if (!userId) return;

    // Initial fetch
    refreshNotifications();

    // Setup realtime listener
    const handleRealtimeNotification = (notification: Notification) => {
      // Check if this notification is for the current user
      if (notification.userId === userId) {
        addNotification(notification);
      }
    };

    onNotification('ReceiveNotification', handleRealtimeNotification);

    // Cleanup handled by SignalR service in App.tsx
    return () => {
      console.log('[NotificationContext] Cleaning up for user:', userId);
    };
  }, [userId, refreshNotifications, addNotification]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotificationContext = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};
