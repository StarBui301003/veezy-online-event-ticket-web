
import instance from "../axios.customize";
import type { CommentListResponse, PaginatedCommentResponse } from "@/types/Admin/comment";

export async function getAllComment(page = 1, pageSize = 10): Promise<PaginatedCommentResponse> {
  const res = await instance.get('/api/comment/all', {
    params: { page, pageSize },
  });
  return res.data;
}
export async function deleteComment(commentId: string): Promise<CommentListResponse> {
  const res = await instance.delete(`/api/Comment/${commentId}`);
  return res.data;
}