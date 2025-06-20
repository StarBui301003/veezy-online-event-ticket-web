import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { getNewsDetail } from '@/services/Event Manager/event.service';

interface News {
  newsId: string;
  newsTitle: string;
  newsDescription: string;
  newsContent: string;
  imageUrl: string;
  createdAt?: string;
  authorId?: string;
}

const NewsDetail: React.FC = () => {
  const { newsId } = useParams<{ newsId: string }>();
  const navigate = useNavigate();
  const [news, setNews] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const res = await getNewsDetail(newsId || '');
        const data = res.data?.data;
        if (data && data.newsId) {
          setNews(data);
        } else {
          toast.error('Không tìm thấy tin tức!');
          navigate('/');
        }
      } catch {
        toast.error('Lỗi khi tải tin tức!');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    if (newsId) fetchNews();
  }, [newsId, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-gray-400" />
      </div>
    );
  }
  if (!news) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center w-full pt-20">
      {/* Ảnh lớn full màn hình, tránh bị header che */}
      {news.imageUrl && (
        <div className="w-full relative">
          <img
            src={news.imageUrl}
            alt={news.newsTitle}
            className="w-full max-h-[420px] object-cover object-center"
            style={{ minHeight: '220px' }}
          />
          {/* Nếu header là fixed, thêm margin-top cho phần dưới */}
        </div>
      )}
      {/* Nội dung */}
      <div className="w-full max-w-4xl px-4 md:px-0 mx-auto flex flex-col items-center mt-10 mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 text-center leading-tight">
          {news.newsTitle}
        </h1>
        {/* Mô tả ngắn ngay dưới tiêu đề */}
        <div className="text-lg md:text-xl text-gray-700 font-medium mb-4 text-center">
          {news.newsDescription}
        </div>
        {/* Ngày đăng */}
        <div className="text-sm text-gray-400 mb-8 text-center">
          {news.createdAt && (
            <>Ngày đăng: {new Date(news.createdAt).toLocaleString('vi-VN')}</>
          )}
        </div>
        {/* Nội dung chi tiết */}
        <div
          className="prose prose-gray max-w-4xl text-base md:text-lg leading-relaxed w-full"
          style={{ wordBreak: 'break-word' }}
          dangerouslySetInnerHTML={{ __html: news.newsContent }}
        />
      </div>
    </div>
  );
};

export default NewsDetail; 