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
  categoryName: string[]; // Added category names
  contents: EventContent[];
  isApproved: EventApproveStatus;
  approvedBy: string;
  approvedByName: string; // Added approved by name
  approvedAt: string;
  rejectionReason: string | null;
  isActive: boolean;
  isCancelled: boolean;
  createdBy: string;
  createByName: string; // Added created by name
  createdAt: string;
  bankAccount: string;
  bankAccountName: string; // Added bank account name
  bankName: string; // Added bank name
  isWithdrawEnabled?: boolean;
  completedAt?: string;
  IsWithdrawalEnabled?: boolean; // Field từ API response
}

export interface EventListResponse {
  flag: boolean;
  code: number;
  data: {
    items: ApprovedEvent[];
    totalItems: number;
    pageSize: number;

    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  message: string | null;
}

export interface AdminTicket {
  ticketId: string;
  eventId: string;
  ticketName: string;
  ticketDescription: string;
  ticketPrice: number;
  quantityAvailable: number;
  quantitySold: number;
  startSellAt: string;
  endSellAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminTicketListResponse {
  success: boolean;
  message: string;
  data: {
    items: AdminTicket[];
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface PaginatedEventResponse {
  flag: boolean;
  code: number;
  data: {
    items: ApprovedEvent[];
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  message: string | null;
}

export interface SuggestQuantityResponseDto {
  suggested_quantity: number;
}

export interface SuggestQuantityResponse {
  flag: boolean;
  code: number;
  data: SuggestQuantityResponseDto;
  message: string | null;
}
