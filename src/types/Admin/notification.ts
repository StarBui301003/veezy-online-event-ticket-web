export interface AdminNotification {
    notificationId: string;
    title: string;
    message: string;
    type: number;
    targetType: number;
    targetId: string;
    senderId: string;
    username: string;
    isRead: boolean;
    readAt: string;
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
    ChatMessage = 10,
    Other = 11
}



export enum AdminNotificationTargetType {
    Unknown = 0,
    Event = 1,
    News = 2,
    Report = 3,
    User = 4,
    Chat = 5
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

export interface AdminNotificationItem {
    notificationId: string;
    userId: string;
    notificationTitle: string;
    notificationMessage: string;
    notificationType: number;
    isRead: boolean;
    redirectUrl: string;
    createdAt: string;
    createdAtVietnam: string;
    readAt: string | null;
    readAtVietnam: string | null;
    username: string;
}

export interface PaginatedAdminNotificationResponse {
    flag: boolean;
    code: number;
    message: string;
    data: {
        items: AdminNotification[];
        totalItems: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

// Thông báo cá nhân (Personal Notification)
export interface PersonalNotification {
    notificationId: string;
    userId: string;
    notificationTitle: string;
    notificationMessage: string;
    notificationType: PersonalNotificationType;
    isRead: boolean;
    redirectUrl?: string;
    createdAt: string;
    createdAtVietnam: string;
    readAt?: string | null;
    readAtVietnam?: string | null;
    username?: string;
}

export enum PersonalNotificationType {
    EventApproved = 0,
    PayoutProcessed = 1,
    OrderSuccess = 2,
    EventManagerNewEvent = 3,
    EventManagerUpdateEvent = 4,
    EventManagerNewPost = 5,
    AdminNewEvent = 6,
    EventApprovedByAdmin = 7,
    EventRejectedByAdmin = 8,
    AdminNewReport = 9,
    WithdrawalRequested = 10,
    WithdrawalApproved = 11,
    WithdrawalRejected = 12,
    AdminWithdrawalRequest = 13,
    ReportResolved = 14,
    ReportRejected = 15,
    Assigned = 16,
    RemovedAssigned = 17,
    Other = 18,
    Welcome = 19,
    NewsApproved = 20,
    NewsRejected = 21,
    ChatMessage = 22
}

export interface PaginatedPersonalNotificationResponse {
    flag: boolean;
    code: number;
    message: string;
    data: {
        items: PersonalNotification[];
        totalItems: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

// Gửi thông báo theo vai trò (POST /api/Notification/roles)
export interface SendNotificationByRolesRequest {
    title: string;
    message: string;
    roles?: Role[];
    sendEmail?: boolean;
}

export interface SendNotificationByRolesResponse {
    flag: boolean;
    code: number;
    message: string;
    data: string;
}

export enum Role {
    Admin = 0,
    Customer = 1,
    EventManager = 2,
    Collaborator = 3
}
