export interface News {
  newsId: string;
  eventId: string;
  newsDescription: string;
  newsTitle: string;
  newsContent: string;
  authorId: string;
  imageUrl: string;
  status: boolean;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
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

export interface PaginatedNewsResponse {
  flag: boolean;
  code: number;
  data: {
    items: News[];
    pageNumber: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  message: string | null;
}
