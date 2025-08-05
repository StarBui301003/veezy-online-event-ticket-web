/* eslint-disable @typescript-eslint/no-explicit-any */
import instance from '../axios.customize';
import type {
  AdminOverviewRealtimeResponse,
  AdminUserAnalyticsResponse,
  AdminEventAnalyticsResponse,
  AdminFinancialAnalyticsResponse,
  AdminNewsAnalyticsResponse,
  ExportAnalyticsResponse,
} from '@/types/Admin/dashboard';

export async function getAdminOverviewDashboard(params?: Record<string, any>): Promise<AdminOverviewRealtimeResponse> {
  // Fetch from the new overview endpoint
  const res = await instance.get('/api/analytics/admin/realtime/overview', { params });
  return res.data;
}

// Optionally, keep the other analytics functions if still used elsewhere
export async function getUserAnalytics(params?: Record<string, any>): Promise<AdminUserAnalyticsResponse> {
  const res = await instance.get('/api/analytics/admin/users/analytics', { params });
  return res.data;
}

export async function getEventAnalytics(params?: Record<string, any>): Promise<AdminEventAnalyticsResponse> {
  const res = await instance.get('/api/analytics/admin/events/analytics', { params });
  return res.data;
}

export async function getFinancialAnalytics(params?: Record<string, any>): Promise<AdminFinancialAnalyticsResponse> {
  const res = await instance.get('/api/analytics/admin/financial/analytics', { params });
  return res.data;
}

export async function getNewAnalytics(params?: Record<string, any>): Promise<AdminNewsAnalyticsResponse> {
  const res = await instance.get('/api/analytics/admin/news/analytics', { params });
  return res.data;
}

export async function exportAnalyticsToExcel(
  analyticsType: string = 'all',
  filter?: Record<string, string | number>,
  language: number = 0
): Promise<ExportAnalyticsResponse> {
  const params = {
    analyticsType,
    language,
    ...filter,
  };

  const res = await instance.get('/api/analytics/admin/analytics/export/excel', {
    params,
    responseType: 'blob'
  });

  return {
    isSuccess: true,
    statusCode: 200,
    message: 'Export successful',
    data: res.data,
    errors: null,
  };
}
