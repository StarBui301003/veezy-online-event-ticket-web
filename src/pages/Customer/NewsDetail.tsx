import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Loader2,
  Clock,
  ExternalLink,
  MoreVertical,
  Calendar,
  ArrowLeft,
  ChevronRight,
  Flag,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { getNewsDetail, getAllNewsHome } from '@/services/Event Manager/event.service';
import ReportModal from '@/components/Customer/ReportModal';

import { connectNewsHub, onNews, offNews } from '@/services/signalr.service';
import { News } from '@/services/signalr.service';

import { useThemeClasses } from '@/hooks/useThemeClasses';
import { LoginModal } from '@/components/common/LoginModal';
import { RegisterModal } from '@/components/RegisterModal';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const NewsDetail: React.FC = () => {
  const { getThemeClass } = useThemeClasses();
  const { newsId } = useParams<{ newsId: string }>();
  const navigate = useNavigate();
  const [news, setNews] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedNews, setRelatedNews] = useState<News[]>([]);
  const [showCount, setShowCount] = useState(3);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [reportModal, setReportModal] = useState<{ type: 'news' | 'comment'; id: string } | null>(
    null
  );
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const NEWS_HUB_URL = 'https://event.vezzy.site/notificationHub';

  useEffect(() => {
    setLoading(true);
    connectNewsHub(NEWS_HUB_URL);
    const fetchNews = async () => {
      try {
        const res = await getNewsDetail(newsId || '');
        const data = res.data?.data;
        if (data && data.newsId) {
          setNews(data);
          getAllNewsHome(1, 6).then((res) =>
            setRelatedNews(res.data?.data?.items?.filter((n: News) => n.newsId !== newsId) || [])
          );
        } else {
          toast.error('News not found!');
          navigate('/');
        }
      } catch {
        toast.error('Error loading news!');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    if (newsId) fetchNews();

    // Setup realtime listeners for news updates
    const handleUpdated = (data: { newsId?: string; NewsId?: string }) => {
      if (data?.newsId === newsId || data?.NewsId === newsId) {
        fetchNews();
      }
    };
    const handleDeleted = (data: { newsId?: string; NewsId?: string }) => {
      if (data?.newsId === newsId || data?.NewsId === newsId) {
        toast.info('This news has been removed');
        navigate('/news');
      }
    };
    onNews('OnNewsUpdated', handleUpdated);
    onNews('OnNewsDeleted', handleDeleted);
    return () => {
      offNews('OnNewsUpdated', handleUpdated);
      offNews('OnNewsDeleted', handleDeleted);
    };
  }, [newsId, navigate, NEWS_HUB_URL]);

  useEffect(() => {
    return () => setReportModal(null);
  }, [location]);

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    if (news) setReportModal({ type: 'news', id: news.newsId });
  };

  const handleShowRegister = () => {
    setShowLoginModal(false);
    setShowRegisterModal(true);
  };

  const handleRegisterSuccess = (_email: string) => {
    setShowRegisterModal(false);
    if (news) setReportModal({ type: 'news', id: news.newsId });
  };

  const handleReportClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropdownOpen(false);

    const token = localStorage.getItem('access_token');
    if (!token) {
      setShowLoginModal(true);
    } else if (news) {
      setReportModal({ type: 'news', id: news.newsId });
    }
  };

  // Function to properly process HTML content
  const processHtmlContent = (htmlContent: string) => {
    if (!htmlContent) return '';

    // Remove any potential double escaping
    const processedContent = htmlContent
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    return processedContent;
  };

  if (loading) {
    return (
      <div
        className={cn(
          'flex justify-center items-center min-h-screen',
          getThemeClass(
            'bg-gradient-to-br from-blue-50 via-cyan-50 to-emerald-50',
            'bg-gradient-to-br from-gray-900 via-gray-800 to-black'
          )
        )}
      >
        <div className="text-center">
          <div className="relative mb-6">
            <Loader2
              className={cn(
                'w-16 h-16 animate-spin mx-auto',
                getThemeClass('text-blue-600', 'text-blue-400')
              )}
            />
            <div
              className={cn(
                'absolute inset-0 rounded-full animate-pulse',
                getThemeClass('bg-blue-600/20', 'bg-blue-400/20')
              )}
            ></div>
          </div>
          <p className={cn('text-xl font-medium', getThemeClass('text-gray-900', 'text-gray-200'))}>
            Loading news...
          </p>
          <div
            className={cn(
              'mt-2 w-48 h-1 rounded-full mx-auto overflow-hidden',
              getThemeClass('bg-gray-300', 'bg-gray-700')
            )}
          >
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!news) return null;

  return (
    <div
      className={cn(
        'min-h-screen overflow-hidden relative',
        getThemeClass('bg-gradient-to-br from-blue-50 via-cyan-50 to-emerald-50', 'bg-black')
      )}
    >
      {/* Dynamic background with mouse tracking */}
      <div className="absolute inset-0 z-0">
        <div
          className={cn(
            'absolute inset-0',
            getThemeClass(
              'bg-gradient-to-br from-blue-100/60 via-cyan-100/60 to-emerald-100/60',
              'bg-gradient-to-br from-gray-900/40 via-slate-900/40 to-black/60'
            )
          )}
          style={{
            transform: `translate(${mousePosition.x * 0.008}px, ${mousePosition.y * 0.008}px)`,
          }}
        ></div>
        <div
          className={cn(
            'absolute inset-0',
            getThemeClass(
              'bg-[radial-gradient(circle_at_50%_50%,_rgba(59,130,246,0.1)_0%,_transparent_70%)]',
              'bg-[radial-gradient(circle_at_50%_50%,_rgba(6,182,212,0.1)_0%,_transparent_70%)]'
            )
          )}
          style={{
            transform: `translate(${-mousePosition.x * 0.005}px, ${-mousePosition.y * 0.005}px)`,
          }}
        ></div>
      </div>

      {/* Animated floating orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className={cn(
            'absolute w-[500px] h-[500px] rounded-full blur-3xl animate-pulse',
            getThemeClass(
              'bg-gradient-to-r from-blue-200/30 via-cyan-200/30 to-emerald-200/30',
              'bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-blue-500/20'
            )
          )}
          style={{
            top: '15%',
            left: '70%',
            transform: `translate(${mousePosition.x * 0.02}px, ${scrollY * 0.1}px) rotate(${
              scrollY * 0.05
            }deg)`,
          }}
        ></div>
        <div
          className={cn(
            'absolute w-[400px] h-[400px] rounded-full blur-3xl animate-pulse delay-1000',
            getThemeClass(
              'bg-gradient-to-r from-amber-200/25 via-orange-200/25 to-red-200/25',
              'bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-red-500/15'
            )
          )}
          style={{
            top: '70%',
            left: '5%',
            transform: `translate(${-mousePosition.x * 0.015}px, ${-scrollY * 0.08}px) rotate(${
              -scrollY * 0.03
            }deg)`,
          }}
        ></div>
      </div>

      {/* Content area with proper z-index */}
      <div className="relative z-10 pt-16 pb-16">
        <div className="container mx-auto px-6 py-12">
          {/* Enhanced Breadcrumb */}
          <nav className="mb-8 mt-24 opacity-0 animate-fade-in">
            <div
              className={cn(
                'flex items-center text-sm backdrop-blur-sm rounded-lg px-4 py-3 border',
                getThemeClass(
                  'text-gray-600 bg-white/80 border-gray-200/50',
                  'text-gray-400 bg-gray-800/30 border-gray-700/50'
                )
              )}
            >
              <button
                onClick={() => handleNavigate('/')}
                className={cn(
                  'transition-all duration-200 flex items-center gap-2 group',
                  getThemeClass('hover:text-blue-600', 'hover:text-blue-400')
                )}
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">Home</span>
              </button>
              <ChevronRight
                className={cn('w-4 h-4 mx-3', getThemeClass('text-gray-500', 'text-gray-600'))}
              />
              <button
                onClick={() => handleNavigate('/news/all')}
                className={cn(
                  'transition-colors duration-200 font-medium',
                  getThemeClass('hover:text-blue-600', 'hover:text-blue-400')
                )}
              >
                News
              </button>
              <ChevronRight
                className={cn('w-4 h-4 mx-3', getThemeClass('text-gray-500', 'text-gray-600'))}
              />
              <span
                className={cn('font-semibold', getThemeClass('text-blue-600', 'text-blue-400'))}
              >
                News Detail
              </span>
            </div>
          </nav>

          {/* Main Content Container */}
          <div className="max-w-7xl mx-auto">
            <div
              className={cn(
                'backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden relative z-20',
                getThemeClass(
                  'bg-white/80 border border-gray-200/60',
                  'bg-gray-900/40 border border-gray-700/40'
                )
              )}
            >
              <div className="p-8 lg:p-12">
                {/* Main Article */}
                <article className="mb-16 opacity-0 animate-slide-up">
                  {/* Article Header */}
                  <header className="mb-10">
                    <div className="flex items-start justify-between mb-6">
                      <div className="relative">
                        <h1
                          className={cn(
                            'text-4xl md:text-6xl font-bold leading-tight bg-clip-text text-transparent max-w-5xl font-playfair',
                            getThemeClass(
                              'bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600',
                              'bg-gradient-to-r from-white via-cyan-200 to-emerald-200'
                            )
                          )}
                        >
                          {news.newsTitle}
                        </h1>
                        <div
                          className={cn(
                            'absolute -inset-8 blur-3xl animate-pulse',
                            getThemeClass(
                              'bg-gradient-to-r from-blue-400/20 via-cyan-400/20 to-emerald-400/20',
                              'bg-gradient-to-r from-emerald-400/10 via-cyan-400/10 to-blue-500/10'
                            )
                          )}
                        ></div>
                      </div>
                      <div className="flex items-center gap-3 ml-6">
                        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                          <DropdownMenuTrigger asChild>
                            <button
                              className={cn(
                                'p-2 rounded-full transition-colors focus:outline-none',
                                getThemeClass(
                                  'hover:bg-gray-100 text-gray-500 hover:text-gray-900',
                                  'hover:bg-gray-800 text-gray-400 hover:text-white'
                                )
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                              }}
                            >
                              <MoreVertical className="w-5 h-5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className={cn(
                              'min-w-[200px] py-1',
                              getThemeClass(
                                'bg-white border-gray-200',
                                'bg-gray-800 border-gray-700'
                              )
                            )}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                              onClick={handleReportClick}
                              className={cn(
                                'flex items-center gap-2 px-4 py-2 text-sm cursor-pointer focus:bg-transparent',
                                getThemeClass(
                                  'text-red-600 hover:bg-red-50 focus:bg-red-50',
                                  'text-red-400 hover:bg-red-900/30 focus:bg-red-900/30'
                                )
                              )}
                            >
                              <Flag className="w-4 h-4" />
                              <span>Report</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Enhanced Article Meta */}
                    <div
                      className={cn(
                        'flex items-center gap-8 text-sm mb-6 backdrop-blur-sm rounded-xl p-4 border',
                        getThemeClass(
                          'bg-white/90 border-gray-200/60',
                          'bg-gray-800/30 border-gray-700/50'
                        )
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'p-2 rounded-lg',
                            getThemeClass('bg-blue-500/20', 'bg-blue-500/20')
                          )}
                        >
                          <Calendar className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <div
                            className={cn(
                              'text-xs uppercase tracking-wide',
                              getThemeClass('text-gray-500', 'text-gray-400')
                            )}
                          >
                            Published Date
                          </div>
                          <div
                            className={cn(
                              'font-medium',
                              getThemeClass('text-gray-800', 'text-gray-200')
                            )}
                          >
                            {new Date(news.createdAt).toLocaleDateString('en-US')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'p-2 rounded-lg',
                            getThemeClass('bg-green-500/20', 'bg-green-500/20')
                          )}
                        >
                          <Clock className="w-4 h-4 text-green-400" />
                        </div>
                        <div>
                          <div
                            className={cn(
                              'text-xs uppercase tracking-wide',
                              getThemeClass('text-gray-500', 'text-gray-400')
                            )}
                          >
                            Time
                          </div>
                          <div
                            className={cn(
                              'font-medium',
                              getThemeClass('text-gray-800', 'text-gray-200')
                            )}
                          >
                            {new Date(news.createdAt).toLocaleTimeString('en-US')}
                          </div>
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
                          View Related Event
                        </button>
                      </div>
                    )}

                    {/* Article Summary */}
                    <div
                      className={cn(
                        'text-xl leading-relaxed font-medium mb-8 backdrop-blur-sm border-l-4 pl-6 pr-6 py-6 rounded-r-xl border',
                        getThemeClass(
                          'bg-white/90 border-blue-500 border-gray-200/60',
                          'bg-gray-800/30 border-blue-500 border-gray-700/50'
                        )
                      )}
                    >
                      <div
                        className={cn(
                          'text-sm uppercase tracking-wide font-semibold mb-2',
                          getThemeClass('text-blue-600', 'text-blue-400')
                        )}
                      >
                        Summary
                      </div>
                      <p
                        className={cn(
                          'font-inter leading-relaxed',
                          getThemeClass('text-gray-700', 'text-gray-200')
                        )}
                      >
                        {news.newsDescription}
                      </p>
                    </div>
                  </header>

                  {/* Featured Image */}
                  <div className="mb-10 opacity-0 animate-fade-in-delay">
                    <div className="relative group overflow-hidden rounded-2xl">
                      <img
                        src={news.imageUrl}
                        alt={news.newsTitle}
                        className="w-full max-h-[600px] object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  </div>

                  {/* Article Content */}
                  <div
                    className={cn(
                      'border-t pt-10',
                      getThemeClass('border-gray-200/60', 'border-gray-700/50')
                    )}
                  >
                    <div
                      className={cn(
                        'prose prose-lg max-w-none leading-relaxed',
                        getThemeClass(
                          'prose-gray prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900 prose-em:text-gray-600 ',
                          'prose-invert prose-headings:text-white prose-p:text-gray-200 prose-a:text-blue-400 prose-strong:text-white prose-em:text-gray-300 text-white'
                        )
                      )}
                      dangerouslySetInnerHTML={{ __html: processHtmlContent(news.newsContent) }}
                      style={{
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                      }}
                    />
                  </div>
                </article>

                {/* Related News */}
                {relatedNews.length > 0 && (
                  <section
                    className={cn(
                      'border-t pt-12 opacity-0 animate-fade-in-delay-2',
                      getThemeClass('border-gray-200/60', 'border-gray-700/50')
                    )}
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2
                          className={cn(
                            'text-3xl font-bold bg-clip-text text-transparent mb-2 font-playfair',
                            getThemeClass(
                              'bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600',
                              'bg-gradient-to-r from-white via-cyan-200 to-emerald-200'
                            )
                          )}
                        >
                          RELATED NEWS
                        </h2>
                        <p
                          className={cn(
                            'text-gray-400',
                            getThemeClass('text-gray-600', 'text-gray-300')
                          )}
                        >
                          Discover more interesting news
                        </p>
                      </div>
                      <button
                        onClick={() => handleNavigate('/news/all')}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl transition-all duration-200 font-medium shadow-lg shadow-blue-600/25 hover:scale-105 transform"
                      >
                        View All
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {relatedNews.slice(0, showCount).map((item, index) => (
                        <article
                          key={item.newsId}
                          className={cn(
                            'backdrop-blur-sm border rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 cursor-pointer group opacity-0 animate-slide-up-stagger hover:scale-[1.02] transform',
                            getThemeClass(
                              'bg-white/90 border-gray-200/60 hover:bg-white/95',
                              'bg-gray-800/50 border-gray-700/50 hover:bg-gray-800/80'
                            )
                          )}
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
                            <h3
                              className={cn(
                                'font-bold text-xl mb-3 line-clamp-2 group-hover:text-blue-400 transition-colors duration-200 font-playfair leading-tight',
                                getThemeClass('text-gray-900', 'text-white')
                              )}
                            >
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
                                Related Event
                              </button>
                            )}

                            <div
                              className={cn(
                                'text-xs mb-3 flex items-center gap-2 px-3 py-2 rounded-lg',
                                getThemeClass(
                                  'bg-gray-100/50 text-gray-600',
                                  'bg-gray-700/30 text-gray-400'
                                )
                              )}
                            >
                              <Calendar className="w-3 h-3 text-blue-400" />
                              <span className="font-medium">
                                {new Date(item.createdAt).toLocaleDateString('en-US')}
                              </span>
                            </div>

                            <p
                              className={cn(
                                'text-sm line-clamp-3 leading-relaxed font-inter',
                                getThemeClass('text-gray-600', 'text-gray-300')
                              )}
                            >
                              {item.newsDescription}
                            </p>
                          </div>
                        </article>
                      ))}
                    </div>

                    {relatedNews.length > showCount && (
                      <div className="flex justify-center mt-10">
                        <button
                          className={cn(
                            'px-8 py-4 text-white rounded-xl transition-all duration-200 font-medium hover:scale-105 transform shadow-lg border',
                            getThemeClass(
                              'bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 border-gray-600/50',
                              'bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 border-gray-600/50'
                            )
                          )}
                          onClick={() => setShowCount((c) => c + 3)}
                        >
                          View More News
                        </button>
                      </div>
                    )}
                  </section>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {reportModal && (
        <ReportModal
          open={true}
          targetType={reportModal.type}
          targetId={reportModal.id}
          onClose={() => setReportModal(null)}
        />
      )}
      {/* Login Modal */}
      <LoginModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
        onRegisterRedirect={handleShowRegister}
      />
      {/* Register Modal */}
      <RegisterModal
        open={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onRegisterSuccess={(email) => {
          handleRegisterSuccess(email);
        }}
        onLoginRedirect={() => {
          setShowRegisterModal(false);
          setShowLoginModal(true);
        }}
      />
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
        
        /* Force white text in dark theme for all prose content */
        .dark .prose,
        .dark .prose * {
          color: white !important;
        }
        
        /* Ensure all text elements in dark theme are white */
        .dark .prose p,
        .dark .prose div,
        .dark .prose span,
        .dark .prose h1,
        .dark .prose h2,
        .dark .prose h3,
        .dark .prose h4,
        .dark .prose h5,
        .dark .prose h6,
        .dark .prose li,
        .dark .prose ul,
        .dark .prose ol,
        .dark .prose blockquote,
        .dark .prose strong,
        .dark .prose em,
        .dark .prose a {
          color: white !important;
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
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: all 0.2s ease;
        }
        .prose a:hover {
          border-bottom-color: currentColor;
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
        }
        
        /* Additional styles for proper HTML rendering */
        .prose * {
          word-break: break-word;
          overflow-wrap: break-word;
        }
        
        /* Ensure HTML tags are properly rendered */
        .prose p {
          display: block;
          margin-bottom: 1.8rem;
          text-align: justify;
          line-height: 1.8;
          font-size: 1.1rem;
        }
        
        .prose strong {
          font-weight: 700;
          color: inherit;
        }
        
        .prose em {
          font-style: italic;
          color: inherit;
        }
        
        .prose a {
          color: inherit;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        
        .prose a:hover {
          opacity: 0.8;
        }
        
        /* Ensure proper spacing for HTML elements */
        .prose section {
          margin: 2rem 0;
        }
        
        .prose div {
          margin: 1rem 0;
        }
      `}</style>
    </div>
  );
};

export default NewsDetail;
