/* eslint-disable @typescript-eslint/no-explicit-any */
import instance from '../axios.customize';
import type { PaginatedReportResponse, ReportFilterParams } from '@/types/Admin/report';

export async function getAllReport(page = 1, pageSize = 10): Promise<PaginatedReportResponse> {
  const res = await instance.get(`/api/Report/allReports`, { params: { page, pageSize } });
  return res.data;
}

export async function getPendingReport(page = 1, pageSize = 10, search = ''): Promise<PaginatedReportResponse> {
  const params: Record<string, any> = { page, pageSize };
  if (search) params.searchTerm = search;
  const res = await instance.get(`/api/Report/pending`, { params });
  return res.data;
}

export async function getResolvedReport(page = 1, pageSize = 10, search = ''): Promise<PaginatedReportResponse> {
  const params: Record<string, any> = { page, pageSize };
  if (search) params.searchTerm = search;
  const res = await instance.get(`/api/Report/resolved`, { params });
  return res.data;
}

export async function getRejectedReport(page = 1, pageSize = 10, search = ''): Promise<PaginatedReportResponse> {
  const params: Record<string, any> = { page, pageSize };
  if (search) params.searchTerm = search;
  const res = await instance.get(`/api/Report/rejected`, { params });
  return res.data;
}

// New filter-enabled functions
export async function getPendingReportsWithFilter(params: ReportFilterParams): Promise<PaginatedReportResponse> {
  const res = await instance.get(`/api/Report/pending`, { params });
  return res.data;
}

export async function getResolvedReportsWithFilter(params: ReportFilterParams): Promise<PaginatedReportResponse> {
  const res = await instance.get(`/api/Report/resolved`, { params });
  return res.data;
}

export async function getRejectedReportsWithFilter(params: ReportFilterParams): Promise<PaginatedReportResponse> {
  const res = await instance.get(`/api/Report/rejected`, { params });
  return res.data;
}

export async function getAllReportsWithFilter(params: ReportFilterParams): Promise<PaginatedReportResponse> {
  const res = await instance.get(`/api/Report/allReports`, { params });
  return res.data;
}

export async function resolveReport(reportId: string, note: string) {
  return instance.put(`/api/Report/${reportId}/resolve`, { note });
}

export async function rejectReport(reportId: string, note: string) {
  return instance.put(`/api/Report/${reportId}/reject`, { note });
}

export async function reportEvent(eventId: string, reason: string, description: string) {
  return instance.post(`/api/Report/event/${eventId}`, { reason, description });
}

export async function reportComment(commentId: string, reason: string, description: string) {
  return instance.post(`/api/Report/comment/${commentId}`, { reason, description });
}

export async function reportNews(newsId: string, reason: string, description: string) {
  return instance.post(`/api/Report/news/${newsId}`, { reason, description });
}

// Report Event Manager
export async function reportEventManager(eventManagerId: string, reason: string, description: string) {
  return instance.post(`/api/Report/event-manager/${eventManagerId}`, { reason, description });
}
