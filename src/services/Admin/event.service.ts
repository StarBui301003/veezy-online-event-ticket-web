import type {
  AdminTicketListResponse,
  ApprovedEvent,
  EventListResponse,
} from '@/types/Admin/event';
import instance from '@/services/axios.customize';
import type { EventApproveStatus } from '@/types/Admin/event';
import { Category } from '@/types/Admin/category';

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

export async function getAllCategory() {
  const res = await instance.get<{ data: Category[] }>(`/api/Category`);
  return res.data.data;
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
