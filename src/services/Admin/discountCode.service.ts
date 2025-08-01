import { DiscountCodeCreateInput, DiscountCodeUpdateInput, DiscountCodeResponse } from "@/types/Admin/discountCode";
import instance from "../axios.customize";

// Lấy tất cả discount code
export async function getDiscountCodes(params?: { page?: number; pageSize?: number }): Promise<DiscountCodeResponse> {
  const res = await instance.get<DiscountCodeResponse>('/api/DiscountCode', { params });
  return res.data;
}

// Lấy discount codes với filter
export async function getDiscountCodesWithFilter(params: {
  searchTerm?: string;
  eventId?: string;
  discountType?: number;
  isExpired?: boolean;
  isAvailable?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDescending?: boolean;
}): Promise<DiscountCodeResponse> {
  const res = await instance.get<DiscountCodeResponse>('/api/DiscountCode', { params });
  return res.data;
}

// Tạo mới discount code
export async function createDiscountCode(data: DiscountCodeCreateInput) {
  const res = await instance.post('/api/DiscountCode', data);
  return res.data;
}

// Lấy discount code theo id
export async function getDiscountCodeById(discountId: string) {
  const res = await instance.get(`/api/DiscountCode/${discountId}`);
  return res.data;
}

// Cập nhật discount code theo id
export async function updateDiscountCode(discountId: string, data: DiscountCodeUpdateInput) {
  const res = await instance.put(`/api/DiscountCode/${discountId}`, data);
  return res.data;
}

// Xóa discount code theo id
export async function deleteDiscountCode(discountId: string) {
  const res = await instance.delete(`/api/DiscountCode/${discountId}`);
  return res.data;
}

// Lấy discount code theo eventId
export async function getDiscountCodesByEvent(eventId: string) {
  const res = await instance.get(`/api/DiscountCode/event/${eventId}`);
  return res.data;
}

// Lấy discount code active theo eventId
export async function getActiveDiscountCodesByEvent(eventId: string) {
  const res = await instance.get(`/api/DiscountCode/event/${eventId}/active`);
  return res.data;
}
