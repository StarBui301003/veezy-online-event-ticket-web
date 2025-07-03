import instance from '../axios.customize';
import type { GetAllReportResponse } from '@/types/Admin/report';
import axios from 'axios';

export async function getAllReport(): Promise<GetAllReportResponse> {
  const res = await instance.get(`/api/Report`);
  return res.data;
}
export async function getPendingReport(): Promise<GetAllReportResponse> {
  const res = await instance.get(`/api/Report/pending`);
  return res.data;
}

export async function getResolvedReport(): Promise<GetAllReportResponse> {
  const res = await instance.get(`/api/Report/resolved`);
  return res.data;
}

export async function getRejectedReport(): Promise<GetAllReportResponse> {
  const res = await instance.get(`/api/Report/rejected`);
  return res.data;
}

export async function resolveReport(reportId: string, note: string) {
  return instance.put(`/api/Report/${reportId}/resolve`, { note });
}

export async function rejectReport(reportId: string, note: string) {
  return instance.put(`/api/Report/${reportId}/reject`, { note });
}
