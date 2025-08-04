import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Loader2, Clock, ExternalLink, MoreVertical, Calendar, ArrowLeft, ChevronRight, Share2, Bookmark } from 'lucide-react';
import { toast } from 'react-toastify';
import { getNewsDetail, getAllNewsHome } from '@/services/Event Manager/event.service';
import ReportModal from '@/components/Customer/ReportModal';
import { connectNewsHub } from '@/services/signalr.service';
import { News } from '@/types/event';

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
    connectNewsHub('http://localhost:5004/newsHub');
    const fetchNews = async () => {
      setLoading(true);
      try {
        const res = await getNewsDetail(newsId || '');
        const data = res.data?.data;
        if (data && data.newsId) {
          setNews(data);
          getAllNewsHome(1, 6).then((res) =>
            setRelatedNews(res.data?.data?.items?.filter((n: News) => n.newsId !== newsId) || [])
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
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="text-center">
          <div className="relative mb-6">
            <Loader2 className="w-16 h-16 animate-spin text-blue-400 mx-auto" />
            <div className="absolute inset-0 rounded-full bg-blue-400/20 animate-pulse"></div>
          </div>
          <p className="text-gray-200 text-xl font-medium">Đang tải tin tức...</p>
          <div className="mt-2 w-48 h-1 bg-gray-700 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!news) return null;

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white min-h-screen font-inter">
      {/* Modern Header removed as requested */}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Enhanced Breadcrumb */}
        <nav className="mb-8 mt-24 opacity-0 animate-fade-in">
          <div className="flex items-center text-sm text-gray-400 bg-gray-800/30 backdrop-blur-sm rounded-lg px-4 py-3 border border-gray-700/50">
            <button 
              onClick={() => handleNavigate('/')}
              className="hover:text-blue-400 transition-all duration-200 flex items-center gap-2 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Trang chủ</span>
            </button>
            <ChevronRight className="w-4 h-4 mx-3 text-gray-600" />
            <button 
              onClick={() => handleNavigate('/news/all')}
              className="hover:text-blue-400 transition-colors duration-200 font-medium"
            >
              Tin tức
            </button>
            <ChevronRight className="w-4 h-4 mx-3 text-gray-600" />
            <span className="text-blue-400 font-semibold">Chi tiết tin tức</span>
          </div>
        </nav>

        {/* Main Article */}
        <article className="mb-16 opacity-0 animate-slide-up">
          {/* Article Header */}
          <header className="mb-10">
            <div className="flex items-start justify-between mb-6">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent max-w-5xl font-playfair">
                {news.newsTitle}
              </h1>
              <div className="flex items-center gap-3 ml-6">
                <button className="p-3 rounded-full bg-gray-800/50 hover:bg-gray-700/50 transition-all duration-200 group hover:scale-110 border border-gray-600/50">
                  <Share2 className="w-5 h-5 text-gray-300 group-hover:text-blue-400" />
                </button>
                <button className="p-3 rounded-full bg-gray-800/50 hover:bg-gray-700/50 transition-all duration-200 group hover:scale-110 border border-gray-600/50">
                  <Bookmark className="w-5 h-5 text-gray-300 group-hover:text-yellow-400" />
                </button>
                <button 
                  onClick={handleReportNews}
                  className="p-3 rounded-full bg-red-500/20 hover:bg-red-500/30 transition-all duration-200 group hover:scale-110 border border-red-500/30"
                >
                  <MoreVertical className="w-5 h-5 text-red-300 group-hover:text-red-200" />
                </button>
              </div>
            </div>

            {/* Enhanced Article Meta */}
            <div className="flex items-center gap-8 text-sm text-gray-400 mb-6 bg-gray-800/20 backdrop-blur-sm rounded-xl p-4 border border-gray-700/30">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Calendar className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Ngày đăng</div>
                  <div className="text-gray-200 font-medium">{new Date(news.createdAt).toLocaleDateString('vi-VN')}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Clock className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Thời gian</div>
                  <div className="text-gray-200 font-medium">{new Date(news.createdAt).toLocaleTimeString('vi-VN')}</div>
                </div>
              </div>
            </div>

            {/* Event Link */}
            {news.eventId && (
              <div className="mb-6">
                <button
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl transition-all duration-200 font-medium shadow-lg shadow-blue-600/25 hover:scale-105 transform"
                  onClick={() => handleNavigate(`/event/${news.eventId}`)}
                  type="button"
                >
                  <ExternalLink className="w-5 h-5" />
                  Xem sự kiện liên quan
                </button>
              </div>
            )}

            {/* Article Summary */}
            <div className="text-xl leading-relaxed text-gray-200 font-medium mb-8 bg-gradient-to-r from-gray-800/50 to-gray-700/30 backdrop-blur-sm border-l-4 border-blue-500 pl-6 pr-6 py-6 rounded-r-xl border border-gray-700/30">
              <div className="text-sm text-blue-400 uppercase tracking-wide font-semibold mb-2">Tóm tắt</div>
              <p className="font-inter leading-relaxed">{news.newsDescription}</p>
            </div>
          </header>

          {/* Featured Image */}
          <div className="mb-10 opacity-0 animate-fade-in-delay">
            <div className="relative group overflow-hidden rounded-2xl">
              <img
                src={news.imageUrl}
                alt={news.newsTitle}
                className="w-full max-h-[600px] object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </div>

          {/* Article Content */}
          <div className="border-t border-gray-700/50 pt-10">
            <div
              className="prose prose-lg prose-invert max-w-none text-gray-100 leading-relaxed prose-headings:text-white prose-headings:font-bold prose-a:text-blue-400 prose-strong:text-white prose-em:text-gray-300"
              dangerouslySetInnerHTML={{ __html: news.newsContent }}
            />
          </div>
        </article>

        {/* Related News */}
        {relatedNews.length > 0 && (
          <section className="border-t border-gray-700/50 pt-12 opacity-0 animate-fade-in-delay-2">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2 font-playfair">
                  TIN LIÊN QUAN
                </h2>
                <p className="text-gray-400">Khám phá thêm những tin tức thú vị khác</p>
              </div>
              <button
                onClick={() => handleNavigate('/news/all')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl transition-all duration-200 font-medium shadow-lg shadow-blue-600/25 hover:scale-105 transform"
              >
                Xem tất cả
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedNews.slice(0, showCount).map((item, index) => (
                <article
                  key={item.newsId}
                  className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 cursor-pointer group opacity-0 animate-slide-up-stagger hover:scale-[1.02] transform"
                  style={{ animationDelay: `${index * 200}ms` }}
                  onClick={() => handleNavigate(`/news/${item.newsId}`)}
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.newsTitle}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="font-bold text-xl mb-3 line-clamp-2 group-hover:text-blue-400 transition-colors duration-200 font-playfair leading-tight">
                      {item.newsTitle}
                    </h3>
                    
                    {item.eventId && (
                      <button
                        className="text-blue-400 hover:text-blue-300 transition-colors duration-200 text-sm flex items-center gap-2 mb-3 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20"
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
                    
                    <div className="text-xs text-gray-400 mb-3 flex items-center gap-2 bg-gray-700/30 px-3 py-2 rounded-lg">
                      <Calendar className="w-3 h-3 text-blue-400" />
                      <span className="font-medium">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                    
                    <p className="text-sm text-gray-300 line-clamp-3 leading-relaxed font-inter">
                      {item.newsDescription}
                    </p>
                  </div>
                </article>
              ))}
            </div>
            
            {relatedNews.length > showCount && (
              <div className="flex justify-center mt-10">
                <button
                  className="px-8 py-4 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl transition-all duration-200 font-medium hover:scale-105 transform shadow-lg border border-gray-600/50"
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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap');
        
        .font-inter { font-family: 'Inter', sans-serif; }
        .font-playfair { font-family: 'Playfair Display', serif; }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); } 
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); } 
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.8s ease-out forwards; }
        .animate-fade-in-delay { animation: fade-in 1s ease-out 0.4s forwards; }
        .animate-fade-in-delay-2 { animation: fade-in 1.2s ease-out 0.8s forwards; }
        .animate-slide-up { animation: slide-up 1s ease-out 0.3s forwards; }
        .animate-slide-up-stagger { animation: slide-up 0.8s ease-out forwards; }
        
        .line-clamp-2 { 
          display: -webkit-box; 
          -webkit-line-clamp: 2; 
          -webkit-box-orient: vertical; 
          overflow: hidden; 
        }
        .line-clamp-3 { 
          display: -webkit-box; 
          -webkit-line-clamp: 3; 
          -webkit-box-orient: vertical; 
          overflow: hidden; 
        }
        
        .prose {
          font-family: 'Inter', sans-serif;
        }
        .prose p { 
          margin-bottom: 1.8rem; 
          text-align: justify; 
          line-height: 1.8;
          font-size: 1.1rem;
        }
        .prose p:first-of-type {
          font-size: 1.2rem;
          font-weight: 500;
        }
        .prose p:first-of-type::first-letter { 
          font-size: 4rem; 
          font-weight: 700; 
          float: left; 
          line-height: 1; 
          margin: 0.1rem 0.8rem 0 0; 
          background: linear-gradient(135deg, #60a5fa, #a855f7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-family: 'Playfair Display', serif;
        }
        .prose h1, .prose h2, .prose h3 { 
          margin-top: 2.5rem; 
          margin-bottom: 1.2rem; 
          font-weight: 700;
          font-family: 'Playfair Display', serif;
          background: linear-gradient(135deg, #f3f4f6, #d1d5db);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .prose h1 { font-size: 2.2rem; }
        .prose h2 { font-size: 1.8rem; }
        .prose h3 { font-size: 1.5rem; }
        .prose img { 
          margin: 2.5rem auto; 
          border-radius: 1rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .prose blockquote { 
          border-left: 4px solid #3b82f6; 
          padding-left: 1.5rem; 
          margin: 2rem 0; 
          font-style: italic; 
          background: rgba(59, 130, 246, 0.1);
          padding: 1.5rem; 
          border-radius: 0.5rem;
          font-size: 1.1rem;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(59, 130, 246, 0.2);
        }
        .prose ul, .prose ol {
          margin: 1.5rem 0;
          padding-left: 1.5rem;
        }
        .prose li {
          margin: 0.5rem 0;
          line-height: 1.7;
        }
        .prose a {
          color: #60a5fa;
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: all 0.2s ease;
        }
        .prose a:hover {
          border-bottom-color: #60a5fa;
          color: #93c5fd;
        }
        .prose code {
          background: rgba(55, 65, 81, 0.8);
          color: #fbbf24;
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-size: 0.9em;
          border: 1px solid rgba(75, 85, 99, 0.5);
        }
        .prose pre {
          background: rgba(17, 24, 39, 0.8);
          border: 1px solid rgba(75, 85, 99, 0.3);
          border-radius: 0.75rem;
          padding: 1.5rem;
          margin: 2rem 0;
          overflow-x: auto;
        }
        .prose table {
          border-collapse: collapse;
          width: 100%;
          margin: 2rem 0;
          background: rgba(31, 41, 55, 0.5);
          border-radius: 0.5rem;
          overflow: hidden;
          border: 1px solid rgba(75, 85, 99, 0.3);
        }
        .prose th, .prose td {
          border: 1px solid rgba(75, 85, 99, 0.3);
          padding: 0.75rem 1rem;
          text-align: left;
        }
        .prose th {
          background: rgba(55, 65, 81, 0.8);
          font-weight: 600;
          color: #f3f4f6;
        }
      `}</style>
    </div>
  );
};

export default NewsDetail;