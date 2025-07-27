export interface CheckoutItem {
  ticketId: string;
  ticketName: string;
  ticketPrice: number;
  pricePerTicket?: number | string; 
  quantity: number;
}

export interface CheckoutData {
  items: CheckoutItem[];
  discountAmount?: number;
  [key: string]: any;
}

export interface OrderInfo {
  [key: string]: any;
} 