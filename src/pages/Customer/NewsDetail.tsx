import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Loader2, Clock, ExternalLink, MoreVertical, Flag, Calendar, ArrowLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { getNewsDetail, getAllNewsHome } from '@/services/Event Manager/event.service';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import ReportModal from '@/components/Customer/ReportModal';
import { connectNewsHub } from '@/services/signalr.service';

const NewsDetail: React.FC = () => {
  const { newsId } = useParams<{ newsId: string }>();
  const navigate = useNavigate();
  const [news, setNews] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [relatedNews, setRelatedNews] = useState<any[]>([]);
  const [showCount, setShowCount] = useState(3);
  const [reportModal, setReportModal] = useState<{type: 'news' | 'comment', id: string} | null>(null);
  const location = useLocation();

  useEffect(() => {
    connectNewsHub('http://localhost:5004/newsHub');
    const fetchNews = async () => {
      setLoading(true);
      try {
        const res = await getNewsDetail(newsId || '');
        const data = res.data?.data;
        if (data && data.newsId) {
          setNews(data);
          getAllNewsHome(1, 6).then((res) =>
            setRelatedNews(res.data?.data?.items?.filter((n: any) => n.newsId !== newsId) || [])
          );
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

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleReportNews = () => {
    if (news) setReportModal({type: 'news', id: news.newsId});
  };

  const handleCloseReport = () => {
    setReportModal(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center animate-pulse">
          <Loader2 className="w-12 h-12 animate-spin text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Đang tải tin tức...</p>
        </div>
      </div>
    );
  }

  if (!news) return null;

  return (
    <div className="bg-white font-serif min-h-screen">
      {/* Newspaper Header */}
      <header className="bg-white border-b-4 border-black pt-20 pb-4">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center border-b border-gray-300 pb-4">
            <h1 className="text-4xl font-bold tracking-wide text-black">TIN TỨC</h1>
            <div className="mt-2 text-sm text-gray-600 tracking-widest">
              {news.createdAt && new Date(news.createdAt).toLocaleDateString('vi-VN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 opacity-0 animate-fade-in">
          <div className="flex items-center text-sm text-gray-600">
            <button 
              onClick={() => handleNavigate('/')}
              className="hover:text-black transition-colors duration-200 flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Trang chủ
            </button>
            <ChevronRight className="w-4 h-4 mx-2" />
            <button 
              onClick={() => handleNavigate('/news/all')}
              className="hover:text-black transition-colors duration-200"
            >
              Tin tức
            </button>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-black font-medium">Chi tiết tin tức</span>
          </div>
        </nav>

        {/* Main Article */}
        <article className="mb-12 opacity-0 animate-slide-up">
          {/* Article Header */}
          <header className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-3xl md:text-5xl font-bold leading-tight text-black max-w-5xl">
                {news.newsTitle}
              </h1>
              <div className="relative ml-4">
                <button 
                  onClick={handleReportNews}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200 group hover:scale-105"
                >
                  <MoreVertical className="w-5 h-5 text-gray-600 group-hover:text-black" />
                </button>
              </div>
            </div>

            {/* Article Meta */}
            <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(news.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{new Date(news.createdAt).toLocaleTimeString('vi-VN')}</span>
              </div>
            </div>

            {/* Event Link */}
            {news.eventId && (
              <div className="mb-4">
                <button
                  className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 transition-colors duration-200 text-sm font-medium underline decoration-2 underline-offset-2 hover:decoration-blue-900"
                  onClick={() => handleNavigate(`/event/${news.eventId}`)}
                  type="button"
                >
                  <ExternalLink className="w-4 h-4" />
                  Xem sự kiện liên quan
                </button>
              </div>
            )}

            {/* Article Summary */}
            <div className="text-lg leading-relaxed text-gray-800 font-medium mb-6 border-l-4 border-black pl-4 bg-gray-50 p-4">
              {news.newsDescription}
            </div>
          </header>

          {/* Featured Image */}
          <div className="mb-8 opacity-0 animate-fade-in-delay">
            <img
              src={news.imageUrl}
              alt={news.newsTitle}
              className="w-full max-h-[500px] object-cover border border-gray-300 shadow-lg hover:shadow-xl transition-shadow duration-300"
            />
          </div>

          {/* Article Content */}
          <div className="border-t-2 border-black pt-8">
            <div
              className="prose prose-lg max-w-none text-gray-900 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: news.newsContent }}
            />
          </div>
        </article>

        {/* Related News */}
        {relatedNews.length > 0 && (
          <section className="border-t-2 border-black pt-8 opacity-0 animate-fade-in-delay-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold tracking-wide">TIN LIÊN QUAN</h2>
              <button
                onClick={() => handleNavigate('/news/all')}
                className="text-blue-700 hover:text-blue-900 transition-colors duration-200 text-sm font-medium underline decoration-2 underline-offset-2"
              >
                Xem tất cả tin tức
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedNews.slice(0, showCount).map((item, index) => (
                <article
                  key={item.newsId}
                  className="bg-white border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-lg cursor-pointer group opacity-0 animate-slide-up-stagger"
                  style={{ animationDelay: `${index * 200}ms` }}
                  onClick={() => handleNavigate(`/news/${item.newsId}`)}
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.newsTitle}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-blue-700 transition-colors duration-200">
                      {item.newsTitle}
                    </h3>
                    
                    {item.eventId && (
                      <button
                        className="text-blue-700 hover:text-blue-900 transition-colors duration-200 text-xs flex items-center gap-1 mb-2 underline decoration-1 underline-offset-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNavigate(`/event/${item.eventId}`);
                        }}
                        type="button"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Sự kiện liên quan
                      </button>
                    )}
                    
                    <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                    
                    <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
                      {item.newsDescription}
                    </p>
                  </div>
                </article>
              ))}
            </div>
            
            {relatedNews.length > showCount && (
              <div className="flex justify-center mt-8">
                <button
                  className="px-6 py-3 bg-black text-white hover:bg-gray-800 transition-all duration-200 font-medium tracking-wide hover:scale-105 transform"
                  onClick={() => setShowCount((c) => c + 3)}
                >
                  Xem thêm tin tức
                </button>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Report Modal */}
      {reportModal && (
        <ReportModal
          open={Boolean(reportModal)}
          targetType={reportModal.type}
          targetId={reportModal.id}
          onClose={handleCloseReport}
        />
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.6s ease-out forwards; }
        .animate-fade-in-delay { animation: fade-in 0.8s ease-out 0.3s forwards; }
        .animate-fade-in-delay-2 { animation: fade-in 1s ease-out 0.6s forwards; }
        .animate-slide-up { animation: slide-up 0.8s ease-out 0.2s forwards; }
        .animate-slide-up-stagger { animation: slide-up 0.6s ease-out forwards; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .prose p { margin-bottom: 1.5rem; text-align: justify; text-indent: 2rem; }
        .prose h1, .prose h2, .prose h3 { margin-top: 2rem; margin-bottom: 1rem; font-weight: bold; text-indent: 0; }
        .prose img { margin: 2rem auto; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); }
        .prose blockquote { border-left: 4px solid #000; padding-left: 1rem; margin: 2rem 0; font-style: italic; background: #f9f9f9; padding: 1rem; }
        .prose p:first-of-type::first-letter { font-size: 3rem; font-weight: bold; float: left; line-height: 1; margin: 0.1rem 0.5rem 0 0; }
      `}</style>
    </div>
  );
};

export default NewsDetail;
