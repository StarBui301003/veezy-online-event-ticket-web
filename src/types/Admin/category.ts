export interface Category {
  categoryId: string;
  categoryName: string;
  categoryDescription: string;
}

export interface CategoryFilterParams {
  searchTerm?: string;
  page: number;
  pageSize: number;
  sortBy?: string;
  sortDescending: boolean;
  _searchOnly?: boolean; // Flag to indicate search-only operations (no loading)
}

export interface PaginatedCategoryResponse {
  flag: boolean;
  code: number;
  data: {
    items: Category[];
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  message: string | null;
}