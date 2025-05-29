export interface EventContent {
  position: number;
  description: string;
  imageUrl: string;
}
export enum EventApproveStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
}

export interface ApprovedEvent {
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
  isApproved: EventApproveStatus;
  approvedBy: string;
  approvedAt: string;
  rejectionReason: string | null;
  isActive: boolean;
  isCancelled: boolean;
  createdBy: string;
  createdAt: string;
  bankAccount: string;
}

export interface EventListResponse {
  flag: boolean;
  code: number;
  data: {
    items: ApprovedEvent[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  message: string | null;
}

export interface Category {
  categoryId: string;
  categoryName: string;
  categoryDescription: string;
}