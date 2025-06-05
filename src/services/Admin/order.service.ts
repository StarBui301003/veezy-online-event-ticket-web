import instance from "@/services/axios.customize";
import { AdminOrderListResponse } from "@/types/Admin/order";
import type { AdminPaymentListResponse } from '@/types/Admin/order';



// API: Get orders (Admin)
export async function getOrdersAdmin(params?: { page?: number; pageSize?: number; eventId?: string }) {
  const res = await instance.get<AdminOrderListResponse>('/api/Order', { params });
  return res.data;
}

// API: Get payments (Admin)
export async function getPaymentsAdmin(params?: { page?: number; pageSize?: number; orderId?: string }) {
  const res = await instance.get<AdminPaymentListResponse>('/api/Payment', { params });
  return res.data;
}
