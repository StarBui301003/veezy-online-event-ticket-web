import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { StageBackground } from '@/components/StageBackground';
import { useTranslation } from 'react-i18next';
import FilterComponent, { FilterOptions } from '@/components/FilterComponent';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';
import { Calendar, Loader2, MapPin, Users, Clock, Star, ChevronRight } from 'lucide-react';
import { NO_IMAGE } from '@/assets/img';
import { searchEventsAPI, Event } from '@/services/search.service';
import { format, isAfter } from 'date-fns';
import { toast } from 'react-toastify';

type ViewMode = 'grid' | 'list';
const PAGE_SIZE = 12;

const AllEventsPage = () => {
  const { t } = useTranslation();
  const { getThemeClass } = useThemeClasses();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const navigate = useNavigate();

  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    dateRange: 'all',
    location: '',
    sortBy: 'date',
    sortOrder: 'desc',
  });

  // Load events when filters or page changes
  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      try {
        console.log('Loading events with filters:', filters, 'page:', currentPage);
        
        // Use the searchEventsAPI with pagination
        const searchResults = await searchEventsAPI({
          ...filters,
          // Add pagination info if needed by modifying the searchEventsAPI
        });

        // For now, simulate pagination on client side
        const startIndex = (currentPage - 1) * PAGE_SIZE;
        const endIndex = startIndex + PAGE_SIZE;
        const paginatedEvents = searchResults.slice(startIndex, endIndex);

        setEvents(paginatedEvents);
        setTotalCount(searchResults.length);
        setTotalPages(Math.ceil(searchResults.length / PAGE_SIZE) || 1);
        
        console.log('Loaded events:', paginatedEvents.length, 'of', searchResults.length);
      } catch (error) {
        console.error('Error loading events:', error);
        setEvents([]);
        setTotalPages(1);
        setTotalCount(0);
        toast.error('Có lỗi xảy ra khi tải sự kiện. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(loadEvents, 300); // Debounce
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

  // Get unique locations from events
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
  const getImageUrl = (imageUrl: string | undefined) => {
    if (!imageUrl) return NO_IMAGE;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${import.meta.env.VITE_API_URL}${imageUrl}`;
  };

  // Format Vietnamese currency
  const formatVNDPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  return (
    <div className="min-h-screen relative">
      <StageBackground />
      <div className="relative z-10">
        {/* Header */}
        <div className="text-center pt-40 pb-10">
          <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.2] py-4 font-sans bg-gradient-to-r from-pink-400 via-cyan-400 to-yellow-200 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(255,255,255,0.5)] mb-4">
            Tất cả sự kiện
          </h1>
          <p className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto mb-8">
            Khám phá các sự kiện hấp dẫn đang chờ đón bạn
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
            contentType="event"
            resultsCount={{ events: totalCount }}
            className="mb-8"
          />

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-white text-lg">Đang tải sự kiện...</p>
              </div>
            </div>
          )}

          {/* No Results */}
          {!loading && events.length === 0 && (
            <div className="text-center py-16">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">
                  Không tìm thấy sự kiện nào
                </h3>
                <p className="text-gray-300 mb-6">
                  {filters.searchTerm || filters.dateRange !== 'all' || filters.location
                    ? 'Không có sự kiện nào phù hợp với bộ lọc hiện tại'
                    : 'Hiện tại chưa có sự kiện nào được công bố'}
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

          {/* Events List */}
          {!loading && events.length > 0 && (
            <>
              {/* Results Summary */}
              <div className="mb-6 text-center">
                <p className="text-gray-300">
                  Hiển thị <span className="font-semibold text-white">{events.length}</span> trong tổng số{' '}
                  <span className="font-semibold text-white">{totalCount}</span> sự kiện
                  {currentPage > 1 && (
                    <span className="ml-2 text-sm">
                      (Trang {currentPage} / {totalPages})
                    </span>
                  )}
                </p>
              </div>

              {/* Grid/List View */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {events.map((event) => (
                    <EventCard key={event.id} event={event} viewMode={viewMode} getImageUrl={getImageUrl} formatVNDPrice={formatVNDPrice} />
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {events.map((event) => (
                    <EventCard key={event.id} event={event} viewMode={viewMode} getImageUrl={getImageUrl} formatVNDPrice={formatVNDPrice} />
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

// Event Card Component
const EventCard = ({ 
  event, 
  viewMode, 
  getImageUrl, 
  formatVNDPrice 
}: { 
  event: Event; 
  viewMode: ViewMode;
  getImageUrl: (url?: string) => string;
  formatVNDPrice: (price: number) => string;
}) => {
  const { getThemeClass } = useThemeClasses();
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch {
      return 'Đang cập nhật';
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'HH:mm');
    } catch {
      return '';
    }
  };

  const isUpcoming = (dateString: string) => {
    try {
      return isAfter(new Date(dateString), new Date());
    } catch {
      return false;
    }
  };

  if (viewMode === 'list') {
    return (
      <div className="backdrop-blur-xl rounded-2xl border border-white/20 hover:border-white/40 overflow-hidden transition-all duration-400 hover:scale-[1.02] hover:shadow-2xl cursor-pointer bg-gradient-to-r from-gray-800/30 to-gray-900/30">
        <Link to={`/events/${event.id}`} className="block">
          <div className="flex flex-col md:flex-row gap-6 p-6">
            {/* Image */}
            <div className="w-full md:w-1/3 h-48 rounded-xl overflow-hidden relative flex-shrink-0">
              <img
                src={getImageUrl(event.imageUrl)}
                alt={event.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = NO_IMAGE;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              {/* Status Badge */}
              <div className="absolute top-3 right-3">
                <span className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium',
                  isUpcoming(event.startTime.toString())
                    ? 'bg-green-500/90 text-white'
                    : 'bg-gray-500/90 text-white'
                )}>
                  {isUpcoming(event.startTime.toString()) ? 'Sắp diễn ra' : 'Đã kết thúc'}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                  {event.name}
                </h3>
                
                <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                  {event.description || 'Không có mô tả'}
                </p>

                {/* Meta Information */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-400">
                    <Calendar className="h-4 w-4 mr-2 text-blue-400" />
                    <span>{formatDate(event.startTime.toString())}</span>
                    {formatTime(event.startTime.toString()) && (
                      <>
                        <Clock className="h-4 w-4 ml-4 mr-1 text-green-400" />
                        <span>{formatTime(event.startTime.toString())}</span>
                      </>
                    )}
                  </div>

                  {event.location && (
                    <div className="flex items-center text-sm text-gray-400">
                      <MapPin className="h-4 w-4 mr-2 text-red-400" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}

                  {event.categoryName && (
                    <div className="flex items-center text-sm text-gray-400">
                      <span className="w-2 h-2 bg-purple-400 rounded-full mr-2" />
                      <span>{event.categoryName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
                <div className="flex items-center gap-4">
                  {event.price !== undefined && (
                    <span className="text-sm font-semibold text-green-400">
                      {event.price === 0 ? 'Miễn phí' : formatVNDPrice(event.price)}
                    </span>
                  )}
                  
                  {event.attendees && (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Users className="h-3 w-3" />
                      <span>{event.attendees.toLocaleString('vi-VN')}</span>
                    </div>
                  )}

                  {event.rating && (
                    <div className="flex items-center gap-1 text-xs text-yellow-400">
                      <Star className="h-3 w-3 fill-current" />
                      <span>{event.rating}</span>
                    </div>
                  )}
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
    <div className="backdrop-blur-xl rounded-2xl border border-white/20 hover:border-white/40 overflow-hidden transition-all duration-400 hover:scale-[1.02] hover:shadow-2xl cursor-pointer bg-gradient-to-br from-gray-800/30 to-gray-900/30 flex flex-col h-full">
      <Link to={`/events/${event.id}`} className="block h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-video w-full">
          <img
            src={getImageUrl(event.imageUrl)}
            alt={event.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = NO_IMAGE;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          
          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <span className={cn(
              'px-3 py-1 rounded-full text-xs font-medium',
              isUpcoming(event.startTime.toString())
                ? 'bg-green-500/90 text-white'
                : 'bg-gray-500/90 text-white'
            )}>
              {isUpcoming(event.startTime.toString()) ? 'Sắp diễn ra' : 'Đã kết thúc'}
            </span>
          </div>

          {/* Date Overlay */}
          <div className="absolute bottom-0 left-0 p-4 w-full">
            <div className="flex items-center text-sm text-white/80 mb-2">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{formatDate(event.startTime.toString())}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 flex flex-col">
          <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
            {event.name}
          </h3>
          
          <p className="text-gray-300 text-sm mb-4 line-clamp-2 flex-1">
            {event.description || 'Không có mô tả'}
          </p>

          {/* Meta Information */}
          <div className="space-y-2 mb-4">
            {formatTime(event.startTime.toString()) && (
              <div className="flex items-center text-sm text-gray-400">
                <Clock className="h-4 w-4 mr-2 text-green-400" />
                <span>{formatTime(event.startTime.toString())}</span>
              </div>
            )}

            {event.location && (
              <div className="flex items-center text-sm text-gray-400">
                <MapPin className="h-4 w-4 mr-2 text-red-400" />
                <span className="truncate">{event.location}</span>
              </div>
            )}

            {event.categoryName && (
              <div className="flex items-center text-sm text-gray-400">
                <span className="w-2 h-2 bg-purple-400 rounded-full mr-2" />
                <span>{event.categoryName}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              {event.price !== undefined && (
                <span className="text-sm font-semibold text-green-400">
                  {event.price === 0 ? 'Miễn phí' : formatVNDPrice(event.price)}
                </span>
              )}
              
              {event.rating && (
                <div className="flex items-center gap-1 text-xs text-yellow-400">
                  <Star className="h-3 w-3 fill-current" />
                  <span>{event.rating}</span>
                </div>
              )}
            </div>

            {event.attendees && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Users className="h-3 w-3" />
                <span>{event.attendees.toLocaleString('vi-VN')}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default AllEventsPage;