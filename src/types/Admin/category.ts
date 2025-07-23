export interface Category {
  categoryId: string;
  categoryName: string;
  categoryDescription: string;
}

export interface PaginatedCategoryResponse {
  flag: boolean;
  code: number;
  data: {
    items: Category[];
    pageNumber: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  message: string | null;
}