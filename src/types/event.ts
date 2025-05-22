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
}

export interface Category {
  categoryId: string;
  categoryName: string;
  categoryDescription: string;
}
