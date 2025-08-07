import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, MapPin, ChevronDown, X, Grid3X3, List, Filter } from 'lucide-react';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';

// Update the FilterOptions interface to match backend parameters
export interface FilterOptions {
  searchTerm: string;
  dateRange: 'all' | 'today' | 'week' | 'month' | 'upcoming';
  location: string;
  sortBy: 'date' | 'name' | 'relevance';
  sortOrder: 'asc' | 'desc';
  // For events only
  categoryIds?: string[];
  onlyUpcoming?: boolean;
  // For news only
  authorFullName?: string;
  eventId?: string;
  authorId?: string;
  // For global search
  contentType?: 'all' | 'event' | 'news';
}

// Add this helper function to convert frontend filters to API parameters
export const convertToApiParams = (filters: FilterOptions, contentType: 'event' | 'news' | 'all') => {
  const params: any = {
    searchTerm: filters.searchTerm ? encodeURIComponent(filters.searchTerm) : undefined,
    sortBy: filters.sortBy === 'date' ? (contentType === 'news' ? 'CreatedAt' : 'StartAt') : 
            filters.sortBy === 'name' ? 'Title' : 'Relevance',
    sortDescending: filters.sortOrder === 'desc'
  };

  // Add location if exists
  if (filters.location) {
    params.location = encodeURIComponent(filters.location);
  }

  // Handle date range
  const now = new Date();
  switch (filters.dateRange) {
    case 'today':
      params.startDate = now.toISOString().split('T')[0];
      break;
    case 'week':
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      params.startDate = weekStart.toISOString().split('T')[0];
      break;
    case 'month':
      params.startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      break;
    case 'upcoming':
      if (contentType === 'event') {
        params.onlyUpcoming = true;
      } else {
        params.startDate = now.toISOString().split('T')[0];
      }
      break;
  }

  return params;
};

type ViewMode = 'grid' | 'list';

interface FilterComponentProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  locations?: string[];
  showLocationFilter?: boolean;
  contentType?: 'event' | 'news' | 'all';
  resultsCount?: { events?: number; news?: number; total?: number };
  className?: string;
  showViewToggle?: boolean;
  showContentTypeFilter?: boolean;
}

const FilterComponent: React.FC<FilterComponentProps> = ({
  filters,
  onFilterChange,
  viewMode = 'grid',
  onViewModeChange,
  locations = [],
  showLocationFilter = true,
  contentType = 'event',
  resultsCount,
  className = '',
  showViewToggle = true,
  showContentTypeFilter = false,
}) => {
  const { getThemeClass } = useThemeClasses();

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    onFilterChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFilterChange({
      searchTerm: '',
      dateRange: 'all',
      location: '',
      sortBy: 'date',
      sortOrder: 'desc',
      contentType: showContentTypeFilter ? 'all' : filters.contentType,
    });
  };

  const getResultsText = () => {
    if (contentType === 'all') {
      const total = (resultsCount?.events || 0) + (resultsCount?.news || 0);
      return `${total} kết quả tìm kiếm`;
    } else if (contentType === 'event') {
      return resultsCount?.events ? `${resultsCount.events} sự kiện` : 'Đang tải...';
    } else {
      return resultsCount?.news ? `${resultsCount.news} tin tức` : 'Đang tải...';
    }
  };

  const hasActiveFilters = 
    filters.searchTerm || 
    filters.dateRange !== 'all' || 
    filters.location ||
    filters.sortBy !== 'date' ||
    filters.sortOrder !== 'desc' ||
    (showContentTypeFilter && filters.contentType !== 'all');

  return (
    <div className={cn('w-full', className)}>
      <div className={cn(
        'backdrop-blur-sm border rounded-2xl p-6 mb-8',
        getThemeClass('bg-white/80 border-gray-200/50', 'bg-gray-800/30 border-gray-700/50')
      )}>
        {/* Main Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={
              contentType === 'all' 
                ? 'Tìm kiếm sự kiện và tin tức...' 
                : contentType === 'event' 
                  ? 'Tìm kiếm sự kiện...' 
                  : 'Tìm kiếm tin tức...'
            }
            className={cn(
              'w-full pl-12 pr-4 py-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-offset-2 text-lg',
              getThemeClass(
                'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500',
                'bg-gray-800 border-gray-600 focus:ring-cyan-500 focus:border-cyan-500 text-white'
              )
            )}
            value={filters.searchTerm}
            onChange={(e) => updateFilter('searchTerm', e.target.value)}
          />
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-4">
          {/* Content Type Filter for Global Search */}
          {showContentTypeFilter && (
            <div className="relative">
              <select
                className={cn(
                  'appearance-none pl-3 pr-8 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-offset-2 w-full',
                  getThemeClass(
                    'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500',
                    'bg-gray-800 border-gray-600 focus:ring-cyan-500 focus:border-cyan-500 text-white'
                  )
                )}
                value={filters.contentType || 'all'}
                onChange={(e) => updateFilter('contentType', e.target.value)}
              >
                <option value="all">Tất cả</option>
                <option value="event">Sự kiện</option>
                <option value="news">Tin tức</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          )}

          {/* Date Range Filter */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              className={cn(
                'appearance-none pl-10 pr-8 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-offset-2 w-full',
                getThemeClass(
                  'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500',
                  'bg-gray-800 border-gray-600 focus:ring-cyan-500 focus:border-cyan-500 text-white'
                )
              )}
              value={filters.dateRange}
              onChange={(e) => updateFilter('dateRange', e.target.value as any)}
            >
              <option value="all">Tất cả ngày</option>
              <option value="today">Hôm nay</option>
              <option value="week">Tuần này</option>
              <option value="month">Tháng này</option>
              <option value="upcoming">Sắp diễn ra</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Location Filter */}
          {showLocationFilter && (
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                className={cn(
                  'appearance-none pl-10 pr-8 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-offset-2 w-full',
                  getThemeClass(
                    'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500',
                    'bg-gray-800 border-gray-600 focus:ring-cyan-500 focus:border-cyan-500 text-white'
                  )
                )}
                value={filters.location}
                onChange={(e) => updateFilter('location', e.target.value)}
              >
                <option value="">Tất cả địa điểm</option>
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          )}

          {/* Sort Filter */}
          <div className="relative">
            <select
              className={cn(
                'appearance-none pl-3 pr-8 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-offset-2 w-full',
                getThemeClass(
                  'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500',
                  'bg-gray-800 border-gray-600 focus:ring-cyan-500 focus:border-cyan-500 text-white'
                )
              )}
              value={`${filters.sortBy}_${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('_');
                updateFilter('sortBy', sortBy);
                updateFilter('sortOrder', sortOrder);
              }}
            >
              <option value="date_desc">Mới nhất</option>
              <option value="date_asc">Cũ nhất</option>
              <option value="name_asc">Tên A-Z</option>
              <option value="name_desc">Tên Z-A</option>
              <option value="relevance_desc">Phù hợp nhất</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* View Toggle */}
          {showViewToggle && onViewModeChange && (
            <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <button
                onClick={() => onViewModeChange('grid')}
                className={cn(
                  'p-2 rounded-md transition-colors',
                  viewMode === 'grid' 
                    ? 'bg-white dark:bg-gray-700 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                )}
                aria-label="Grid view"
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={cn(
                  'p-2 rounded-md transition-colors',
                  viewMode === 'list' 
                    ? 'bg-white dark:bg-gray-700 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                )}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Results Summary and Clear Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Results Count */}
          {resultsCount && (
            <div
              className={cn(
                'text-sm',
                getThemeClass('text-gray-600', 'text-gray-300')
              )}
            >
              {getResultsText()}
              {contentType === 'all' && resultsCount.events !== undefined && resultsCount.news !== undefined && (
                <span className="ml-2 text-xs">
                  ({resultsCount.events} sự kiện, {resultsCount.news} tin tức)
                </span>
              )}
            </div>
          )}

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 dark:text-cyan-400 hover:underline flex items-center"
            >
              <X className="h-4 w-4 mr-1" />
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Active Filters Tags */}
        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap gap-2">
            {filters.searchTerm && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                "{filters.searchTerm}"
                <button
                  onClick={() => updateFilter('searchTerm', '')}
                  className="ml-1 hover:text-blue-600 dark:hover:text-blue-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.dateRange !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                {filters.dateRange === 'today' && 'Hôm nay'}
                {filters.dateRange === 'week' && 'Tuần này'}
                {filters.dateRange === 'month' && 'Tháng này'}
                {filters.dateRange === 'upcoming' && 'Sắp diễn ra'}
                <button
                  onClick={() => updateFilter('dateRange', 'all')}
                  className="ml-1 hover:text-green-600 dark:hover:text-green-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.location && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                {filters.location}
                <button
                  onClick={() => updateFilter('location', '')}
                  className="ml-1 hover:text-purple-600 dark:hover:text-purple-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterComponent;
