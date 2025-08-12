import instance from "@/services/axios.customize";
import { toast } from 'react-toastify';
import { FilterOptions } from '@/components/FilterComponent';

// --- INTERFACES ---

export interface Event {
  id: string;
  name: string;
  coverImageUrl: string;
  startAt: string;
  endAt: string | null;
  location: string | null;
  isFree: boolean;
  description?: string;
}

export interface PaginatedEventsResponse {
  events: Event[];
  totalCount: number;
}

export interface News {
  newsId: string;
  newsTitle: string;
  imageUrl: string | null;
  createdAt: string;
  authorFullName: string | null;
  newsDescription: string | null;
  eventLocation: string | null;
  status: boolean;
}

export interface PaginatedNewsResponse {
  news: News[];
  totalCount: number;
}

export interface Category {
  categoryId: string;
  categoryName: string;
}

// --- API FUNCTIONS ---

/**
 * Hàm tìm kiếm SỰ KIỆN - Đã loại bỏ logic filter thời gian
 */
export const searchEventsAPI = async (
  filters: Partial<FilterOptions> & { page?: number; pageSize?: number }
): Promise<PaginatedEventsResponse> => {
  try {
    const params: any = {
      page: filters.page || 1,
      pageSize: filters.pageSize || 12,
      searchTerm: filters.searchTerm,
      location: filters.location,
      sortBy: filters.sortBy === 'date' ? 'StartAt' : 'Name',
      sortDescending: filters.sortOrder === 'desc',
      categoryIds: filters.categoryIds,
      onlyUpcoming: true, // Mặc định chỉ lấy sự kiện sắp diễn ra
    };
    
    const response = await instance.get('/api/Event/home', { params });
    
    if (response.data?.flag && Array.isArray(response.data.data?.items)) {
        const { items: apiItems, totalCount } = response.data.data;
        const mappedEvents: Event[] = apiItems.map((item: any) => ({
            id: item.eventId || item.id,
            name: item.eventName || item.name,
            coverImageUrl: item.eventCoverImageUrl || item.coverImageUrl || '',
            startAt: item.startAt || item.startTime,
            endAt: item.endAt || item.endTime || null,
            location: item.eventLocation || item.location || null,
            isFree: Boolean(item.isFree),
            description: item.description || '',
        }));
        return { events: mappedEvents, totalCount: totalCount || apiItems.length };
    }
    
    return { events: [], totalCount: 0 };
    
  } catch (error) {
    console.error('Event search failed:', error);
    toast.error('Lỗi khi tìm kiếm sự kiện.');
    return { events: [], totalCount: 0 };
  }
};

/**
 * Hàm tìm kiếm TIN TỨC
 */
export const searchNewsAPI = async (
  filters: Partial<FilterOptions> & { page?: number; pageSize?: number }
): Promise<PaginatedNewsResponse> => {
  try {
    const params: any = {
      page: filters.page || 1,
      pageSize: filters.pageSize || 12,
      searchTerm: filters.searchTerm,
      authorFullName: filters.authorFullName,
      sortBy: filters.sortBy === 'date' ? 'CreatedAt' : 'Title',
      sortDescending: filters.sortOrder === 'desc',
    };

    const response = await instance.get('/api/News/all-Home', { params });

    let items: any[] = [];
    let totalItems = 0;

    if (response.data?.data?.items) {
      items = response.data.data.items;
      totalItems = response.data.data.totalCount || items.length;
    } else if (Array.isArray(response.data)) {
      items = response.data;
      totalItems = items.length;
    }

    const mappedNews: News[] = items.map((item: any) => ({
      newsId: item.newsId,
      newsTitle: item.newsTitle,
      imageUrl: item.imageUrl || null,
      createdAt: item.createdAt,
      authorFullName: item.authorFullName || null,
      newsDescription: item.newsDescription || null,
      eventLocation: item.eventLocation || null,
      status: true,
    }));

    return { news: mappedNews, totalCount: totalItems };

  } catch (error: any) {
    toast.error(`Lỗi khi tải tin tức: ${error.message}`);
    return { news: [], totalCount: 0 };
  }
};

export const getAllCategoriesAPI = async (): Promise<Category[]> => {
    try {
        const response = await instance.get('/api/Category');
        if (response.data?.flag && Array.isArray(response.data.data)) {
            return response.data.data;
        }
        return [];
    } catch (error) {
        console.error('Failed to fetch categories:', error);
        toast.error('Không thể tải danh sách danh mục.');
        return [];
    }
};



/**
 * Hàm tìm kiếm GLOBAL cho trang SearchResultsPage
 */
export const globalSearch = async (searchTerm: string) => {
  try {
    const response = await instance.get('/api/Event/global-search', {
      params: { searchTerm }
    });

    if (response.data?.flag && Array.isArray(response.data.data)) {
      return {
        flag: true,
        data: response.data.data.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description || '',
          type: item.type as 'event' | 'news',
          imageUrl: item.imageUrl || '',
          date: item.date,
          location: item.location || null,
          price: item.price || 0,
        }))
      };
    }

    return { flag: false, data: [], message: 'Invalid response format' };
  } catch (error) {
    console.error('Error performing global search:', error);
    toast.error('Có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại sau.');
    return { flag: false, data: [], message: 'Error performing search' };
  }
};