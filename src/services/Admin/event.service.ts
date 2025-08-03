import type {
  AdminTicketListResponse,
  ApprovedEvent,
  EventListResponse,
} from '@/types/Admin/event';
import instance from '@/services/axios.customize';
import type { EventApproveStatus } from '@/types/Admin/event';
import { Category } from '@/types/Admin/category';
import type { PaginatedCategoryResponse } from '@/types/Admin/category';
import { getCategoryIdsFromNames, initializeCategoryMapping } from './category.service';
import qs from 'qs';

// New filter interface for events
export interface EventFilterParams {
  // Pagination parameters
  page?: number;
  pageSize?: number;

  // Search and filter parameters
  searchTerm?: string;
  createdByFullName?: string;
  categoryIds?: string[];
  categoryNames?: string[]; // New field for category names
  location?: string;
  startFrom?: string;
  startTo?: string;
  endFrom?: string;
  endTo?: string;
  createdBy?: string;
  sortBy?: string;
  sortDescending?: boolean;
}

// Helper function to convert category names to IDs
const convertCategoryNamesToIds = async (params: EventFilterParams): Promise<EventFilterParams> => {
  if (params.categoryNames && params.categoryNames.length > 0) {
    // Initialize category mapping if needed
    await initializeCategoryMapping();

    const categoryIds = getCategoryIdsFromNames(params.categoryNames);
    return {
      ...params,
      categoryIds: [...(params.categoryIds || []), ...categoryIds],
      categoryNames: undefined // Remove categoryNames from final params
    };
  }
  return params;
};

// New comprehensive event filter functions
export async function getPendingEventsWithFilter(params: EventFilterParams) {
  const processedParams = await convertCategoryNamesToIds(params);
  console.log('🚀 API Call - getPendingEventsWithFilter:', processedParams);
  const res = await instance.get<EventListResponse>('/api/Event/pending', {
    params: processedParams,
    paramsSerializer: (params) => qs.stringify(params, { arrayFormat: 'repeat' })
  });
  console.log('📥 API Response - getPendingEventsWithFilter:', res.data);
  return res.data;
}

export async function getApprovedEventsWithFilter(params: EventFilterParams) {
  const processedParams = await convertCategoryNamesToIds(params);
  console.log('🚀 API Call - getApprovedEventsWithFilter:', processedParams);
  const res = await instance.get<EventListResponse>('/api/Event/approved', {
    params: processedParams,
    paramsSerializer: (params) => qs.stringify(params, { arrayFormat: 'repeat' })
  });
  console.log('📥 API Response - getApprovedEventsWithFilter:', res.data);
  return res.data;
}

export async function getRejectedEventsWithFilter(params: EventFilterParams) {
  const res = await instance.get<EventListResponse>('/api/Event/rejected', { params });
  return res.data;
}

export async function getCanceledEventsWithFilter(params: EventFilterParams) {
  const res = await instance.get<EventListResponse>('/api/Event/canceled', { params });
  return res.data;
}

export async function getCompletedEventsWithFilter(params: EventFilterParams) {
  const res = await instance.get<EventListResponse>('/api/Event/completedEvents', { params });
  return res.data;
}

export async function getApprovedEvents(params?: { page?: number; pageSize?: number }) {
  const res = await instance.get<EventListResponse>('/api/Event/approved', { params });
  return res.data;
}

export async function getRejectedEvents(params?: { page?: number; pageSize?: number }) {
  const res = await instance.get<EventListResponse>('/api/Event/rejected', { params });
  return res.data;
}

export async function getPendingEvents(params?: { page?: number; pageSize?: number }) {
  const res = await instance.get<EventListResponse>('/api/Event/pending', { params });
  return res.data;
}

export async function getCanceledEvents(params?: { page?: number; pageSize?: number }) {
  const res = await instance.get<EventListResponse>('/api/Event/canceled', { params });
  return res.data;
}

export async function cancelEvent(eventId: string) {
  const res = await instance.post(`/api/Event/${eventId}/cancel`);
  return res.data;
}

export async function getCompletedEvents(params?: { page?: number; pageSize?: number }) {
  const res = await instance.get<EventListResponse>('/api/Event/completedEvents', { params });
  return res.data;
}

// Duyệt hoặc từ chối event (approve/reject) với enum
export async function approvedRejectEvent(
  eventId: string,
  isApproved: EventApproveStatus,
  rejectionReason?: string
) {
  const res = await instance.post(`/api/Event/${eventId}/approve`, {
    isApproved,
    rejectionReason: rejectionReason,
  });
  console.log('res', rejectionReason);
  return res.data;
}

// Lấy category theo id
export async function getCategoryById(categoryId: string) {
  const res = await instance.get<{ data: Category }>(`/api/Category/${categoryId}`);
  return res.data.data;
}

// Lấy tất cả category với pagination
export async function getAllCategory(page = 1, pageSize = 10): Promise<PaginatedCategoryResponse> {
  const res = await instance.get('/api/Category/getCategoriesByPaginate', {
    params: { page, pageSize },
  });
  return res.data;
}

// Lấy categories với filter
export async function getCategoriesWithFilter(params: {
  searchTerm?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDescending?: boolean;
}): Promise<PaginatedCategoryResponse> {
  const res = await instance.get('/api/Category/getCategoriesByPaginate', { params });
  return res.data;
}

// API: Get tickets by eventId (Admin)
export async function getTicketsByEventAdmin(eventId: string) {
  const res = await instance.get<AdminTicketListResponse>(`/api/Ticket/event/${eventId}`);
  return res.data;
}

// Xóa category theo id
export async function deleteCategoryById(categoryId: string) {
  const res = await instance.delete(`/api/Category/${categoryId}`);
  return res.data;
}

// Tạo category mới
export async function createCategory(data: { categoryName: string; categoryDescription: string }) {
  const res = await instance.post('/api/Category', data);
  return res.data;
}
export async function editCategory(data: {
  categoryId: string;
  categoryName: string;
  categoryDescription: string;
}) {
  const res = await instance.put(`/api/Category/${data.categoryId}`, data);
  return res.data;
}

// Lấy event theo eventId
export async function getEventById(eventId: string) {
  const res = await instance.get<{ data: ApprovedEvent }>(`/api/Event/${eventId}`);
  return res.data.data;
}

// Ẩn event (set isActive = false)
export async function hideEvent(eventId: string) {
  const res = await instance.put(`/api/Event/${eventId}/hide`);
  return res.data;
}

// Hiện event (set isActive = true)
export async function showEvent(eventId: string) {
  const res = await instance.put(`/api/Event/${eventId}/show`);
  return res.data;
}

export async function deleteEvent(eventId: string) {
  const res = await instance.delete(`/api/Event/${eventId}`);
  return res.data;
}

