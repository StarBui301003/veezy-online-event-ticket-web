export interface TicketForm {
  name: string;
  description: string;
  price: number;
  quantity: number;
  saleStartTime: string;
  saleEndTime: string;
  maxTicketsPerOrder: number;
  isTransferable?: boolean;
  imageUrl?: string;
} 