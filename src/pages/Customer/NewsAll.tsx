import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getAllNewsHome } from '@/services/Event Manager/event.service';
import { connectNewsHub, onNews } from '@/services/signalr.service';
import { News } from '@/types/event';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import FilterComponent, { FilterOptions } from '@/components/FilterComponent';
import { Link } from 'react-router-dom';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';
import { StageBackground } from '@/components/StageBackground';

const PAGE_SIZE = 8;
const BG_GRADIENTS = [
  'from-pink-500/30 to-purple-500/30',
  'from-blue-500/30 to-cyan-500/30',
  'from-yellow-400/30 to-pink-400/30',
  'from-green-400/30 to-blue-400/30',
  'from-purple-500/30 to-indigo-500/30',
];

function getGradient(idx: number) {
  return BG_GRADIENTS[idx % BG_GRADIENTS.length];
}

const NewsAll: React.FC = () => {
  const { t } = useTranslation();
  const { getThemeClass } = useThemeClasses();
  const [newsList, setNewsList] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const navigate = useNavigate();

  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    dateRange: 'all',
    location: '',
    sortBy: 'date',
    sortOrder: 'desc',
  });

  const fetchNews = async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await getAllNewsHome(pageNum, PAGE_SIZE);
      const items = res.data?.data?.items || [];
      setNewsList(items);
      setTotalPages(res.data?.data?.totalPages || 1);
    } catch {
      setNewsList([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // Get unique authors for filter
  // const authors = useMemo(() => {
  //   const authorSet = new Set<string>();
  //   newsList.forEach((news) => {
  //     if (news.authorId) {
  //       authorSet.add(news.authorId);
  //     }
  //   });
  //   return Array.from(authorSet).map((author) => ({
  //     value: author,
  //     label: author,
  //   }));
  // }, [newsList]);

  // Apply filters to news
  const filteredNews = useMemo(() => {
    return newsList
      .filter((news) => {
        // Filter by search term
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase();
          if (
            !news.newsTitle.toLowerCase().includes(searchLower) &&
            !news.newsDescription.toLowerCase().includes(searchLower)
          ) {
            return false;
          }
        }

        // Filter by date range
        const newsDate = new Date(news.createdAt);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch (filters.dateRange) {
          case 'today': {
            return newsDate.toDateString() === today.toDateString();
          }
          case 'week': {
            const lastWeek = new Date(today);
            lastWeek.setDate(lastWeek.getDate() - 7);
            return newsDate >= lastWeek;
          }
          case 'month': {
            const lastMonth = new Date(today);
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            return newsDate >= lastMonth;
          }
          case 'upcoming': {
            return newsDate > today;
          }
          default: {
            return true;
          }
        }
      })
      .sort((a, b) => {
        const aDate = new Date(a.createdAt);
        const bDate = new Date(b.createdAt);
        return filters.sortOrder === 'asc'
          ? aDate.getTime() - bDate.getTime()
          : bDate.getTime() - aDate.getTime();
      });
  }, [newsList, filters]);

  // Connect to NewsHub for real-time updates
  useEffect(() => {
    connectNewsHub('http://localhost:5004/newsHub');

    // Listen for real-time news updates
    onNews('OnNewsCreated', () => {
      fetchNews(page);
    });

    onNews('OnNewsUpdated', () => {
      fetchNews(page);
    });

    onNews('OnNewsDeleted', () => {
      fetchNews(page);
    });

    // Initial data load
    fetchNews(page);
  }, [page]);

  const getImageUrl = (news: News) => {
    // Return the image URL if it exists, otherwise use a placeholder
    if (news.imageUrl) {
      return news.imageUrl;
    }
    // Fallback to a placeholder if no image URL is provided
    return 'https://via.placeholder.com/600x400';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={cn(
        'relative min-h-screen w-full',
        getThemeClass(
          'bg-gradient-to-r from-blue-500 to-cyan-400',
          'bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900'
        )
      )}
    >
      <StageBackground />
      <div className="relative z-10">
        {/* Header */}
        <div className="text-center pt-40 pb-10 overflow-visible">
          <h1
            className={cn(
              'text-5xl md:text-6xl font-extrabold leading-[1.2] py-4 font-sans bg-gradient-to-r from-pink-400 via-cyan-400 to-yellow-200 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(255,255,255,0.5)] animate-titleGlow mb-4 overflow-visible',
              getThemeClass(
                'bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600',
                'bg-gradient-to-r from-pink-400 via-cyan-400 to-yellow-200'
              )
            )}
          >
            All News
          </h1>
          {/* Music Visualizer */}
          <div className="flex justify-center gap-1 mb-8 music-visualizer">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  'bar rounded animate-musicBar',
                  getThemeClass(
                    'bg-gradient-to-t from-blue-400 to-cyan-400',
                    'bg-gradient-to-t from-pink-400 to-cyan-400'
                  )
                )}
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>

        {/* Filter Component */}
        <FilterComponent
          filters={filters}
          onFilterChange={(newFilters) => setFilters(newFilters as FilterOptions)}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          locations={Array.from(
            new Set(newsList.filter((n) => n.eventLocation).map((n) => n.eventLocation as string))
          )}
          showLocationFilter={true}
          contentType="tin tức"
          resultsCount={{ total: filteredNews.length }}
        />

        {/* News Grid/List */}
        <div
          className={`px-4 pb-20 max-w-7xl mx-auto ${
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-6'
          }`}
        >
          {loading ? (
            <div
              className={cn(
                'col-span-full text-center text-2xl py-20 animate-pulse',
                getThemeClass('text-blue-600', 'text-pink-400')
              )}
            >
              {t('loadingNews')}
            </div>
          ) : filteredNews.length === 0 ? (
            <div
              className={cn(
                'col-span-full text-center text-lg py-20',
                getThemeClass('text-gray-600', 'text-gray-400')
              )}
            >
              {filters.searchTerm || filters.dateRange !== 'all' || filters.location
                ? 'Không tìm thấy tin tức phù hợp với bộ lọc'
                : t('news.noNewsFound')}
            </div>
          ) : (
            filteredNews.map((news, idx) => (
              <motion.div
                key={news.newsId}
                className={cn(
                  'backdrop-blur-xl rounded-2xl border shadow-xl overflow-hidden relative transition-all duration-400 hover:scale-[1.02] hover:shadow-2xl cursor-pointer',
                  getThemeClass(
                    'bg-white/95 border-gray-200 hover:border-gray-300',
                    'border-white/20 hover:border-white/40'
                  ),
                  viewMode === 'grid' ? 'h-full flex flex-col' : 'grid grid-cols-3 gap-6 p-6'
                )}
                style={
                  viewMode === 'grid'
                    ? ({
                        background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                        '--tw-gradient-from': `var(--tw-gradient-to, rgba(236, 72, 153, 0.1))`,
                        '--tw-gradient-to': `var(--tw-gradient-to, rgba(168, 85, 247, 0.1))`,
                        ...(viewMode === 'grid' && {
                          '--tw-gradient-to': `var(--tw-gradient-to, ${
                            getGradient(idx).split(' ')[1]
                          })`,
                        }),
                      } as React.CSSProperties)
                    : {}
                }
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
                whileHover={{
                  boxShadow: getThemeClass(
                    '0 8px 32px 0 rgba(0,0,0,0.1)',
                    '0 8px 32px 0 rgba(0,0,0,0.18)'
                  ),
                }}
              >
                <Link to={`/news/${news.newsId}`} className="block h-full w-full">
                  {viewMode === 'grid' ? (
                    <>
                      {/* Image */}
                      <div className="relative w-full h-60">
                        <img
                          src={getImageUrl(news)}
                          alt={news.newsTitle}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = 'https://via.placeholder.com/600x400';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      </div>

                      {/* Content */}
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex-1">
                          <h2
                            className={cn(
                              'text-2xl font-bold mb-2 group-hover:transition-colors duration-200',
                              getThemeClass(
                                'text-gray-900 group-hover:text-blue-700',
                                'text-white group-hover:text-cyan-300'
                              )
                            )}
                          >
                            {news.newsTitle}
                          </h2>
                          <p
                            className={cn(
                              'text-sm mb-4 line-clamp-2',
                              getThemeClass('text-gray-700', 'text-gray-200')
                            )}
                          >
                            {news.newsDescription || news.newsContent?.substring(0, 150) + '...'}
                          </p>
                        </div>

                        <div
                          className={cn(
                            'space-y-2 mt-4 pt-4 border-t',
                            getThemeClass('border-gray-200', 'border-white/10')
                          )}
                        >
                          <div
                            className={cn(
                              'flex items-center gap-2 text-sm',
                              getThemeClass('text-gray-600', 'text-gray-300')
                            )}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className={cn(
                                'h-4 w-4 flex-shrink-0',
                                getThemeClass('text-blue-600', 'text-cyan-400')
                              )}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span>
                              {news.createdAt
                                ? new Date(news.createdAt).toLocaleDateString('vi-VN')
                                : ''}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className={cn(
                                  'h-4 w-4 flex-shrink-0',
                                  getThemeClass('text-blue-600', 'text-cyan-400')
                                )}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              <span
                                className={cn(
                                  'text-sm',
                                  getThemeClass('text-gray-600', 'text-gray-300')
                                )}
                              >
                                {news.eventLocation || t('tba')}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigate(`/news/${news.newsId}`);
                              }}
                              className={cn(
                                'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                                getThemeClass(
                                  'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white',
                                  'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                                )
                              )}
                            >
                              {t('readMore')}
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Image for list view */}
                      <div className="col-span-1 w-full h-48 rounded-xl overflow-hidden relative">
                        <img
                          src={getImageUrl(news)}
                          alt={news.newsTitle}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = 'https://via.placeholder.com/600x400';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      </div>

                      {/* Content for list view */}
                      <div className="col-span-2 flex-1 min-w-0">
                        <h2
                          className={cn(
                            'text-xl font-bold mb-2 group-hover:transition-colors duration-200 line-clamp-1',
                            getThemeClass(
                              'text-gray-900 group-hover:text-blue-700',
                              'text-white group-hover:text-cyan-300'
                            )
                          )}
                        >
                          {news.newsTitle}
                        </h2>
                        <p
                          className={cn(
                            'text-sm mb-3 line-clamp-2',
                            getThemeClass('text-gray-700', 'text-gray-200')
                          )}
                        >
                          {news.newsDescription || news.newsContent?.substring(0, 150) + '...'}
                        </p>

                        {/* Additional metadata for list view */}
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center gap-4 text-xs">
                            <div
                              className={cn(
                                'flex items-center gap-1',
                                getThemeClass('text-gray-500', 'text-gray-400')
                              )}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3 w-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span>
                                {news.createdAt
                                  ? new Date(news.createdAt).toLocaleDateString('vi-VN')
                                  : ''}
                              </span>
                            </div>
                            {news.eventLocation && (
                              <div
                                className={cn(
                                  'flex items-center gap-1',
                                  getThemeClass('text-gray-500', 'text-gray-400')
                                )}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-3 w-3"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                </svg>
                                <span className="truncate">{news.eventLocation}</span>
                              </div>
                            )}
                            {news.authorId && (
                              <div
                                className={cn(
                                  'flex items-center gap-1',
                                  getThemeClass('text-gray-500', 'text-gray-400')
                                )}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-3 w-3"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                  />
                                </svg>
                                <span className="truncate">{news.authorId}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div
                              className={cn(
                                'flex items-center gap-2 text-sm',
                                getThemeClass('text-gray-600', 'text-gray-300')
                              )}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className={cn(
                                  'h-4 w-4 flex-shrink-0',
                                  getThemeClass('text-blue-600', 'text-cyan-400')
                                )}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span>
                                {news.createdAt
                                  ? new Date(news.createdAt).toLocaleDateString('vi-VN')
                                  : ''}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className={cn(
                                  'h-4 w-4 flex-shrink-0',
                                  getThemeClass('text-blue-600', 'text-cyan-400')
                                )}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              <span
                                className={cn(
                                  'text-sm',
                                  getThemeClass('text-gray-600', 'text-gray-300')
                                )}
                              >
                                {news.eventLocation || t('tba')}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              navigate(`/news/${news.newsId}`);
                            }}
                            className={cn(
                              'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                              getThemeClass(
                                'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white',
                                'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                              )
                            )}
                          >
                            {t('readMore')}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </Link>
              </motion.div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-12">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className={cn(
                  'px-4 py-2 rounded-lg border text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
                  getThemeClass(
                    'bg-white border-gray-300 text-gray-900 hover:bg-gray-100',
                    'bg-gray-800 border-gray-700 hover:bg-gray-700'
                  )
                )}
              >
                Trước
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
                        page === pageNum
                          ? getThemeClass('bg-blue-600 text-white', 'bg-cyan-500 text-white')
                          : getThemeClass(
                              'bg-white text-gray-900 hover:bg-gray-100',
                              'bg-gray-800 text-gray-300 hover:bg-gray-700'
                            )
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={cn(
                  'px-4 py-2 rounded-lg border text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
                  getThemeClass(
                    'bg-white border-gray-300 text-gray-900 hover:bg-gray-100',
                    'bg-gray-800 border-gray-700 hover:bg-gray-700'
                  )
                )}
              >
                Tiếp
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Custom CSS for animation */}
      <style>{`
        @keyframes titleGlow {
          0% { filter: drop-shadow(0 0 10px rgba(255,107,107,0.7)); }
          50% { filter: drop-shadow(0 0 20px rgba(78,205,196,0.7)); }
          100% { filter: drop-shadow(0 0 15px rgba(69,183,209,0.7)); }
        }
        .animate-titleGlow { animation: titleGlow 4s ease-in-out infinite alternate; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px);}
          to { opacity: 1; transform: translateY(0);}
        }
        .animate-fadeInUp { animation: fadeInUp 1s ease-out 0.5s both;}
        @keyframes musicBar {
          0% { height: 10px; opacity: 0.6;}
          100% { height: 60px; opacity: 1;}
        }
        .music-visualizer .bar { width: 4px; border-radius: 2px; animation: musicBar 1s ease-in-out infinite alternate;}
        @keyframes cardFloat {
          0%,100% { transform: translateY(0px);}
          50% { transform: translateY(-15px);}
        }
        .animate-cardFloat { animation: cardFloat 8s ease-in-out infinite;}
        .event-card:hover .play-overlay { opacity: 1;}
        .play-icon { width: 0; height: 0; border-left: 15px solid white; border-top: 10px solid transparent; border-bottom: 10px solid transparent; margin-left: 3px;}
      `}</style>
    </motion.div>
  );
};

export default NewsAll;
