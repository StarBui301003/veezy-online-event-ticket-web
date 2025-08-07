import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { searchNews, News } from '@/services/search.service';
import { useNavigate, Link } from 'react-router-dom';
import FilterComponent, { FilterOptions } from '@/components/FilterComponent';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';
import { StageBackground } from '@/components/StageBackground';
import { toast } from 'react-toastify';
import { 
  Calendar, 
  Loader2, 
  MapPin, 
  Users, 
  Clock, 
  User,
  ChevronRight,
  BookOpen,
  Tag 
} from 'lucide-react';
import { format } from 'date-fns';

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

type ViewMode = 'grid' | 'list';

const NewsAll: React.FC = () => {
  const { t } = useTranslation();
  const { getThemeClass } = useThemeClasses();
  const [newsList, setNewsList] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
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
      console.log('Loading news with filters:', filters, 'page:', pageNum);
      
      // Use the searchNews function with pagination
      const searchResults = await searchNews(filters);

      // For now, simulate pagination on client side
      const startIndex = (pageNum - 1) * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE;
      const paginatedNews = searchResults.slice(startIndex, endIndex);

      setNewsList(paginatedNews);
      setTotalCount(searchResults.length);
      setTotalPages(Math.ceil(searchResults.length / PAGE_SIZE) || 1);
      
      console.log('Loaded news:', paginatedNews.length, 'of', searchResults.length);
    } catch (error) {
      console.error('Error loading news:', error);
      setNewsList([]);
      setTotalPages(1);
      setTotalCount(0);
      toast.error('Có lỗi xảy ra khi tải tin tức. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Load news when filters or page changes
  useEffect(() => {
    const timeoutId = setTimeout(() => reloadNews(filters, currentPage), 300); // Debounce
    return () => clearTimeout(timeoutId);
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
  const locations = useMemo(() => {
    // For now, return some common Vietnamese locations
    // In a real app, you'd fetch this from the API
    return [
      'Hà Nội',
      'TP. Hồ Chí Minh',
      'Đà Nẵng',
      'Hải Phòng',
      'Cần Thơ',
      'Nha Trang',
      'Huế',
      'Vũng Tàu',
      'Dalat',
      'Phan Thiết'
    ];
  }, []);

  // Get image URL with fallback
  const getImageUrl = (news: News) => {
    // Return the image URL if it exists, otherwise use a placeholder
    if (news.imageUrl) {
      return news.imageUrl.startsWith('http') 
        ? news.imageUrl 
        : `${import.meta.env.VITE_API_URL}${news.imageUrl}`;
    }
    // Fallback to a placeholder if no image URL is provided
    return 'https://via.placeholder.com/600x400';
  };

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      <StageBackground />
      <div className="relative z-10">
        {/* Header */}
        <div className="text-center pt-40 pb-10 overflow-visible">
          <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.2] py-4 font-sans bg-gradient-to-r from-pink-400 via-cyan-400 to-yellow-200 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(255,255,255,0.5)] mb-4 overflow-visible">
            Tất cả tin tức
          </h1>
          <p className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto mb-8">
            Cập nhật những tin tức mới nhất về các sự kiện
          </p>
          
          {/* Music Visualizer */}
          <div className="flex justify-center gap-1 mb-8 music-visualizer">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="bar rounded bg-gradient-to-t from-pink-400 to-cyan-400"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>

        {/* Container */}
        <div className="container mx-auto px-4 pb-20">
          {/* Filter Component */}
          <FilterComponent
            filters={filters}
            onFilterChange={handleFilterChange}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            locations={locations}
            showLocationFilter={true}
            contentType="news"
            resultsCount={{ news: totalCount }}
            className="mb-8"
          />

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-white text-lg">Đang tải tin tức...</p>
              </div>
            </div>
          )}

          {/* No Results */}
          {!loading && newsList.length === 0 && (
            <div className="text-center py-16">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto">
                <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">
                  Không tìm thấy tin tức nào
                </h3>
                <p className="text-gray-300 mb-6">
                  {filters.searchTerm || filters.dateRange !== 'all' || filters.location
                    ? 'Không có tin tức nào phù hợp với bộ lọc hiện tại'
                    : 'Hiện tại chưa có tin tức nào được công bố'}
                </p>
                <Link
                  to="/"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200 shadow-lg"
                >
                  Về trang chủ
                </Link>
              </div>
            </div>
          )}

          {/* News List */}
          {!loading && newsList.length > 0 && (
            <>
              {/* Results Summary */}
              <div className="mb-6 text-center">
                <p className="text-gray-300">
                  Hiển thị <span className="font-semibold text-white">{newsList.length}</span> trong tổng số{' '}
                  <span className="font-semibold text-white">{totalCount}</span> tin tức
                  {currentPage > 1 && (
                    <span className="ml-2 text-sm">
                      (Trang {currentPage} / {totalPages})
                    </span>
                  )}
                </p>
              </div>

              {/* Grid/List View */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {newsList.map((news, idx) => (
                    <NewsCard key={news.newsId} news={news} viewMode={viewMode} gradient={getGradient(idx)} getImageUrl={getImageUrl} />
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {newsList.map((news, idx) => (
                    <NewsCard key={news.newsId} news={news} viewMode={viewMode} gradient={getGradient(idx)} getImageUrl={getImageUrl} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-12">
                  <div className="flex items-center gap-2">
                    {/* Previous Button */}
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
                    >
                      Trước
                    </button>

                    {/* Page Numbers */}
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
                            onClick={() => handlePageChange(pageNum)}
                            className={cn(
                              'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'bg-white/10 border border-white/20 text-gray-300 hover:bg-white/20 hover:text-white'
                            )}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    {/* Next Button */}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
                    >
                      Tiếp
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
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

// News Card Component
const NewsCard = ({ 
  news, 
  viewMode, 
  gradient, 
  getImageUrl 
}: { 
  news: News; 
  viewMode: ViewMode;
  gradient: string;
  getImageUrl: (news: News) => string;
}) => {
  const { getThemeClass } = useThemeClasses();
  const navigate = useNavigate();

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Đang cập nhật';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch {
      return 'Đang cập nhật';
    }
  };

  const formatTime = (dateString: string | undefined) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'HH:mm');
    } catch {
      return '';
    }
  };

  if (viewMode === 'list') {
    return (
      <div className="backdrop-blur-xl rounded-2xl border border-white/20 hover:border-white/40 overflow-hidden transition-all duration-400 hover:scale-[1.02] hover:shadow-2xl cursor-pointer bg-gradient-to-r from-gray-800/30 to-gray-900/30">
        <Link to={`/news/${news.newsId}`} className="block">
          <div className="flex flex-col md:flex-row gap-6 p-6">
            {/* Image */}
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
              
              {/* Category Badge */}
              <div className="absolute top-3 left-3">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/90 text-white">
                  <Tag className="inline h-3 w-3 mr-1" />
                  Tin tức
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex-1">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2 line-clamp-2 group-hover:text-cyan-300 transition-colors">
                  {news.newsTitle}
                </h3>
                
                <p className="text-gray-200 text-sm mb-4 line-clamp-3">
                  {news.newsDescription || news.newsContent?.substring(0, 200) + '...' || 'Không có mô tả'}
                </p>

                {/* Meta Information */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-400">
                    <Calendar className="h-4 w-4 mr-2 text-blue-400" />
                    <span>{formatDate(news.createdAt)}</span>
                    {formatTime(news.createdAt) && (
                      <>
                        <Clock className="h-4 w-4 ml-4 mr-1 text-green-400" />
                        <span>{formatTime(news.createdAt)}</span>
                      </>
                    )}
                  </div>

                  {news.authorFullName && (
                    <div className="flex items-center text-sm text-gray-400">
                      <User className="h-4 w-4 mr-2 text-purple-400" />
                      <span>{news.authorFullName}</span>
                    </div>
                  )}

                  {news.eventLocation && (
                    <div className="flex items-center text-sm text-gray-400">
                      <MapPin className="h-4 w-4 mr-2 text-red-400" />
                      <span className="truncate">{news.eventLocation}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400">
                    {news.newsContent ? `${news.newsContent.length} ký tự` : 'Đọc thêm'}
                  </span>
                </div>

                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  // Grid View
  return (
    <div className={cn(
      'backdrop-blur-xl rounded-2xl border shadow-xl overflow-hidden relative transition-all duration-400 hover:scale-[1.02] hover:shadow-2xl cursor-pointer',
      'border-white/20 hover:border-white/40 h-full flex flex-col'
    )}
    style={{
      background: `linear-gradient(135deg, ${gradient})`,
    } as React.CSSProperties}>
      <Link to={`/news/${news.newsId}`} className="block h-full w-full flex flex-col">
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
          
          {/* Category Badge */}
          <div className="absolute top-3 left-3">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/90 text-white">
              <Tag className="inline h-3 w-3 mr-1" />
              Tin tức
            </span>
          </div>

          {/* Date Overlay */}
          <div className="absolute bottom-0 left-0 p-4 w-full">
            <div className="flex items-center text-sm text-white/80 mb-2">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{formatDate(news.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2 text-white group-hover:text-cyan-300 transition-colors duration-200">
              {news.newsTitle}
            </h2>
            <p className="text-sm mb-4 line-clamp-2 text-gray-200">
              {news.newsDescription || news.newsContent?.substring(0, 150) + '...' || 'Không có mô tả'}
            </p>
          </div>

          <div className="space-y-2 mt-4 pt-4 border-t border-white/10">
            {/* Author */}
            {news.authorFullName && (
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <User className="h-4 w-4 flex-shrink-0 text-purple-400" />
                <span>{news.authorFullName}</span>
              </div>
            )}

            {/* Location and Read More */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {news.eventLocation && (
                  <>
                    <MapPin className="h-4 w-4 flex-shrink-0 text-red-400" />
                    <span className="text-sm text-gray-300 truncate">
                      {news.eventLocation}
                    </span>
                  </>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate(`/news/${news.newsId}`);
                }}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              >
                Đọc thêm
              </button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default NewsAll;
