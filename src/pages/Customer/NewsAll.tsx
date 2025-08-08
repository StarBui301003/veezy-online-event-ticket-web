import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getAllNewsHome } from '@/services/Event Manager/event.service';
import { searchNews, News } from '@/services/search.service';
import { connectNewsHub, onNews } from '@/services/signalr.service';
import { useNavigate } from 'react-router-dom';
import FilterComponent, { convertToApiParams, FilterOptions } from '@/components/FilterComponent';
import { Link } from 'react-router-dom';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';
import { StageBackground } from '@/components/StageBackground';
import { toast } from 'react-toastify';
import instance from '@/services/axios.customize';

const PAGE_SIZE = 12;
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    dateRange: 'all',
    location: '',
    sortBy: 'date',
    sortOrder: 'desc',
  });

  // Function to reload news with filters
  const reloadNews = async (filters: FilterOptions, pageNum: number) => {
    setLoading(true);
    try {
      // Convert frontend filters to API parameters
      const apiParams = convertToApiParams(filters, 'news');
      
      // Add pagination
      const params = {
        ...apiParams,
        page: pageNum,
        pageSize: PAGE_SIZE,
      };

      console.log('Fetching news with params:', params);
      const response = await instance.get('/api/News/all-Home', { params });
      
      // Handle response format
      let items: News[] = [];
      let totalItems = 0;
      
      if (response.data?.data?.items) {
        // Paginated response format
        items = response.data.data.items;
        totalItems = response.data.data.totalCount || items.length;
      } else if (Array.isArray(response.data)) {
        // Non-paginated response
        items = response.data;
        totalItems = items.length;
      } else if (response.data?.items) {
        // Alternative paginated format
        items = response.data.items;
        totalItems = response.data.totalCount || items.length;
      }

      // Filter by status (handle different status formats)
      const visibleNews = items.filter((item) => {
        const status = item.status;
        if (status === undefined || status === null) return true;
        
        // Handle different status formats
        if (typeof status === 'boolean') return status === true;
        if (typeof status === 'number') return status === 1;
        if (typeof status === 'string') {
          const strStatus = String(status).trim().toLowerCase();
          return strStatus === 'true' || strStatus === '1';
        }
        return false;
      });

      console.log('Filtered news:', visibleNews);
      setNewsList(visibleNews);
      setTotalPages(Math.ceil(totalItems / PAGE_SIZE) || 1);
    } catch (error) {
      console.error('Error loading news:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        filters,
        pageNum,
      });
      setNewsList([]);
      setTotalPages(1);
      toast.error('Có lỗi xảy ra khi tải tin tức. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Load news when filters or page changes
  useEffect(() => {
    reloadNews(filters, currentPage);
  }, [filters, currentPage]);

  // Handle filter changes
  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Get unique locations from news
  const locations = React.useMemo(() => {
    const locationSet = new Set<string>();
    newsList.forEach((news) => {
      if (news.eventLocation) {
        locationSet.add(news.eventLocation);
      }
    });
    return Array.from(locationSet).sort();
  }, [newsList]);

  // Get image URL with fallback
  const getImageUrl = (news: News) => {
    // Return the image URL if it exists, otherwise use a placeholder
    if (news.imageUrl) {
      return news.imageUrl;
    }
    // Fallback to a placeholder if no image URL is provided
    return 'https://via.placeholder.com/600x400';
  };

  return (
    <div
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
              'text-5xl md:text-6xl font-extrabold leading-[1.2] py-4 font-sans bg-gradient-to-r from-pink-400 via-cyan-400 to-yellow-200 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(255,255,255,0.5)] mb-4 overflow-visible',
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
                  'bar rounded',
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
          onFilterChange={handleFilterChange}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          locations={locations}
          showLocationFilter={true}
          contentType="news"
          resultsCount={{ total: newsList.length }}
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
                'col-span-full text-center text-2xl py-20',
                getThemeClass('text-blue-600', 'text-pink-400')
              )}
            >
              {t('loadingNews')}
            </div>
          ) : newsList.length === 0 ? (
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
            newsList.map((news, idx) => (
              <div
                key={news.newsId}
                className={cn(
                  'backdrop-blur-xl rounded-2xl border shadow-xl overflow-hidden relative transition-all duration-400 hover:scale-[1.02] hover:shadow-2xl cursor-pointer',
                  getThemeClass(
                    'bg-white/95 border-gray-200 hover:border-gray-300',
                    'border-white/20 hover:border-white/40'
                  ),
                  viewMode === 'grid' ? 'h-full flex flex-col' : 'flex flex-col md:flex-row gap-6 w-full'
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
                    <div className="flex flex-col md:flex-row gap-6 w-full">
                      {/* Image for list view */}
                      <div className="w-full md:w-1/3 lg:w-1/4 h-48 rounded-xl overflow-hidden relative flex-shrink-0">
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
                      <div className="flex-1 flex flex-col">
                        <div className="flex-1">
                          <h2
                            className={cn(
                              'text-xl md:text-2xl font-bold mb-2 group-hover:transition-colors duration-200',
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
                              'text-sm mb-4 line-clamp-3',
                              getThemeClass('text-gray-700', 'text-gray-200')
                            )}
                          >
                            {news.newsDescription || news.newsContent?.substring(0, 200) + '...'}
                          </p>
                        </div>

                        <div className={cn('space-y-2 mt-4 pt-4 border-t',
                          getThemeClass('border-gray-200', 'border-white/10')
                        )}>
                          <div className="flex flex-wrap items-center gap-4 text-sm">
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
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span className={getThemeClass('text-gray-600', 'text-gray-300')}>
                                {news.createdAt
                                  ? new Date(news.createdAt).toLocaleDateString('vi-VN')
                                  : ''}
                              </span>
                            </div>
                            
                            {news.eventLocation && (
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
                                <span className={getThemeClass('text-gray-600', 'text-gray-300')}>
                                  {news.eventLocation}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex justify-end mt-4">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigate(`/news/${news.newsId}`);
                              }}
                              className={cn(
                                'px-4 py-2 rounded-full text-sm font-medium transition-colors',
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
                    </div>
                  )}
                </Link>
              </div>
            ))
          )}
        </div>

        {/* Pagination - Chỉ hiển thị khi không có filter và có nhiều trang */}
        {totalPages > 1 && !filters.searchTerm && filters.dateRange === 'all' && !filters.location && (
          <div className="flex justify-center mt-12">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
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
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
                        currentPage === pageNum
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
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
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
        .music-visualizer .bar {
          width: 4px;
          height: 20px;
          animation: bounce 1.5s infinite ease-in-out;
        }
        .music-visualizer .bar:nth-child(2) { animation-delay: 0.1s; }
        .music-visualizer .bar:nth-child(3) { animation-delay: 0.2s; }
        .music-visualizer .bar:nth-child(4) { animation-delay: 0.3s; }
        .music-visualizer .bar:nth-child(5) { animation-delay: 0.4s; }
        .music-visualizer .bar:nth-child(6) { animation-delay: 0.5s; }
        .music-visualizer .bar:nth-child(7) { animation-delay: 0.6s; }
        .music-visualizer .bar:nth-child(8) { animation-delay: 0.7s; }
        .music-visualizer .bar:nth-child(9) { animation-delay: 0.8s; }
        .music-visualizer .bar:nth-child(10) { animation-delay: 0.9s; }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: scaleY(1);
          }
          40% {
            transform: scaleY(1.5);
          }
          60% {
            transform: scaleY(1.2);
          }
        }
      `}</style>
    </div>
  );
};

export default NewsAll;