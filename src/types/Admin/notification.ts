export interface AdminNotification {
    notificationId: string;
    title: string;
    message: string;
    type: AdminNotificationType;
    targetType: AdminNotificationTargetType;
    targetId?: string;
    senderId?: string;
    isRead: boolean;
    readAt?: string;
    createdAt: string;
    updatedAt: string;
}

export enum AdminNotificationType {
    NewEvent = 0,
    NewReport = 1,
    NewUser = 2,
    SystemAlert = 3,
    PaymentIssue = 4,
    EventApproval = 5,
    EventRejection = 6,
    UserReport = 7,
    ContentReport = 8,
    NewPost = 9,
    Other = 10
}

export enum AdminNotificationTargetType {
    Unknown = 0,
    Event = 1,
    News = 2,
    Report = 3,
    User = 4
}

export interface AdminNotificationResponse {
    flag: boolean;
    code: number;
    message: string;
    data: AdminNotification[];
}

export interface AdminNotificationCountResponse {
    flag: boolean;
    code: number;
    message: string;
    data: number;
}

export interface AdminNotificationMarkReadResponse {
    flag: boolean;
    code: number;
    message: string;
    data: boolean;
}
