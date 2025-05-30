
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
