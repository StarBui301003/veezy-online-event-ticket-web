export interface DiscountCodeResponse {
  flag: boolean;
  code: number;
  data: {
    items: {
      discountId: string;
      eventId: string;
      code: string;
      discountType: number;
      value: number;
      minimum: number;
      maximum: number;
      maxUsage: number;
      usedCount: number;
      expiredAt: string;  
      createdAt: string;  
      isExpired: boolean;
      isAvailable: boolean;
      remainingUsage: number;
    }[];
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  message: string | null;
}

export interface DiscountCodeCreateInput {
  eventId: string;
  code: string;
  discountType: number;
  value: number;
  minimum: number;
  maximum: number;
  maxUsage: number;
  expiredAt: string; 
}

export interface DiscountCodeUpdateInput {
  code: string;
  discountType: number;
  value: number;
  minimum: number;
  maximum: number;
  maxUsage: number;
  expiredAt: string;
}

export enum DiscountType {
  Percentage = 0,
  Fixed = 1,
  Other = 3,
}