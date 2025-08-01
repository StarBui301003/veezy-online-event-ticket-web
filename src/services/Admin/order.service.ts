import instance from "@/services/axios.customize";
import type { AdminOrderListResponse, AdminPaymentListResponse, OrderFilterParams, PaymentFilterParams } from "@/types/Admin/order";

// API: Get orders (Admin) - matches backend /api/Order
export async function getOrdersAdmin(params?: OrderFilterParams) {
  const res = await instance.get<AdminOrderListResponse>('/api/Order', { params });
  return res.data;
}

// API: Get payments (Admin) - matches backend /api/Payment
export async function getPaymentsAdmin(params?: PaymentFilterParams) {
  const res = await instance.get<AdminPaymentListResponse>('/api/Payment', { params });
  return res.data;
}

export async function processFreeOrder(orderId: string) {
  const res = await instance.post(`/api/Payment/process-free-order/${orderId}`);
  return res.data;
}

// Export types for use in components
export type { OrderFilterParams, PaymentFilterParams };