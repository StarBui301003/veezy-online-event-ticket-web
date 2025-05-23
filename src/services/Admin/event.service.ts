import type { ApprovedEventListResponse, Category } from '@/types/Admin/event';
import { adminInstance } from '@/services/axios.customize';

export async function getApprovedEvents(params?: { page?: number; pageSize?: number }) {
  const res = await adminInstance.get<ApprovedEventListResponse>(
    '/api/Event/approved',
    { params }
  );
  return res.data;
}

// Lấy category theo id
export async function getCategoryById(categoryId: string) {
  const res = await adminInstance.get<{ data: Category }>(
    `/api/category/${categoryId}`
  );
  return res.data.data;
}
