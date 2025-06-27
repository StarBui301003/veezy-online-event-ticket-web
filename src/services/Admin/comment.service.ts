
import instance from "../axios.customize";
import type { CommentListResponse } from "@/types/Admin/comment";

export async function getAllComment(): Promise<CommentListResponse> {
  const res = await instance.get(`/api/Comment/all`);
  return res.data;
}
export async function deleteComment(commentId: string): Promise<CommentListResponse> {
  const res = await instance.delete(`/api/Comment/${commentId}`);
  return res.data;
}