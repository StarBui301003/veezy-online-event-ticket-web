import instance from "../axios.customize";
import type { GetAllReportResponse } from "@/types/Admin/report";

export async function getAllReport(): Promise<GetAllReportResponse> {
  const res = await instance.get(`/api/Report`);
  return res.data;
}
export async function updateReportStatus(reportId: string, status: 0 | 1 | 2 | 3): Promise<Report> {
  const res = await instance.put(`/api/Report/${reportId}/status`, status, {
    headers: { 'Content-Type': 'application/json' }
  });
  return res.data;
}