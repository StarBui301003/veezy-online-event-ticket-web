import instance from './axios.customize';
import { logNotificationApiCall } from '@/utils/notification-debug';

// API Response interface matching the swagger spec
interface ApiResponse<T> {
  flag: boolean;
  code: number;
  message: string;
  data: T;
}

interface NotificationItem {
  notificationId: string;
  userId: string;
  notificationTitle: string;
  notificationMessage: string;
  notificationType: number;
  isRead: boolean;
  redirectUrl?: string;
  createdAt: string;
  createdAtVietnam: string;
  readAt?: string;
  readAtVietnam?: string;
  username?: string;
  userRole?: number; // Add this line for role-based filtering
}

interface PaginatedResponse {
  items: NotificationItem[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Global tracking for all notifications being processed across the entire application
const globalProcessingNotifications = new Set<string>();

// Track ongoing requests to prevent duplicates
const ongoingRequests = new Map<string, Promise<ApiResponse<boolean>>>();

// Track component-level calls to prevent duplicates from different components
const componentCallTracking = new Map<string, { component: string; timestamp: number }>();

// CRITICAL: Global Header lock to prevent duplicate calls from Header component
const headerLock = new Map<string, { timestamp: number; locked: boolean }>();

// Enhanced deduplication with component tracking
const preventDuplicateCalls = (notificationId: string, component: string): boolean => {
  const now = Date.now();
  const existingCall = componentCallTracking.get(notificationId);

  // CRITICAL: Check Header lock first
  if (component.includes('Header')) {
    const headerLockInfo = headerLock.get(notificationId);
    if (headerLockInfo && headerLockInfo.locked) {
      console.log(`[notification.service] 🚫 HEADER LOCKED: Header component blocked by global lock for notification ${notificationId}`);
      return true; // Block the call
    }

    // Set Header lock for this notification
    headerLock.set(notificationId, { timestamp: now, locked: true });

    // Release Header lock after 2 seconds
    setTimeout(() => {
      const currentLock = headerLock.get(notificationId);
      if (currentLock && currentLock.timestamp === now) {
        headerLock.delete(notificationId);
        console.log(`[notification.service] 🔓 Header lock released for notification ${notificationId}`);
      }
    }, 2000);
  }

  if (existingCall) {
    const timeDiff = now - existingCall.timestamp;

    // CRITICAL: If Header component calls within 100ms of ANY other component, block it
    if (component.includes('Header') && timeDiff < 100) {
      console.log(`[notification.service] 🚫 CRITICAL BLOCK: Header component called too soon after ${existingCall.component} for notification ${notificationId}`);
      return true; // Block the call
    }

    // If called within 50ms from any component, block it (reduced from 100ms)
    if (timeDiff < 50) {
      console.log(`[notification.service] 🚫 BLOCKED: ${component} called within 50ms of ${existingCall.component} for notification ${notificationId}`);
      return true; // Block the call
    }

    // If called within 3 seconds from the same component, block it (increased from 2s)
    if (existingCall.component === component && timeDiff < 3000) {
      console.log(`[notification.service] 🚫 BLOCKED: ${component} called too frequently for notification ${notificationId}`);
      return true; // Block the call
    }

    // SPECIAL CASE: If Header component calls within 1 second of any other component, block it
    if (component.includes('Header') && timeDiff < 1000) {
      console.log(`[notification.service] 🚫 BLOCKED: Header component called too soon after ${existingCall.component} for notification ${notificationId}`);
      return true; // Block the call
    }
  }

  // Track this call
  componentCallTracking.set(notificationId, { component, timestamp: now });

  // Clean up old tracking data after 10 seconds (increased from 5s)
  setTimeout(() => {
    componentCallTracking.delete(notificationId);
  }, 10000);

  return false; // Allow the call
};

export async function getUserNotifications(userId: string, page = 1, pageSize = 100, userRole?: number) {
  try {
    const params: Record<string, number> = { page, pageSize };
    if (userRole !== undefined) params.userRole = userRole;
    console.log(`Calling API: /api/Notification/user/${userId} with`, params);
    const response = await instance.get<ApiResponse<PaginatedResponse>>(
      `/api/Notification/user/${userId}`,
      { params }
    );
    console.log('API Response:', response);
    return response;
  } catch (error) {
    console.error('Error in getUserNotifications:', error);
    throw error;
  }
}

export async function markNotificationRead(notificationId: string, userId: string) {
  // Log API call for debugging
  logNotificationApiCall(notificationId, 'notification.service');

  console.log(`[notification.service] 🔍 Starting markNotificationRead for:`, {
    notificationId,
    userId,
    timestamp: new Date().toISOString(),
    stack: new Error().stack?.split('\n').slice(1, 4).join('\n')
  });

  // Enhanced component-level deduplication with stack trace analysis
  const stack = new Error().stack || '';
  let componentName = 'notification.service';

  // Try to identify the actual calling component from stack trace
  if (stack.includes('NotificationDropdown')) {
    componentName = 'Header.NotificationDropdown';
    console.log(`[notification.service] 🎯 Detected Header.NotificationDropdown call for notification: ${notificationId}`);
  } else if (stack.includes('useRealtimeNotifications')) {
    componentName = 'useRealtimeNotifications';
    console.log(`[notification.service] 🎯 Detected useRealtimeNotifications call for notification: ${notificationId}`);
  } else if (stack.includes('NotificationContext')) {
    componentName = 'NotificationContext';
    console.log(`[notification.service] 🎯 Detected NotificationContext call for notification: ${notificationId}`);
  } else if (stack.includes('EventDetail')) {
    componentName = 'EventDetail';
    console.log(`[notification.service] 🎯 Detected EventDetail call for notification: ${notificationId}`);
  }

  // CRITICAL: Special logging for Header component calls
  if (componentName.includes('Header')) {
    console.log(`[notification.service] 🚨 HEADER COMPONENT CALL DETECTED for notification: ${notificationId}`);
    console.log(`[notification.service] 🚨 Stack trace:`, stack.split('\n').slice(1, 6).join('\n'));
  }

  if (preventDuplicateCalls(notificationId, componentName)) {
    console.log(`[notification.service] 🚫 Component-level deduplication blocked call for notification: ${notificationId} from ${componentName}`);
    return { flag: true, code: 200, message: 'Already processing', data: true };
  }

  // Create a unique key for this request
  const requestKey = `markRead_${notificationId}_${userId}`;

  // Check global processing set first
  if (globalProcessingNotifications.has(notificationId)) {
    console.log(`[notification.service] 🚫 Notification ${notificationId} is already being processed globally`);
    return { flag: true, code: 200, message: 'Already processing', data: true };
  }

  // If there's already an ongoing request for this notification, return it
  if (ongoingRequests.has(requestKey)) {
    console.log(`[notification.service] 🔄 Request already in progress for: ${requestKey}`);
    return ongoingRequests.get(requestKey);
  }

  // Create AbortController for this request
  const abortController = new AbortController();

  try {
    console.log(`[notification.service] ✅ Marking notification as read: ${notificationId} for user: ${userId} from ${componentName}`);

    // Add to global processing set
    globalProcessingNotifications.add(notificationId);
    console.log(`[notification.service] 📝 Added to global processing set: ${notificationId}`);

    // Create the request promise with abort signal
    const requestPromise = instance.put<ApiResponse<boolean>>(
      `/api/Notification/${notificationId}/read`,
      null,
      {
        params: { userId },
        signal: abortController.signal
      }
    ).then(response => response.data);

    // Store the request promise
    ongoingRequests.set(requestKey, requestPromise);
    console.log(`[notification.service] 💾 Stored request promise for: ${requestKey}`);

    // Execute the request
    const response = await requestPromise;
    console.log(`[notification.service] 🎯 API response for ${notificationId}:`, response);

    return response;
  } catch (error: unknown) { // Properly type error as unknown
    // Check if it's an abort error
    if (error instanceof Error && error.name === 'AbortError') {
      console.log(`[notification.service] ⏹️ Request aborted for notification: ${notificationId}`);
      return { flag: false, code: 499, message: 'Request aborted', data: false };
    }

    console.error(`[notification.service] ❌ Error in markNotificationRead for ${notificationId}:`, error);
    throw error;
  } finally {
    // Clean up both tracking mechanisms
    ongoingRequests.delete(requestKey);
    console.log(`[notification.service] 🧹 Cleaned up request promise for: ${requestKey}`);

    // Keep in global set for a bit longer to prevent rapid re-processing
    setTimeout(() => {
      globalProcessingNotifications.delete(notificationId);
      console.log(`[notification.service] 🗑️ Removed from global processing set: ${notificationId}`);
    }, 2000); // 2 seconds delay
  }
}

export async function markAllNotificationsRead(userId: string) {
  try {
    console.log(`Marking all notifications as read for user: ${userId}`);
    const response = await instance.put<ApiResponse<boolean>>(
      `/api/Notification/user/${userId}/read-all`
    );
    console.log('Mark all as read response:', response);
    return response;
  } catch (error) {
    console.error('Error in markAllNotificationsRead:', error);
    throw error;
  }
}

// Get all notifications (admin endpoint)
export async function getAllNotifications(page = 1, pageSize = 10) {
  try {
    console.log(`Calling API: /api/Notification/all?page=${page}&pageSize=${pageSize}`);
    const response = await instance.get<ApiResponse<PaginatedResponse>>(
      `/api/Notification/all?page=${page}&pageSize=${pageSize}`
    );
    console.log('Get all notifications response:', response);
    return response;
  } catch (error) {
    console.error('Error in getAllNotifications:', error);
    throw error;
  }
}

// Send notification to event attendance
export function sendAttendanceNotification(data: {
  eventId: string;
  title: string;
  message: string;
  roles: number[];
  sendEmail: boolean;
}) {
  try {
    console.log('Sending attendance notification:', data);
    return instance.post('/api/Notification/event-attendance', data);
  } catch (error) {
    console.error('Error in sendAttendanceNotification:', error);
    throw error;
  }
}

// Send notification to event wishlist
export function sendWishlistNotification(data: {
  eventId: string;
  title: string;
  message: string;
  sendEmail: boolean;
}) {
  try {
    console.log('Sending wishlist notification:', data);
    return instance.post('/api/Notification/event-wishlist', data);
  } catch (error) {
    console.error('Error in sendWishlistNotification:', error);
    throw error;
  }
}

// Send notification to event followers
export function sendFollowersNotification(data: {
  eventManagerId: string;
  title: string;
  message: string;
  sendEmail: boolean;
}) {
  try {
    console.log('Sending followers notification:', data);
    return instance.post('/api/Notification/event-followers', data);
  } catch (error) {
    console.error('Error in sendFollowersNotification:', error);
    throw error;
  }
}

export const deleteNotification = async (notificationId: string): Promise<ApiResponse<boolean>> => {
  try {
    console.log('[notification.service] 🗑️ Starting deleteNotification for:', notificationId);

    // Check if notification is already being deleted
    if (globalProcessingNotifications.has(notificationId)) {
      console.log('[notification.service] 🚫 Notification already being deleted:', notificationId);
      return { flag: false, code: 400, message: 'Notification already being deleted', data: false };
    }

    // Add to global processing set
    globalProcessingNotifications.add(notificationId);
    console.log('[notification.service] 📝 Added to global processing set for delete:', notificationId);

    // Create request key for delete
    const deleteRequestKey = `delete_${notificationId}`;

    // Check if there's already an ongoing delete request
    if (ongoingRequests.has(deleteRequestKey)) {
      console.log('[notification.service] 🔄 Returning existing delete request for:', notificationId);
      return ongoingRequests.get(deleteRequestKey)!;
    }

    // Create new delete request
    const deletePromise = instance.delete(`/api/AdminNotification/${notificationId}`)
      .then(response => response.data)
      .catch(error => {
        console.error('[notification.service] ❌ Error deleting notification:', error);
        throw error;
      });

    // Store the request promise
    ongoingRequests.set(deleteRequestKey, deletePromise);
    console.log('[notification.service] 💾 Stored delete request promise for:', deleteRequestKey);

    // Execute the request
    const result = await deletePromise;
    console.log('[notification.service] ✅ Delete result for notification:', notificationId, result);

    return result;
  } catch (error) {
    console.error('[notification.service] ❌ Failed to delete notification:', notificationId, error);
    throw error;
  } finally {
    // Cleanup
    globalProcessingNotifications.delete(notificationId);
    ongoingRequests.delete(`delete_${notificationId}`);
    console.log('[notification.service] 🧹 Cleaned up delete request for:', notificationId);
  }
};