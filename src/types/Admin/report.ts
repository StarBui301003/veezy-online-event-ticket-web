export interface Report {
  reportId: string;
  targetId: string;
  targetType: number;
  reporterId: string;
  reason: string;
  description: string | null;
  status: number;
  createdAt: string;
  updatedAt: string | null;
  note: string | null;
}

export interface GetAllReportResponse {
  flag: boolean;
  message: string;
  data: Report[];
  code: number;
}
