export interface Comment {
  commentId: string;
  eventId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string | null;
  avatarUrl: string | null;
  fullName: string | null;
}

export interface CommentListResponse {
  flag: boolean;
  code: number;
  data: Comment[];
  message?: string | null;
}
