// Interface cho dữ liệu trả về từ API (raw)
interface RawNews {
  id: string;
  eventId: string;
  description: string;
  title: string;
  content: string;
  authorId: string;
  imageUrl: string;
  status: boolean;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface RawEvent {
  id: string;
  name: string;
  imageUrl: string;
  date: string;
  location?: string;
  description: string;
  type: string;
}
import type { News } from '@/types/event';

export interface NewsSearchFilter {
  searchTerm?: string;
  dateRange?: string;
  location?: string;
  sortBy?: string;
  sortOrder?: string;
}

export const searchNews = async (filter: NewsSearchFilter): Promise<News[]> => {
  try {
    const response = await instance.get('/api/News/global-search', {
      params: filter
    });
    if (response.data.flag && Array.isArray(response.data.data)) {
      // Map dữ liệu trả về về đúng kiểu News, chỉ lấy news đã duyệt, đang hoạt động
      return response.data.data
        .filter((item: RawNews) => item.status === true)
        .map((item: RawNews) => ({
          newsId: item.id,
          eventId: item.eventId,
          newsDescription: item.description,
          newsTitle: item.title,
          newsContent: item.content,
          authorId: item.authorId,
          imageUrl: item.imageUrl,
          status: item.status,
          eventLocation: item.location || '',
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        }));
    }
    return [];
  } catch (error) {
    console.error('Search news failed:', error);
    return [];
  }
};
import instance from "@/services/axios.customize";

export interface EventSearchFilter {
  searchTerm?: string;
  dateRange?: string;
  location?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface Event {
  eventId: string;
  eventName: string;
  eventCoverImageUrl: string;
  startAt: string;
  endAt: string;
  eventLocation: string;
  isApproved: number;
  isCancelled: boolean;
  isActive: boolean;
  description: string;
  isFree: boolean;
  type?: string;
}

export const searchEvents = async (filter: EventSearchFilter): Promise<Event[]> => {
  try {
    const response = await instance.get('/api/Event/global-search', {
      params: filter
    });
    if (response.data.flag && Array.isArray(response.data.data)) {
      // Map dữ liệu trả về về đúng kiểu Event
      return response.data.data
        .filter((item: RawEvent) => item.type === 'event')
        .map((item: RawEvent) => ({
          eventId: item.id,
          eventName: item.name,
          eventCoverImageUrl: item.imageUrl,
          startAt: item.date,
          endAt: item.date,
          eventLocation: item.location || '',
          isApproved: 1,
          isCancelled: false,
          isActive: true,
          description: item.description,
          isFree: false,
          type: item.type,
        }));
    }
    return [];
  } catch (error) {
    console.error('Search failed:', error);
    return [];
  }
};
