export interface Report {
  reportId: string;
  targetId: string;
  targetName: string;
  targetType: number;
  reporterId: string;
  reporterName: string;
  reason: string;
  description: string | null;
  status: number;
  createdAt: string;
  updatedAt: string | null;
  note: string | null;
}

export interface ReportFilterParams {
  searchTerm?: string;
  targetId?: string;
  targetType?: number;
  reporterId?: string;
  reason?: string;
  status?: number;
  page: number;
  pageSize: number;
  sortBy?: string;
  sortDescending: boolean;
}

export interface GetAllReportResponse {
  flag: boolean;
  message: string;
  data: Report[];
  code: number;
}

export interface PaginatedReportResponse {
  flag: boolean;
  code: number;
  data: {
    items: Report[];
    pageNumber: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  message: string | null;
}
