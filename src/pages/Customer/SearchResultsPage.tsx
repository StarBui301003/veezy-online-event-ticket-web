import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchAll, SearchResult } from '@/services/search.service';
import FilterComponent, { FilterOptions } from '@/components/FilterComponent';
import {
  Loader2,
  Calendar,
  MapPin,
  Clock,
  Users,
  Star,
  Search,
  ChevronRight,
  ArrowLeft,
  Filter as FilterIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format, isAfter, startOfDay } from 'date-fns';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';
import { NO_IMAGE } from '@/assets/img';
import { StageBackground } from '@/components/StageBackground';

export const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { t } = useTranslation();
  const { getThemeClass } = useThemeClasses();

  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: query,
    dateRange: 'all',
    location: '',
    sortBy: 'relevance',
    sortOrder: 'desc',
    contentType: 'all',
  });

  // Update filters when query changes
  useEffect(() => {
    setFilters(prev => ({ ...prev, searchTerm: query }));
  }, [query]);

  // Fetch search results
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!filters.searchTerm.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('Searching with filters:', filters);
        const searchResults = await searchAll(filters.searchTerm, filters);
        console.log('Search results:', searchResults);
        setResults(searchResults);
      } catch (err) {
        console.error('Error fetching search results:', err);
        setError('Có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSearchResults, 300); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [filters]);

  // Get unique locations from results
  const locations = useMemo(() => {
    const locationSet = new Set<string>();
    results.forEach((result) => {
      if (result.location) {
        locationSet.add(result.location);
      }
    });
    return Array.from(locationSet).sort();
  }, [results]);

  // Filter results based on current filters
  const filteredResults = useMemo(() => {
    let filtered = [...results];

    // Filter by content type
    if (filters.contentType && filters.contentType !== 'all') {
      filtered = filtered.filter(result => result.type === filters.contentType);
    }

    // Filter by location
    if (filters.location) {
      filtered = filtered.filter(result => 
        result.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Filter by date range
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const today = startOfDay(now);
      
      filtered = filtered.filter(result => {
        const resultDate = new Date(result.date);
        
        switch (filters.dateRange) {
          case 'today':
            return resultDate >= today && resultDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
          case 'week':
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            weekStart.setHours(0, 0, 0, 0);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 7);
            return resultDate >= weekStart && resultDate < weekEnd;
          case 'month':
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            return resultDate >= monthStart && resultDate < monthEnd;
          case 'upcoming':
            return isAfter(resultDate, today);
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [results, filters]);

  // Get results count by type
  const resultsCount = useMemo(() => {
    const events = filteredResults.filter(r => r.type === 'event').length;
    const news = filteredResults.filter(r => r.type === 'news').length;
    return { events, news, total: events + news };
  }, [filteredResults]);

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

  if (loading) {
    return (
      <div className="min-h-screen relative">
        <StageBackground />
        <div className="relative z-10 pt-32 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <Loader2 className="animate-spin h-16 w-16 text-blue-500" />
                <div className="absolute inset-0 rounded-full animate-pulse bg-blue-500/20"></div>
              </div>
              <h2 className="text-2xl font-bold text-white">Đang tìm kiếm...</h2>
              <p className="text-gray-300">Đang tìm kiếm "{query}"</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <StageBackground />
      <div className="relative z-10 pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Link
                to="/"
                className="text-white/70 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <Search className="h-8 w-8 text-blue-400" />
              <h1 className="text-4xl font-bold text-white">
                Kết quả tìm kiếm cho "{query}"
              </h1>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-lg text-gray-300">
                <span className="font-semibold text-white">
                  {resultsCount.total}
                </span>{' '}
                kết quả tìm thấy
                {resultsCount.total > 0 && (
                  <span className="ml-2 text-sm text-blue-400">
                    ({resultsCount.events} sự kiện, {resultsCount.news} tin tức)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Filter Component */}
          <FilterComponent
            filters={filters}
            onFilterChange={setFilters}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            locations={locations}
            contentType="all"
            resultsCount={resultsCount}
            showContentTypeFilter={true}
            className="mb-8"
          />

          {/* Error State */}
          {error ? (
            <div className="text-center py-16">
              <div className="bg-red-500/20 border border-red-500/50 backdrop-blur-sm text-red-200 p-6 rounded-xl shadow-lg max-w-md mx-auto">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <Search className="h-5 w-5" />
                  <span className="font-medium">Lỗi tìm kiếm</span>
                </div>
                <p>{error}</p>
              </div>
            </div>
          ) : filteredResults.length === 0 ? (
            /* Empty State */
            <div className="text-center py-16">
              <div className="mb-6">
                <Search className="h-24 w-24 text-gray-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">
                  Không tìm thấy kết quả
                </h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  Không tìm thấy kết quả nào phù hợp với từ khóa "{query}". Hãy thử với từ khóa khác.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/events"
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200 shadow-lg shadow-blue-600/25"
                >
                  Xem tất cả sự kiện
                </Link>
                <Link
                  to="/news"
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-lg transition-all duration-200 shadow-lg shadow-green-600/25"
                >
                  Xem tất cả tin tức
                </Link>
              </div>
            </div>
          ) : (
            /* Results */
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8'
                  : 'space-y-6'
              }
            >
              {filteredResults.map((result) => (
                <SearchResultCard
                  key={`${result.type}-${result.id}`}
                  result={result}
                  viewMode={viewMode}
                  getImageUrl={getImageUrl}
                  formatVNDPrice={formatVNDPrice}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Search Result Card Component
const SearchResultCard = ({ 
  result, 
  viewMode, 
  getImageUrl, 
  formatVNDPrice 
}: { 
  result: SearchResult; 
  viewMode: 'grid' | 'list';
  getImageUrl: (url?: string) => string;
  formatVNDPrice: (price: number) => string;
}) => {
  const { getThemeClass } = useThemeClasses();
  
  const isEvent = result.type === 'event';
  const linkUrl = isEvent ? `/events/${result.id}` : `/news/${result.id}`;

  if (viewMode === 'list') {
    return (
      <Link
        to={linkUrl}
        className={cn(
          'group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl',
          'backdrop-blur-sm border border-white/20 hover:border-white/40',
          'bg-gradient-to-r from-gray-800/30 to-gray-900/30'
        )}
      >
        <div className="flex flex-col md:flex-row gap-6 p-6">
          {/* Image */}
          <div className="w-full md:w-1/3 h-48 rounded-xl overflow-hidden relative flex-shrink-0">
            <img
              src={getImageUrl(result.imageUrl)}
              alt={result.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = getImageUrl();
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Type Badge */}
            <div className="absolute top-3 left-3">
              <span className={cn(
                'px-3 py-1 rounded-full text-xs font-medium',
                isEvent 
                  ? 'bg-blue-500/90 text-white' 
                  : 'bg-green-500/90 text-white'
              )}>
                {isEvent ? 'Sự kiện' : 'Tin tức'}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col min-w-0">
            <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
              {result.name}
            </h3>
            
            <p className="text-gray-300 text-sm mb-4 line-clamp-3">
              {result.description}
            </p>

            {/* Meta Information */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-400">
                <Calendar className="h-4 w-4 mr-2 text-blue-400" />
                <span>{format(new Date(result.date), 'dd/MM/yyyy • HH:mm')}</span>
              </div>

              {result.location && (
                <div className="flex items-center text-sm text-gray-400">
                  <MapPin className="h-4 w-4 mr-2 text-green-400" />
                  <span className="truncate">{result.location}</span>
                </div>
              )}

              {result.category && (
                <div className="flex items-center text-sm text-gray-400">
                  <span className="w-2 h-2 bg-purple-400 rounded-full mr-2" />
                  <span>{result.category}</span>
                </div>
              )}
            </div>

            {/* Additional Info */}
            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-center gap-4">
                {result.price !== undefined && (
                  <span className="text-sm font-semibold text-green-400">
                    {result.price === 0 ? 'Miễn phí' : formatVNDPrice(result.price)}
                  </span>
                )}
                
                {result.attendees && (
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Users className="h-3 w-3" />
                    <span>{result.attendees.toLocaleString('vi-VN')}</span>
                  </div>
                )}

                {result.rating && (
                  <div className="flex items-center gap-1 text-xs text-yellow-400">
                    <Star className="h-3 w-3 fill-current" />
                    <span>{result.rating}</span>
                  </div>
                )}
              </div>

              <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Grid View
  return (
    <Link
      to={linkUrl}
      className={cn(
        'group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl',
        'backdrop-blur-sm border border-white/20 hover:border-white/40',
        'bg-gradient-to-br from-gray-800/30 to-gray-900/30 flex flex-col h-full'
      )}
    >
      {/* Image */}
      <div className="relative aspect-video w-full">
        <img
          src={getImageUrl(result.imageUrl)}
          alt={result.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = getImageUrl();
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        {/* Type Badge */}
        <div className="absolute top-3 left-3">
          <span className={cn(
            'px-3 py-1 rounded-full text-xs font-medium',
            isEvent 
              ? 'bg-blue-500/90 text-white' 
              : 'bg-green-500/90 text-white'
          )}>
            {isEvent ? 'Sự kiện' : 'Tin tức'}
          </span>
        </div>

        {/* Date overlay */}
        <div className="absolute bottom-0 left-0 p-4 w-full">
          <div className="flex items-center text-sm text-white/80 mb-2">
            <Calendar className="h-4 w-4 mr-1" />
            <span>{format(new Date(result.date), 'dd/MM/yyyy')}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
          {result.name}
        </h3>
        
        <p className="text-gray-300 text-sm mb-4 line-clamp-2">
          {result.description}
        </p>

        {/* Meta Information */}
        <div className="space-y-2 mb-4">
          {result.location && (
            <div className="flex items-center text-sm text-gray-400">
              <MapPin className="h-4 w-4 mr-2 text-green-400" />
              <span className="truncate">{result.location}</span>
            </div>
          )}

          {result.category && (
            <div className="flex items-center text-sm text-gray-400">
              <span className="w-2 h-2 bg-purple-400 rounded-full mr-2" />
              <span>{result.category}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            {result.price !== undefined && (
              <span className="text-sm font-semibold text-green-400">
                {result.price === 0 ? 'Miễn phí' : formatVNDPrice(result.price)}
              </span>
            )}
            
            {result.rating && (
              <div className="flex items-center gap-1 text-xs text-yellow-400">
                <Star className="h-3 w-3 fill-current" />
                <span>{result.rating}</span>
              </div>
            )}
          </div>

          <span className={`text-xs px-2 py-1 rounded-full ${
            isAfter(new Date(result.date), new Date())
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
          }`}>
            {isAfter(new Date(result.date), new Date()) ? 'Sắp diễn ra' : 'Đã kết thúc'}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default SearchResultsPage;
