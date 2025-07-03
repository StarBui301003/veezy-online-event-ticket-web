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