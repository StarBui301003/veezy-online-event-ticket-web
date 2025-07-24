import instance from '../axios.customize';
import type {
    PaginatedAdminNotificationResponse,
    PaginatedPersonalNotificationResponse,
    SendNotificationByRolesRequest,
    SendNotificationByRolesResponse
} from '@/types/Admin/notification';

// Lấy danh sách thông báo admin (có phân trang)
export async function getAdminNotifications(
    page: number = 1,
    pageSize: number = 10,
    isRead?: boolean
): Promise<PaginatedAdminNotificationResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (typeof isRead === 'boolean') params.append('isRead', isRead.toString());
    const res = await instance.get(`/api/AdminNotification?${params.toString()}`);
    return res.data;
}

// Lấy tổng số thông báo chưa đọc của admin
export async function getAdminUnreadCount(): Promise<number> {
    const res = await instance.get(`/api/AdminNotification/unread-count`);
    if (res.data && typeof res.data.data === 'number') {
        return res.data.data;
    }
    return 0;
}

// Đánh dấu 1 thông báo là đã đọc
export async function markAdminNotificationAsRead(
    notificationId: string
): Promise<{ flag: boolean; code: number; message: string; data: boolean }> {
    const res = await instance.put(`/api/AdminNotification/${notificationId}/mark-read`);
    return res.data;
}

// Đánh dấu tất cả thông báo là đã đọc
export async function markAllAdminNotificationsAsRead(): Promise<{ flag: boolean; code: number; message: string; data: boolean }> {
    const res = await instance.put(`/api/AdminNotification/mark-all-read`);
    return res.data;
}

// Xóa 1 thông báo
export async function deleteAdminNotification(
    notificationId: string
): Promise<{ flag: boolean; code: number; message: string; data: boolean }> {
    const res = await instance.delete(`/api/AdminNotification/${notificationId}`);
    return res.data;
}

// Lấy danh sách thông báo cá nhân (có phân trang, không filter)
export async function getPersonalNotifications(
    userId: string,
    page: number = 1,
    pageSize: number = 10
): Promise<PaginatedPersonalNotificationResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    const res = await instance.get(`/api/Notification/user/${userId}?${params.toString()}`);
    return res.data;
}

// Đánh dấu 1 thông báo cá nhân là đã đọc
export async function markPersonalNotificationAsRead(
    notificationId: string,
    userId: string
): Promise<{ flag: boolean; code: number; message: string; data: boolean }> {
    const res = await instance.put(`/api/Notification/${notificationId}/read?userId=${userId}`);
    return res.data;
}

// Đánh dấu tất cả thông báo cá nhân là đã đọc
export async function markAllPersonalNotificationsAsRead(
    userId: string
): Promise<{ flag: boolean; code: number; message: string; data: boolean }> {
    const res = await instance.put(`/api/Notification/user/${userId}/read-all`);
    return res.data;
}

// Đếm số thông báo cá nhân chưa đọc
export async function getPersonalUnreadCount(userId: string): Promise<number> {
    const res = await getPersonalNotifications(userId, 1, 9999);
    if (res && res.data && Array.isArray(res.data.items)) {
        return res.data.items.filter(n => !n.isRead).length;
    }
    return 0;
}

// Gửi thông báo theo vai trò (POST /api/Notification/roles)
export async function sendNotificationByRoles(
    request: SendNotificationByRolesRequest
): Promise<SendNotificationByRolesResponse> {
    const res = await instance.post('/api/Notification/roles', request);
    return res.data;
}
