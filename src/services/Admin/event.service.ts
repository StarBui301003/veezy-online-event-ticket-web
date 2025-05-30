import type { AdminTicketListResponse, Category, EventListResponse } from '@/types/Admin/event';
import instance  from '@/services/axios.customize';
import type { EventApproveStatus, } from '@/types/Admin/event';

export async function getApprovedEvents(params?: { page?: number; pageSize?: number }) {
  const res = await instance.get<EventListResponse>(
    '/api/Event/approved',
    { params }
  );
  return res.data;
}

export async function getRejectedEvents(params?: { page?: number; pageSize?: number }) {
  const res = await instance.get<EventListResponse>(
    '/api/Event/rejected',
    { params }
  );
  return res.data;
}

export async function getPendingEvents(params?: { page?: number; pageSize?: number }) {
  const res = await instance.get<EventListResponse>(
    '/api/Event/pending',
    { params }
  );
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
    rejectionReason: rejectionReason ?? null,
  });
  return res.data;
}

// Lấy category theo id
export async function getCategoryById(categoryId: string) {
  const res = await instance.get<{ data: Category }>(
    `/api/Category/${categoryId}`
  );
  return res.data.data;
}

// API: Get tickets by eventId (Admin)
export async function getTicketsByEventAdmin(eventId: string) {
  const res = await instance.get<AdminTicketListResponse>(`/api/Ticket/event/${eventId}`);
  return res.data;
}

