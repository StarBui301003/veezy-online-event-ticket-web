import instance from './axios.customize';

export async function getUserNotifications(userId: string, page = 1, pageSize = 100) {
  return instance.get(`/api/Notification/user/${userId}?page=${page}&pageSize=${pageSize}`);
}

export async function markNotificationRead(notificationId: string, userId: string) {
  return instance.put(`/api/Notification/${notificationId}/read`, null, { params: { userId } });
}

export async function markAllNotificationsRead(userId: string) {
  return instance.put(`/api/Notification/user/${userId}/read-all`);
}

// Send notification to event attendance
export function sendAttendanceNotification(data: {
  eventId: string;
  title: string;
  message: string;
  roles: number[];
  sendEmail: boolean;
}) {
  return instance.post('/api/Notification/event-attendance', data);
}

// Send notification to event wishlist
export function sendWishlistNotification(data: {
  eventId: string;
  title: string;
  message: string;
  sendEmail: boolean;
}) {
  return instance.post('/api/Notification/event-wishlist', data);
}

// Send notification to event followers
export function sendFollowersNotification(data: {
  eventManagerId: string;
  title: string;
  message: string;
  sendEmail: boolean;
}) {
  return instance.post('/api/Notification/event-followers', data);
}