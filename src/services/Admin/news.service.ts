import { CreateNewsRequest } from './../../types/Admin/news';
import instance from '@/services/axios.customize';
import type { NewsListResponse, News } from '@/types/Admin/news';

export async function getAllNews(page = 1, pageSize = 10): Promise<NewsListResponse> {
  const res = await instance.get(`/api/News/all`, {
    params: { page, pageSize }
  });
  return res.data;
}

export async function getAllNewsActive(page = 1, pageSize = 10): Promise<NewsListResponse> {
  const res = await instance.get(`/api/News/active`, {
    params: { page, pageSize }
  });
  return res.data;
}

export async function getAllNewsInactive(page = 1, pageSize = 10): Promise<NewsListResponse> {
  const res = await instance.get(`/api/News/inactive`, {
    params: { page, pageSize }
  });
  return res.data;
}

export async function getNewsByAuthor(authorId: string, page = 1, pageSize = 10): Promise<NewsListResponse> {
  const res = await instance.get(`/api/News/byAuthor`, {
    params: { authorId, page, pageSize }
  });
  return res.data;
}

export async function deleteNews(newsId: string): Promise<void> {
  await instance.delete(`/api/News/${newsId}`);
}

/**
 * Xóa hình ảnh của news trước khi xóa news.
 * @param imageUrl Đường dẫn hình ảnh cần xóa
 */
export async function deleteNewsImage(imageUrl: string): Promise<void> {
  await instance.delete(`/api/News/delete-image`, {
    params: { imageUrl }
  });
}

export async function createNews(data: CreateNewsRequest): Promise<News> {
  const res = await instance.post('/api/News', data);
  return res.data;
}
