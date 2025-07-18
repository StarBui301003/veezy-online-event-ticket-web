import instance from '../axios.customize';
import type {
    AdminNotificationResponse,
    AdminNotificationCountResponse,
    AdminNotificationMarkReadResponse,
    AdminNotificationType,
    AdminNotificationTargetType
} from '@/types/Admin/notification';

export async function getAdminNotifications(
    page: number = 1,
    pageSize: number = 10,
    isRead?: boolean
): Promise<AdminNotificationResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (isRead !== undefined) {
        params.append('isRead', isRead.toString());
    }

    const res = await instance.get(`/api/AdminNotification?${params.toString()}`);
    return res.data;
}

export async function getAdminNotificationsByType(
    type: AdminNotificationType,
    page: number = 1,
    pageSize: number = 10
): Promise<AdminNotificationResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    params.append('type', type.toString());

    const res = await instance.get(`/api/AdminNotification/by-type?${params.toString()}`);
    return res.data;
}

export async function getAdminNotificationsByTargetType(
    targetType: AdminNotificationTargetType,
    page: number = 1,
    pageSize: number = 10
): Promise<AdminNotificationResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    params.append('targetType', targetType.toString());

    const res = await instance.get(`/api/AdminNotification/by-target-type?${params.toString()}`);
    return res.data;
}

export async function getAdminUnreadCount(): Promise<AdminNotificationCountResponse> {
    const res = await instance.get(`/api/AdminNotification/unread-count`);
    return res.data;
}



export async function markAdminNotificationAsRead(
    notificationId: string
): Promise<AdminNotificationMarkReadResponse> {
    const res = await instance.put(`/api/AdminNotification/${notificationId}/mark-read`);
    return res.data;
}

export async function markAllAdminNotificationsAsRead(): Promise<AdminNotificationMarkReadResponse> {
    const res = await instance.put(`/api/AdminNotification/mark-all-read`);
    return res.data;
}

export async function markNotificationsByTypeAsRead(type: AdminNotificationType): Promise<AdminNotificationMarkReadResponse> {
    const res = await instance.put(`/api/AdminNotification/mark-read-by-type/${type}`);
    return res.data;
}

export async function deleteAdminNotification(
    notificationId: string
): Promise<AdminNotificationMarkReadResponse> {
    const res = await instance.delete(`/api/AdminNotification/${notificationId}`);
    return res.data;
}

export async function deleteAllReadNotifications(): Promise<AdminNotificationMarkReadResponse> {
    const res = await instance.delete(`/api/AdminNotification/delete-read`);
    return res.data;
}

export async function deleteNotificationsByType(type: AdminNotificationType): Promise<AdminNotificationMarkReadResponse> {
    const res = await instance.delete(`/api/AdminNotification/delete-by-type/${type}`);
    return res.data;
}

export async function createAdminNotification(
    title: string,
    message: string,
    type: AdminNotificationType,
    targetId?: string,
    targetType?: AdminNotificationTargetType,
    senderId?: string
): Promise<AdminNotificationMarkReadResponse> {
    const res = await instance.post(`/api/AdminNotification/create`, {
        title,
        message,
        type,
        targetId,
        targetType,
        senderId
    });
    return res.data;
}
