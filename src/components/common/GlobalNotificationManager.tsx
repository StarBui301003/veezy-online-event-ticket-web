import React, { useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import {
  onNotification,
} from '@/services/signalr.service';

interface GlobalNotificationManagerProps {
  userId?: string;
  userRole?: string;
  isAuthenticated: boolean;
}

export const GlobalNotificationManager: React.FC<GlobalNotificationManagerProps> = ({
  userId,
  userRole,
  isAuthenticated,
}) => {

  // Setup notification handlers
  const setupNotificationHandlers = useCallback(() => {
    if (!isAuthenticated || !userId) return;

    // Core notifications from NotificationService (port 5003)
    onNotification('ReceiveNotification', (notification: any) => {
      console.log('📢 Received notification:', notification);
      toast({
        title: notification.title || 'Thông báo mới',
        description: notification.message || notification.content,
        variant: notification.type === 'error' ? 'destructive' : 'default',
      });
    });

    onNotification('ReceiveAdminNotification', (notification: any) => {
      console.log('👑 Received admin notification:', notification);
      if (userRole === '0' || userRole === 'Admin') {
        toast({
          title: `[ADMIN] ${notification.title}`,
          description: notification.message,
          variant: 'default',
        });
      }
    });

    // Event notifications from EventService
    onNotification('EventStatusChanged', (eventData: any) => {
      console.log('🎭 Event status changed:', eventData);
      toast({
        title: 'Cập nhật sự kiện',
        description: `Sự kiện "${eventData.eventName}" đã thay đổi trạng thái`,
      });
    });

    onNotification('EventApprovalStatusChanged', (eventData: any) => {
      console.log('✅ Event approval status changed:', eventData);
      const statusText = eventData.isApproved ? 'được phê duyệt' : 'bị từ chối';
      toast({
        title: 'Phê duyệt sự kiện',
        description: `Sự kiện "${eventData.eventName}" đã ${statusText}`,
        variant: eventData.isApproved ? 'default' : 'destructive',
      });
    });

    // User activity notifications
    onNotification('UserOnlineStatusChanged', (userData: any) => {
      console.log('👤 User online status changed:', userData);
      // Chỉ thông báo cho người dùng quan tâm (friends, followed users, etc.)
    });

    // Ticket/Order notifications from TicketService
    onNotification('TicketStatusChanged', (ticketData: any) => {
      console.log('🎫 Ticket status changed:', ticketData);
      toast({
        title: 'Cập nhật vé',
        description: `Vé của bạn đã thay đổi trạng thái`,
      });
    });

    onNotification('OrderStatusChanged', (orderData: any) => {
      console.log('📦 Order status changed:', orderData);
      toast({
        title: 'Cập nhật đơn hàng',
        description: `Đơn hàng #${orderData.orderId} đã thay đổi trạng thái`,
      });
    });

    // Admin task notifications
    onNotification('AdminTaskNotification', (taskData: any) => {
      console.log('⚡ Admin task notification:', taskData);
      if (userRole === '0' || userRole === 'Admin') {
        toast({
          title: '[ADMIN] Nhiệm vụ mới',
          description: taskData.message,
        });
      }
    });

    // Notification read/unread status
    onNotification('NotificationRead', (notificationId: string) => {
      console.log('👁️ Notification read:', notificationId);
      window.dispatchEvent(new CustomEvent('notificationRead', { detail: notificationId }));
    });

    onNotification('AllNotificationsRead', () => {
      console.log('👁️ All notifications read');
      window.dispatchEvent(new CustomEvent('allNotificationsRead'));
    });

    onNotification('NotificationsDeleted', (redirectUrlPattern?: string) => {
      console.log('🗑️ Notifications deleted:', redirectUrlPattern);
      window.dispatchEvent(new CustomEvent('notificationsDeleted', { detail: redirectUrlPattern }));
    });

  }, [isAuthenticated, userId, userRole]);

  // Setup notification listeners using global connections
  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    // Setup handlers using global SignalR connections from App.tsx
    setupNotificationHandlers();
    
    console.log('✅ Notification handlers setup complete for user:', userId);
  }, [isAuthenticated, userId, setupNotificationHandlers]);

  // This component doesn't render anything, it just manages notifications
  return null;
};

export default GlobalNotificationManager;
