import { CreateNewsRequest, NewsFilterParams } from './../../types/Admin/news';
import instance from '@/services/axios.customize';
import type { NewsListResponse, News } from '@/types/Admin/news';

export async function getAllNews(params?: NewsFilterParams): Promise<NewsListResponse> {
  const res = await instance.get(`/api/News/all`, {
    params,
  });
  return res.data;
}

export async function getAllNewsActive(params?: NewsFilterParams): Promise<NewsListResponse> {
  const res = await instance.get(`/api/News/active`, {
    params,
  });
  return res.data;
}

export async function getAllNewsInactive(params?: NewsFilterParams): Promise<NewsListResponse> {
  const res = await instance.get(`/api/News/inactive`, {
    params,
  });
  return res.data;
}

export async function getOwnNews(params?: NewsFilterParams): Promise<NewsListResponse> {
  const res = await instance.get(`/api/News/my-news`, {
    params,
  });
  return res.data;
}

export async function deleteNews(newsId: string): Promise<void> {
  await instance.delete(`/api/News/${newsId}`);
}

export async function deleteNewsImage(imageUrl: string): Promise<void> {
  await instance.delete(`/api/News/delete-image`, {
    params: { imageUrl },
  });
}

export async function createNews(data: CreateNewsRequest): Promise<News> {
  const res = await instance.post('/api/News', data);
  return res.data;
}

export async function updateNews(newsId: string, data: CreateNewsRequest): Promise<News> {
  const res = await instance.put(`/api/News/${newsId}`, data);
  return res.data;
}

export async function hideNews(newsId: string): Promise<News> {
  const res = await instance.put(`/api/News/${newsId}/hide`);
  return res.data;
}
export async function showNews(newsId: string): Promise<News> {
  const res = await instance.put(`/api/News/${newsId}/show`);
  return res.data;
}
export async function getPendingNews(params?: NewsFilterParams): Promise<NewsListResponse> {
  const res = await instance.get(`/api/News/pending`, {
    params,
  });
  return res.data;
}

export async function getApprovedNews(params?: NewsFilterParams): Promise<NewsListResponse> {
  const res = await instance.get(`/api/News/approve`, {
    params,
  });
  return res.data;
}

export async function getRejectedNews(params?: NewsFilterParams): Promise<NewsListResponse> {
  const res = await instance.get(`/api/News/rejected`, {
    params,
  });
  return res.data;
}

export async function ApprovedNews(newsId: string): Promise<News> {
  const res = await instance.put(`/api/News/${newsId}/approve`);
  return res.data;
}

export async function RejectedNews(newsId: string, reason: string): Promise<News> {
  const res = await instance.put(`/api/News/${newsId}/reject`, { reason });
  return res.data;
}

// Lấy news theo newsId
export async function getNewsById(newsId: string): Promise<News> {
  const res = await instance.get<{ data: News }>(`/api/News/${newsId}`);
  return res.data.data;
}
