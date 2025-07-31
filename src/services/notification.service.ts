import instance from './axios.customize';

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
}

interface PaginatedResponse {
  items: NotificationItem[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export async function getUserNotifications(userId: string, page = 1, pageSize = 100) {
  try {
    console.log(`Calling API: /api/Notification/user/${userId}?page=${page}&pageSize=${pageSize}`);
    const response = await instance.get<ApiResponse<PaginatedResponse>>(
      `/api/Notification/user/${userId}?page=${page}&pageSize=${pageSize}`
    );
    console.log('API Response:', response);
    return response;
  } catch (error) {
    console.error('Error in getUserNotifications:', error);
    throw error;
  }
}

export async function markNotificationRead(notificationId: string, userId: string) {
  try {
    console.log(`Marking notification as read: ${notificationId} for user: ${userId}`);
    const response = await instance.put<ApiResponse<boolean>>(
      `/api/Notification/${notificationId}/read`,
      null, 
      { params: { userId } }
    );
    console.log('Mark as read response:', response);
    return response;
  } catch (error) {
    console.error('Error in markNotificationRead:', error);
    throw error;
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