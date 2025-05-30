import { AdminOrderListResponse } from "@/types/Admin/order";
import instance from "../axios.customize";

export async function getOrdersAdmin(params?: { page?: number; pageSize?: number; eventId?: string }) {
  const res = await instance.get<AdminOrderListResponse>('/api/Order', { params });
  return res.data;
}