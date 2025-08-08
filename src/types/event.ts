export interface Content {
  position: number;
  description: string;
  imageUrl: string;
}

export interface CreateEventData {
  eventName: string;
  eventDescription: string;
  eventCoverImageUrl: string;
  eventLocation: string;
  startAt: string;
  endAt: string;
  tags: string[];
  categoryIds: string[];
  contents: Content[];
  bankAccount: string;
  bankAccountName: string;
  bankName: string;
}

export interface Category {
  categoryId: string;
  categoryName: string;
  categoryDescription: string;
}

export interface CreateTicketData {
  eventId: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  saleStartTime: string;
  saleEndTime: string;
  maxTicketsPerOrder: number;
  isTransferable: boolean;
  imageUrl?: string;
}
export interface TicketPayload {
  eventId: string;
  ticketName: string;
  ticketDescription: string;
  ticketPrice: number;
  quantityAvailable: number;
  startSellAt: string;
  endSellAt: string;
  maxTicketsPerOrder: number;
  isTransferable: boolean;
  imageUrl?: string;
}

export interface EditUserRequest {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  dob: string;
  gender: number;
  categories: {
    categoryId: string;
    categoryName: string;
    categoryDescription: string;
  }[];
}

export interface NewsPayload {
  eventId: string;
  newsDescription: string;
  newsTitle: string;
  newsContent: string;
  authorId: string;
  imageUrl: string;
  status: boolean;
}

