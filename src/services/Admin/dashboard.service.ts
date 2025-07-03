/* eslint-disable @typescript-eslint/no-explicit-any */
import instance from '../axios.customize';
import type { AdminDashboardResponse } from '@/types/Admin/dashboard';

export async function getAdminDashboard(
  params?: Record<string, any>
): Promise<AdminDashboardResponse> {
  const res = await instance.get('/api/analytics/admin/dashboard', { params });
  return res.data;
}

export async function getUserAnalytics(params?: Record<string, any>) {
  const res = await instance.get('/api/analytics/admin/users', { params });
  return res.data;
}

export async function getEventAnalytics(params?: Record<string, any>) {
  const res = await instance.get('/api/analytics/admin/events', { params });
  return res.data;
}

export async function getFinancialAnalytics(params?: Record<string, any>) {
  const res = await instance.get('/api/analytics/admin/financial', { params });
  return res.data;
}
