import type { Category, EventListResponse } from '@/types/Admin/event';
import { adminInstance } from '@/services/axios.customize';

export async function getApprovedEvents(params?: { page?: number; pageSize?: number }) {
  const res = await adminInstance.get<EventListResponse>(
    '/api/Event/approved',
    { params }
  );
  return res.data;
}

export async function getRejectedEvents(params?: { page?: number; pageSize?: number }) {
  const res = await adminInstance.get<EventListResponse>(
    '/api/Event/rejected',
    { params }
  );
  return res.data;
}

export async function getPendingEvents(params?: { page?: number; pageSize?: number }) {
  const res = await adminInstance.get<EventListResponse>(
    '/api/Event/pending',
    { params }
  );
  return res.data;
}

export async function cancelEvent(eventId: string) {
  const res = await adminInstance.post(`/api/Event/${eventId}/cancel`);
  return res.data;
}

//(approve/reject event)
export async function approvedRejectEvent(eventId: string, isApproved: boolean, rejectionReason?: string) {
  const res = await adminInstance.post(`/api/Event/${eventId}/approve`, {
    isApproved,
    rejectionReason: rejectionReason ?? null,
  });
  return res.data;
}



// Lấy category theo id
export async function getCategoryById(categoryId: string) {
  const res = await adminInstance.get<{ data: Category }>(
    `/api/category/${categoryId}`
  );
  return res.data.data;
}



