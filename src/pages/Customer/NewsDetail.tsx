import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Loader2, Clock, ExternalLink, MoreVertical, Flag } from 'lucide-react';
import { toast } from 'react-toastify';
import { getNewsDetail, getAllNewsHome } from '@/services/Event Manager/event.service';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import ReportModal from '@/components/Customer/ReportModal';
import CommentSection from '@/components/Customer/CommentSection';

interface News {
  newsId: string;
  newsTitle: string;
  newsDescription: string;
  newsContent: string;
  imageUrl: string;
  createdAt?: string;
  authorId?: string;
  eventId?: string;
}

const NewsDetail: React.FC = () => {
  const { newsId } = useParams<{ newsId: string }>();
  const navigate = useNavigate();
  const [news, setNews] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedNews, setRelatedNews] = useState<News[]>([]);
  const [showCount, setShowCount] = useState(3);
  const [reportModal, setReportModal] = useState<{type: 'news' | 'comment', id: string} | null>(null);
  const location = useLocation();

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const res = await getNewsDetail(newsId || '');
        const data = res.data?.data;
        if (data && data.newsId) {
          setNews(data);
          // Lấy thêm tin liên quan
          getAllNewsHome(1, 6).then(res => setRelatedNews(res.data?.data?.items?.filter(n => n.newsId !== newsId) || []));
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

  useEffect(() => {
    return () => setReportModal(null);
  }, [location]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-gray-400" />
      </div>
    );
  }
  if (!news) return null;

  return (
    <div className="bg-white font-serif min-h-screen pt-28">
      {/* Newspaper Header */}
      <header className="border-b-4 border-black"></header>
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Headline Story */}
        <div className="mb-8 pb-6 border-b-2 border-black">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-0 flex-1">
                  {news.newsTitle}
                </h1>
              </div>
              {news.eventId && (
                <button
                  className="text-blue-600 underline text-sm flex items-center gap-1 mb-2 hover:text-blue-800 transition"
                  title="Xem sự kiện của tin này"
                  onClick={() => navigate(`/event/${news.eventId}`)}
                  type="button"
                >
                  <ExternalLink className="w-4 h-4 inline-block" />
                  Xem sự kiện của tin này
                </button>
              )}
              <p className="text-lg leading-relaxed mb-4">
                {news.newsDescription}
              </p>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-1" />
                <span>{news.createdAt && new Date(news.createdAt).toLocaleString('vi-VN')}</span>
              </div>
            </div>
            <div className="relative">
              <img
                src={news.imageUrl}
                alt={news.newsTitle}
                className="w-full h-80 object-cover border-2 border-gray-300"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="absolute top-2 right-2 p-1 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 shadow-lg">
                    <MoreVertical className="w-5 h-5 text-white" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={e => {
                      e.preventDefault();
                      setTimeout(() => setReportModal({type: 'news', id: news.newsId}), 10);
                    }}
                    className="flex items-center gap-2 text-red-600 font-semibold cursor-pointer hover:bg-red-50 rounded px-3 py-2"
                  >
                    <Flag className="w-4 h-4" /> Báo cáo tin tức
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        {/* Nội dung chi tiết */}
        <div className="prose prose-gray max-w-4xl text-base md:text-lg leading-relaxed w-full mb-10" style={{ wordBreak: 'break-word' }} dangerouslySetInnerHTML={{ __html: news.newsContent }} />
        {/* Tin liên quan */}
        {relatedNews.length > 0 && (
          <div className="mt-10 pt-6 border-t-2 border-black">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">TIN LIÊN QUAN</h2>
              <a href="/news/all" className="text-blue-600 hover:underline text-sm font-semibold">Xem tất cả tin tức</a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedNews.slice(0, showCount).map(item => (
                <div key={item.newsId} className="bg-gray-50 rounded-lg shadow p-3 cursor-pointer hover:bg-gray-100" onClick={() => navigate(`/news/${item.newsId}`)}>
                  <img src={item.imageUrl} alt={item.newsTitle} className="w-full h-28 object-cover rounded mb-2" />
                  <div className="font-bold text-base mb-1 line-clamp-2 text-center">{item.newsTitle}</div>
                  {item.eventId && (
                    <button
                      className="text-blue-600 underline text-xs flex items-center justify-center gap-1 mb-1 hover:text-blue-800 transition"
                      title="Xem sự kiện liên quan"
                      onClick={e => { e.stopPropagation(); navigate(`/event/${item.eventId}`); }}
                      type="button"
                    >
                      <ExternalLink className="w-3 h-3 inline-block" />
                      Xem sự kiện liên quan
                    </button>
                  )}
                  <div className="text-xs text-gray-500 mb-1 text-center">{item.createdAt && new Date(item.createdAt).toLocaleString('vi-VN')}</div>
                  <div className="text-sm text-gray-700 line-clamp-2 text-center">{item.newsDescription}</div>
                </div>
              ))}
            </div>
            {relatedNews.length > showCount && (
              <div className="flex justify-center mt-6">
                <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-semibold" onClick={() => setShowCount(c => c + 3)}>
                  Xem thêm
                </button>
              </div>
            )}
          </div>
        )}
      </main>
      {reportModal && (
        <ReportModal
          key={reportModal.id}
          open={Boolean(reportModal)}
          targetType={reportModal.type}
          targetId={reportModal.id}
          onClose={() => setReportModal(null)}
        />
      )}
      <CommentSection eventId={news.eventId || ''} setReportModal={setReportModal} />
    </div>
  );
};

export default NewsDetail; 