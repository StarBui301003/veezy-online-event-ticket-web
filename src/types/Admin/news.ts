export interface News {
  newsId: string;
  eventId?: string;
  eventName?: string;
  newsDescription: string;
  newsTitle: string;
  newsContent: string;
  authorId: string;
  authorName?: string;
  imageUrl?: string;
  status: boolean;
  isApprove?: string; // Approved, Pending, Rejected
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateNewsRequest {
  eventId?: string;
  newsDescription: string;
  newsTitle: string;
  newsContent: string;
  authorId: string;
  imageUrl?: string;
  status: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface NewsFilterParams {
  // Pagination parameters
  page?: number;
  pageSize?: number;

  // Search and filter parameters
  searchTerm?: string;
  authorFullName?: string;
  eventId?: string;
  authorId?: string;
  createdFrom?: string; // Date filter from
  createdTo?: string; // Date filter to
  sortBy?: string;
  sortDescending?: boolean;
  _searchOnly?: boolean; // Flag to indicate search-only operations (no loading)
}

export interface NewsListResponse {
  flag: boolean;
  code: number;
  data: {
    items: News[];
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  message: string;
}

