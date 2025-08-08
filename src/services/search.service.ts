// src/services/search.service.ts

import instance from "@/services/axios.customize";
import { toast } from 'react-toastify';
import { FilterOptions } from '@/components/FilterComponent';

// ================== EVENT INTERFACES & API ==================

/**
 * @description Interface Event đã được chuẩn hóa. 
 * Component sẽ chỉ làm việc với interface này để tránh lỗi TypeScript.
 */
export interface Event {
  id: string;
  name: string;
  coverImageUrl: string;
  startAt: string;
  endAt: string | null;
  location: string;
  isFree: boolean;
  isApproved?: number;
  isCancelled?: boolean;
  isActive?: boolean;
  description?: string;
}

/**
 * @description Định nghĩa kiểu trả về cho API có phân trang.
 * Luôn bao gồm danh sách items và tổng số lượng.
 */
export interface PaginatedEventsResponse {
  events: Event[];
  totalCount: number;
}

/**
 * @description Hàm tìm kiếm SỰ KIỆN đã được cập nhật.
 * - Nhận đầy đủ tham số filter, bao gồm cả page và pageSize.
 * - Trả về một object chứa 'events' và 'totalCount'.
 * - Tự động map dữ liệu thô từ API sang interface Event đã chuẩn hóa.
 */
export const searchEventsAPI = async (
  filters: FilterOptions & { page?: number; pageSize?: number }
): Promise<PaginatedEventsResponse> => {
  try {
    const params: any = {
      page: filters.page || 1,
      pageSize: filters.pageSize || 12,
      searchTerm: filters.searchTerm,
      location: filters.location,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    };
    
    // Handle date range filter
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      const startDate = new Date(now);
      
      switch (filters.dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          params.startDate = startDate.toISOString();
          break;
        case 'week':
          startDate.setDate(now.getDate() - now.getDay());
          startDate.setHours(0, 0, 0, 0);
          params.startDate = startDate.toISOString();
          break;
        case 'month':
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);
          params.startDate = startDate.toISOString();
          break;
        case 'upcoming':
          params.startDate = now.toISOString();
          break;
      }
    }
    
    const response = await instance.get('/api/Event/home', { params });
    
    // Handle different response formats
    if (response.data?.flag && Array.isArray(response.data.data?.items)) {
      // Format: { flag: true, data: { items: [], totalCount: number } }
      const apiItems = response.data.data.items;
      const totalCount = response.data.data.totalCount || apiItems.length;
      
      const mappedEvents: Event[] = apiItems.map((item: any) => ({
        id: item.eventId || item.id,
        name: item.eventName || item.name,
        coverImageUrl: item.eventCoverImageUrl || item.coverImageUrl || item.imageUrl || '',
        startAt: item.startAt || item.startTime,
        endAt: item.endAt || item.endTime || null,
        location: item.eventLocation || item.location || 'Đang cập nhật',
        isFree: Boolean(item.isFree),
        isApproved: item.isApproved,
        isCancelled: item.isCancelled,
        isActive: item.isActive,
        description: item.description || '',
      }));

      return { events: mappedEvents, totalCount };
    }
    
    // Fallback for array response
    if (Array.isArray(response.data)) {
      const mappedEvents: Event[] = response.data.map((item: any) => ({
        id: item.eventId || item.id,
        name: item.eventName || item.name,
        coverImageUrl: item.eventCoverImageUrl || item.coverImageUrl || item.imageUrl || '',
        startAt: item.startAt || item.startTime,
        endAt: item.endAt || item.endTime || null,
        location: item.eventLocation || item.location || 'Đang cập nhật',
        isFree: Boolean(item.isFree),
        isApproved: item.isApproved,
        isCancelled: item.isCancelled,
        isActive: item.isActive,
        description: item.description || '',
      }));
      return { events: mappedEvents, totalCount: mappedEvents.length };
    }
    
    // Fallback for empty or unexpected response
    return { events: [], totalCount: 0 };
    
  } catch (error) {
    console.error('Event search failed:', error);
    toast.error('Lỗi khi tìm kiếm sự kiện. Vui lòng thử lại sau.');
    return { events: [], totalCount: 0 };
  }
};


// ================== NEWS INTERFACES & API ==================

/**
 * @description Interface News đã được chuẩn hóa.
 */
export interface News {
  newsId: string;
  newsTitle: string;
  imageUrl: string | null;
  createdAt: string;
  authorFullName: string | null;
  newsDescription: string | null;
  newsContent?: string; // Giữ lại để có thể dùng cho description fallback
  eventLocation: string | null;
  status: boolean; // Chuẩn hóa về boolean
}

/**
 * @description Kiểu trả về cho API News có phân trang.
 */
export interface PaginatedNewsResponse {
  news: News[];
  totalCount: number;
}

/**
 * @description Hàm tìm kiếm TIN TỨC đã được cập nhật.
 * - Nhận filter và tham số phân trang.
 * - Đóng gói logic gọi API và xử lý các định dạng response khác nhau.
 * - Trả về một object chuẩn hóa.
 */
export const searchNews = async (
  filters: FilterOptions & { page?: number; pageSize?: number }
): Promise<PaginatedNewsResponse> => {
  try {
    const params: any = {
      page: filters.page || 1,
      pageSize: filters.pageSize || 12,
      searchTerm: filters.searchTerm,
      location: filters.location,
      sortBy: filters.sortBy === 'date' ? 'createdAt' : filters.sortBy, // Chuyển đổi 'date' sang 'createdAt'
      sortOrder: filters.sortOrder,
      // **QUAN TRỌNG**: Yêu cầu backend chỉ trả về các tin tức có status active
      // Điều này giúp cải thiện hiệu năng, không cần lọc ở client.
      status: 'active' 
    };
    
    // Xử lý dateRange nếu có...
    if (filters.dateRange && filters.dateRange !== 'all') {
        // ... (logic xử lý dateRange của bạn)
    }

    const response = await instance.get('/api/News/all-Home', { params });

    // Xử lý các định dạng response khác nhau
    let items: any[] = [];
    let totalItems = 0;

    if (response.data?.data?.items) {
      items = response.data.data.items;
      totalItems = response.data.data.totalCount || items.length;
    } else if (Array.isArray(response.data)) {
      items = response.data;
      totalItems = items.length;
    }

    // Map dữ liệu thô sang interface News đã chuẩn hóa
    const mappedNews: News[] = items.map((item: any) => ({
      newsId: item.newsId,
      newsTitle: item.newsTitle,
      imageUrl: item.imageUrl || null,
      createdAt: item.createdAt,
      authorFullName: item.authorFullName || null,
      newsDescription: item.newsDescription || null,
      newsContent: item.newsContent || '',
      eventLocation: item.eventLocation || null,
      // Chuẩn hóa status về boolean
      status: [true, 1, 'true', '1'].includes(item.status), 
    }));

    return { news: mappedNews, totalCount: totalItems };

  } catch (error: any) {
    console.error('News search failed:', error);
    toast.error(`Lỗi khi tải tin tức: ${error.message}`);
    return { news: [], totalCount: 0 };
  }
};


// ================== GLOBAL SEARCH ==================

export const searchAll = async (filters: FilterOptions): Promise<{ events: Event[], news: News[] }> => {
  try {
    const [eventResponse, newsResponse] = await Promise.all([
      searchEventsAPI({ ...filters, page: 1, pageSize: 200 }),
      searchNews(filters)
    ]);
    
    return { 
      events: eventResponse.events, 
      news: newsResponse.news 
    };
  } catch (error) {
    console.error('Global search failed:', error);
    return { events: [], news: [] };
  }
};

export type { FilterOptions };