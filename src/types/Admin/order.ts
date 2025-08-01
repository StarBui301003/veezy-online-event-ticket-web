// Backend OrderResponse structure
export interface AdminOrder {
  orderId: string;
  customerId: string;
  customerName: string;
  eventId: string;
  eventName: string;
  items: AdminOrderTicketItem[];
  discountCode: string | null;
  holdUntil: string;
  totalAmount: number;
  orderStatus: number;
  paidAt: string | null;
  createdAt: string;
}

export interface AdminOrderTicketItem {
  ticketId: string;
  ticketName: string;
  pricePerTicket: number;
  quantity: number;
  subtotal: number;
}

// Backend PaymentFinalResponse structure
export interface AdminPayment {
  paymentId: string | null;
  orderId: string | null;
  amount: string | null;
  paymentMethod: number | null;
  paymentStatus: number | null;
  transactionCode: string | null;
  paidAt: string | null;
}

// Backend API Response structure
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponseDto<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export type AdminOrderListResponse = ApiResponse<PaginatedResponseDto<AdminOrder>>;
export type AdminPaymentListResponse = ApiResponse<PaginatedResponseDto<AdminPayment>>;

// Order Status Enum theo backend
export enum OrderStatus {
  Pending = 0,
  Paid = 1,
  Cancelled = 2,
  Refunded = 3,
  Expired = 4,
  Orther = 5,
  PaymentSuccessButTicketFailed = 6,
  Failed = 7,
}

// Order Status Labels
export const ORDER_STATUS_LABEL: Record<string | number, string> = {
  0: 'Pending',
  1: 'Paid',
  2: 'Cancelled',
  3: 'Refunded',
  4: 'Expired',
  5: 'Other',
  6: 'Payment Success But Ticket Failed',
  7: 'Failed',
};

// Order Status Colors
export const ORDER_STATUS_COLOR: Record<string | number, string> = {
  0: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  1: 'bg-green-100 text-green-800 border-green-200',
  2: 'bg-red-100 text-red-800 border-red-200',
  3: 'bg-blue-100 text-blue-800 border-blue-200',
  4: 'bg-gray-100 text-gray-800 border-gray-200',
  5: 'bg-gray-100 text-gray-800 border-gray-200',
  6: 'bg-orange-100 text-orange-800 border-orange-200',
  7: 'bg-red-100 text-red-800 border-red-200',
};

// Order Filter Parameters theo backend
export interface OrderFilterParams {
  Page: number;
  PageSize: number;
  SearchTerm?: string;
  CustomerId?: string;
  EventId?: string;
  OrderStatus?: string;
  MinAmount?: number;
  MaxAmount?: number;
  DiscountCode?: string;
  SortBy?: string;
  SortDescending?: boolean;
}

export enum PaymentMethod {
  VietQR = 0,
  Momo = 1,
  VnPay = 2,
  Other = 3,
}

export enum PaymentStatus {
  Success = 0,
  Failed = 1,
  Pending = 2,
  Processing = 3,
  Paid = 4,
  Rejected = 5,
  Other = 6,
}

// Payment Status Labels
export const PAYMENT_STATUS_LABEL: Record<string | number, string> = {
  0: 'Success',
  1: 'Failed',
  2: 'Pending',
  3: 'Processing',
  4: 'Paid',
  5: 'Rejected',
  6: 'Other',
};

// Payment Status Colors
export const PAYMENT_STATUS_COLOR: Record<string | number, string> = {
  0: 'bg-green-100 text-green-800 border-green-200',
  1: 'bg-red-100 text-red-800 border-red-200',
  2: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  3: 'bg-blue-100 text-blue-800 border-blue-200',
  4: 'bg-green-100 text-green-800 border-green-200',
  5: 'bg-red-100 text-red-800 border-red-200',
  6: 'bg-gray-100 text-gray-800 border-gray-200',
};

// Payment Method Labels
export const PAYMENT_METHOD_LABEL: Record<string | number, string> = {
  0: 'VietQR',
  1: 'Momo',
  2: 'VnPay',
  3: 'Other',
};

// Payment Filter Parameters theo backend
export interface PaymentFilterParams {
  Page: number;
  PageSize: number;
  SearchTerm?: string;
  OrderId?: string;
  PaymentMethod?: string;
  PaymentStatus?: string;
  MinAmount?: number;
  MaxAmount?: number;
  TransactionCode?: string;
  SortBy?: string;
  SortDescending?: boolean;
}

