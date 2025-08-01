
import instance from "../axios.customize";
import type { Comment, PaginatedCommentResponse, ApiResponse, SentimentAnalysisResponse } from "@/types/Admin/comment";

export async function getCommentsByPaginate(page = 1, pageSize = 10): Promise<PaginatedCommentResponse> {
  const res = await instance.get('/api/Comment/commentsByPaginate', {
    params: { page, pageSize },
  });
  return res.data;
}

// Lấy comments với filter
export async function getCommentsWithFilter(params: {
  searchTerm?: string;
  eventId?: string;
  userId?: string;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDescending?: boolean;
}): Promise<PaginatedCommentResponse> {
  const res = await instance.get('/api/Comment/commentsByPaginate', { params });
  return res.data;
}

export async function deleteComment(commentId: string): Promise<Comment> {
  const res = await instance.delete(`/api/Comment/${commentId}`);
  return res.data;
}

// Lấy comment theo ID
export async function getCommentById(commentId: string): Promise<Comment> {
  const res = await instance.get(`/api/Comment/${commentId}`);
  return res.data.data;
}
export async function analyzeCommentSentiment(eventId: string): Promise<ApiResponse<SentimentAnalysisResponse>> {
  const res = await instance.get('/api/Comment/analyze-sentiment', {
    params: { eventId },
  });
  return res.data;
}
