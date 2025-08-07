// src/services/search.service.ts

import instance from "@/services/axios.customize";
import { toast } from 'react-toastify';

// Interface for FilterOptions
export interface FilterOptions {
  searchTerm: string;
  dateRange: 'all' | 'today' | 'week' | 'month' | 'upcoming';
  location: string;
  sortBy: 'date' | 'name' | 'relevance';
  sortOrder: 'asc' | 'desc';
  // For events only
  categoryIds?: string[];
  onlyUpcoming?: boolean;
  // For news only
  authorFullName?: string;
  eventId?: string;
  authorId?: string;
  // For global search
  contentType?: 'all' | 'event' | 'news';
}

// Interface cho Event từ API
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
  id: string;
  name: string;
  startTime: string | Date;
  location?: string;
  imageUrl?: string;
  status?: boolean | number | string;
  categoryName?: string;
  price?: number;
  rating?: number;
  attendees?: number;
}

// Interface cho News từ API
export interface News {
  newsId: string;
  newsTitle: string;
  newsDescription?: string;
  newsContent?: string;
  imageUrl?: string;
  createdAt?: string;
  eventLocation?: string;
  authorId?: string;
  authorFullName?: string;
  status: boolean | number | string;
  type?: string;
  date?: string;
  id?: string;
  name?: string;
  location?: string;
  description?: string;
  category?: string;
}

// Interface for unified search results
export interface SearchResult {
  id: string;
  name: string;
  description: string;
  type: 'event' | 'news';
  imageUrl: string;
  date: string;
  location?: string;
  category?: string;
  price?: number;
  rating?: number;
  attendees?: number;
  authorName?: string;
}

// Convert frontend filters to API parameters
export const convertToApiParams = (filters: FilterOptions, contentType: 'event' | 'news' | 'all') => {
  const params: any = {
    page: 1,
    pageSize: 100
  };

  // Add search term if exists
  if (filters.searchTerm) {
    params.searchTerm = encodeURIComponent(filters.searchTerm);
  }

  // Add location filter if exists
  if (filters.location) {
    params.location = encodeURIComponent(filters.location);
  }

  // Handle sorting
  if (contentType === 'news') {
    params.sortBy = filters.sortBy === 'date' ? 'CreatedAt' : 
                   filters.sortBy === 'name' ? 'Title' : 'Relevance';
  } else if (contentType === 'event') {
    params.sortBy = filters.sortBy === 'date' ? 'StartAt' : 
                   filters.sortBy === 'name' ? 'Title' : 'Relevance';
  }
  params.sortDescending = filters.sortOrder === 'desc';

  // Handle date range
  const now = new Date();
  switch (filters.dateRange) {
    case 'today':
      params.startDate = now.toISOString().split('T')[0];
      params.endDate = now.toISOString().split('T')[0];
      break;
    case 'week':
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      params.startDate = weekStart.toISOString().split('T')[0];
      params.endDate = weekEnd.toISOString().split('T')[0];
      break;
    case 'month':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      params.startDate = monthStart.toISOString().split('T')[0];
      params.endDate = monthEnd.toISOString().split('T')[0];
      break;
    case 'upcoming':
      if (contentType === 'event') {
        params.onlyUpcoming = true;
      } else {
        params.startDate = now.toISOString().split('T')[0];
      }
      break;
  }

  return params;
};

// Hàm tìm kiếm SỰ KIỆN với filter
export const searchEventsAPI = async (filters: FilterOptions): Promise<Event[]> => {
  try {
    const params = convertToApiParams(filters, 'event');
    
    console.log('Fetching events with params:', params);
    const response = await instance.get('/api/Event/home', { params });
    
    let items: any[] = [];
    
    // Handle different response formats
    if (response.data?.data?.items && Array.isArray(response.data.data.items)) {
      items = response.data.data.items;
    } else if (Array.isArray(response.data)) {
      items = response.data;
    } else if (response.data?.items && Array.isArray(response.data.items)) {
      items = response.data.items;
    }

    console.log('Raw event items:', items);

    // Map and filter events
    const events = items
      .filter((item) => {
        // Filter by status
        const status = item.status ?? item.isActive ?? item.isApproved;
        if (status === undefined || status === null) return true;
        
        if (typeof status === 'boolean') return status === true;
        if (typeof status === 'number') return status === 1;
        if (typeof status === 'string') {
          const strStatus = String(status).trim().toLowerCase();
          return strStatus === 'true' || strStatus === '1';
        }
        return false;
      })
      .map((item): Event => ({
        // Primary fields
        eventId: item.eventId || item.id || '',
        eventName: item.eventName || item.name || item.title || 'Không có tiêu đề',
        eventCoverImageUrl: item.eventCoverImageUrl || item.imageUrl || item.coverImageUrl || '',
        startAt: item.startAt || item.startTime || item.startDate || new Date().toISOString(),
        endAt: item.endAt || item.endTime || item.endDate || new Date().toISOString(),
        eventLocation: item.eventLocation || item.location || '',
        isApproved: item.isApproved || 1,
        isCancelled: item.isCancelled || false,
        isActive: item.isActive || true,
        description: item.description || item.eventDescription || '',
        isFree: item.isFree || item.price === 0 || false,
        
        // Unified fields for search
        id: item.eventId || item.id || '',
        name: item.eventName || item.name || item.title || 'Không có tiêu đề',
        startTime: item.startAt || item.startTime || item.startDate || new Date().toISOString(),
        location: item.eventLocation || item.location || '',
        imageUrl: item.eventCoverImageUrl || item.imageUrl || item.coverImageUrl || '',
        status: item.status ?? item.isActive ?? item.isApproved ?? true,
        type: 'event',
        
        // Additional fields
        categoryName: item.categoryName || item.category,
        price: item.price || (item.isFree ? 0 : undefined),
        rating: item.rating,
        attendees: item.attendees || item.participantCount
      }));

    console.log('Mapped events:', events);
    return events;
    
  } catch (error: any) {
    console.error('Event search failed:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    toast.error(`Lỗi khi tìm kiếm sự kiện: ${error.message}`);
    return [];
  }
};

// Hàm tìm kiếm TIN TỨC với filter  
export const searchNews = async (filters: FilterOptions): Promise<News[]> => {
  try {
    const params = convertToApiParams(filters, 'news');
    
    console.log('Fetching news with params:', params);
    const response = await instance.get('/api/News/all-Home', { params });
    console.log('News API response:', response.data);
    
    let items: any[] = [];
    
    // Handle different response formats
    if (response.data?.data?.items && Array.isArray(response.data.data.items)) {
      items = response.data.data.items;
    } else if (Array.isArray(response.data)) {
      items = response.data;
    } else if (response.data?.data && Array.isArray(response.data.data)) {
      items = response.data.data;
    }
    
    console.log('Raw news items:', items);
    
    // Map and filter news items
    const newsItems = items
      .filter((item) => {
        // Filter by status
        const status = item.status ?? item.isActive;
        if (status === undefined || status === null) return true;
        
        if (typeof status === 'boolean') return status === true;
        if (typeof status === 'number') return status === 1;
        if (typeof status === 'string') {
          const strStatus = String(status).trim().toLowerCase();
          return strStatus === 'true' || strStatus === '1';
        }
        return false;
      })
      .map((item): News => ({
        // Primary fields
        newsId: item.newsId || item.id || '',
        newsTitle: item.newsTitle || item.title || 'Không có tiêu đề',
        newsDescription: item.newsDescription || item.description || '',
        newsContent: item.newsContent || item.content || '',
        imageUrl: item.imageUrl || item.image || item.coverImageUrl || '',
        createdAt: item.createdAt || item.createdDate || new Date().toISOString(),
        eventLocation: item.eventLocation || item.location || '',
        authorId: item.authorId || item.author || '',
        authorFullName: item.authorFullName || item.authorName || '',
        status: item.status ?? item.isActive ?? true,
        
        // Unified fields for search
        type: 'news',
        date: item.createdAt || item.createdDate || new Date().toISOString(),
        id: item.newsId || item.id || '',
        name: item.newsTitle || item.title || 'Không có tiêu đề',
        location: item.eventLocation || item.location || '',
        description: item.newsDescription || item.description || item.newsContent?.substring(0, 200) || '',
        category: item.category || 'Tin tức'
      }));
    
    console.log('Mapped news items:', newsItems);
    return newsItems;
    
  } catch (error: any) {
    console.error('News search failed:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    toast.error(`Lỗi khi tải tin tức: ${error.message}`);
    return [];
  }
};

// Global search function for search results page
export const searchAll = async (query: string, filters?: Partial<FilterOptions>): Promise<SearchResult[]> => {
  try {
    const searchFilters: FilterOptions = {
      searchTerm: query,
      dateRange: 'all',
      location: '',
      sortBy: 'relevance',
      sortOrder: 'desc',
      contentType: 'all',
      ...filters
    };

    // Determine what to search based on contentType
    const contentType = searchFilters.contentType || 'all';
    
    let events: Event[] = [];
    let news: News[] = [];

    if (contentType === 'all' || contentType === 'event') {
      events = await searchEventsAPI(searchFilters);
    }
    
    if (contentType === 'all' || contentType === 'news') {
      news = await searchNews(searchFilters);
    }

    // Convert to unified SearchResult format
    const eventResults: SearchResult[] = events.map(event => ({
      id: event.id || event.eventId,
      name: event.name || event.eventName,
      description: event.description,
      type: 'event' as const,
      imageUrl: event.imageUrl || event.eventCoverImageUrl || '',
      date: event.startTime?.toString() || event.startAt,
      location: event.location || event.eventLocation,
      category: event.categoryName,
      price: event.price,
      rating: event.rating,
      attendees: event.attendees
    }));

    const newsResults: SearchResult[] = news.map(newsItem => ({
      id: newsItem.id || newsItem.newsId,
      name: newsItem.name || newsItem.newsTitle,
      description: newsItem.description || newsItem.newsDescription || newsItem.newsContent?.substring(0, 200) || '',
      type: 'news' as const,
      imageUrl: newsItem.imageUrl || '',
      date: newsItem.date || newsItem.createdAt || new Date().toISOString(),
      location: newsItem.location || newsItem.eventLocation,
      category: newsItem.category || 'Tin tức',
      authorName: newsItem.authorFullName
    }));

    // Combine and sort results
    const allResults = [...eventResults, ...newsResults];
    
    // Sort by relevance or date
    allResults.sort((a, b) => {
      if (searchFilters.sortBy === 'date') {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return searchFilters.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      } else if (searchFilters.sortBy === 'name') {
        return searchFilters.sortOrder === 'desc' 
          ? b.name.localeCompare(a.name, 'vi') 
          : a.name.localeCompare(b.name, 'vi');
      }
      // Default relevance sort - events first, then by date
      if (a.type !== b.type) {
        return a.type === 'event' ? -1 : 1;
      }
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    return allResults;
    
  } catch (error) {
    console.error('Global search failed:', error);
    toast.error('Lỗi khi tìm kiếm. Vui lòng thử lại sau.');
    return [];
  }
};

// Legacy function for backward compatibility
export const searchEvents = async (query: string): Promise<SearchResult[]> => {
  const filters: FilterOptions = {
    searchTerm: query,
    dateRange: 'all',
    location: '',
    sortBy: 'relevance',
    sortOrder: 'desc',
    contentType: 'all'
  };
  
  return searchAll(query, filters);
};

export type { FilterOptions };
