export interface EventContent {
    position: number;
    description: string;
    imageUrl: string;
}

export interface AIRecommendedEvent {
    eventId: string;
    eventName: string;
    eventDescription: string;
    eventCoverImageUrl: string;
    eventLocation: string;
    startAt: string;
    endAt: string;
    tags: string[];
    categoryIds: string[];
    contents: EventContent[];
    isApproved: number;
    approvedBy: string;
    approvedAt: string;
    rejectionReason: string;
    isActive: boolean;
    isCancelled: boolean;
    createdBy: string;
    createdAt: string;
    bankAccount: string;
    bankAccountName: string;
    bankName: string;
}

export interface AIRecommendResponse {
    flag: boolean;
    code: number;
    data: AIRecommendedEvent[];
    message: string;
} 