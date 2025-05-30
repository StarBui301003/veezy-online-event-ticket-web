import instance from "@/services/axios.customize";
import { AdminOrderListResponse } from "@/types/Admin/order";



// API: Get orders (Admin)
export async function getOrdersAdmin(params?: { page?: number; pageSize?: number; eventId?: string }) {
  const res = await instance.get<AdminOrderListResponse>('/api/Order', { params });
  return res.data;
}
