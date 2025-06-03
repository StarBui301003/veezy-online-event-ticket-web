export interface AdminOrder {
  orderId: string;
  customerId: string;
  eventId: string;
  items: AdminOrderTicketItem[];
  discountCode: string;
  holdUntil: string;
  totalAmount: number;
  orderStatus: number;
  paidAt: string | null;
  createdAt: string;
}

export interface AdminOrderListResponse {
  success: boolean;
  message: string;
  data: {
    items: AdminOrder[];
    pageNumber: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
export interface AdminOrderTicketItem {
  ticketId: string;
  ticketName: string;
  pricePerTicket: number;
  quantity: number;
  subtotal: number;
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
  Orther = 3,
}

export interface AdminPayment {
  paymentId: string;
  orderId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionCode: string;
  paidAt: string | null;
}

export interface AdminPaymentListResponse {
  success: boolean;
  message: string;
  data: {
    items: AdminPayment[];
    pageNumber: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
