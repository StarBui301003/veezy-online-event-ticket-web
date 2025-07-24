/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Comment {
  commentId: string; // Guid
  eventId: string;
  userId: string;
  content: string;
  createdAt: string; // ISO date
  updatedAt: string | null;
  avatarUrl: string | null;
  fullName: string | null;
}

export interface PaginatedCommentResponse {
  flag: boolean;
  code: number;
  data: {
    items: Comment[];
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  message: string | null;
}

export interface SentimentAnalysisResponse {
  overall_sentiment: {
    positive_percentage: number;
    negative_percentage: number;
    neutral_percentage: number;
  };
  aspect_sentiments: Record<string, any>;
  top_keywords: string[];
  negative_reviews: {
    text: string;
    score: number;
  }[];
}

export interface ApiResponse<T> {
  flag: boolean;
  code: number;
  data: T;
  message: string | null;
}
