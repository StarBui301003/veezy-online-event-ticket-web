import React from 'react';
import { Search, ChevronDown, X, Loader2 } from 'lucide-react';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

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
}

// Add this helper function to convert frontend filters to API parameters
export const convertToApiParams = (filters: FilterOptions, contentType: 'event' | 'news') => {
  const params: any = {
    searchTerm: filters.searchTerm ? encodeURIComponent(filters.searchTerm) : undefined,
    sortBy:
      filters.sortBy === 'date'
        ? contentType === 'news'
          ? 'CreatedAt'
          : 'StartAt'
        : filters.sortBy === 'name'
        ? 'Title'
        : 'Relevance',
    sortDescending: filters.sortOrder === 'desc',
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
    case 'week': {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      params.startDate = weekStart.toISOString().split('T')[0];
      break;
    }
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

interface FilterComponentProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  locations?: string[];
  showLocationFilter?: boolean;
  contentType?: 'event' | 'news';
  resultsCount?: { events?: number; news?: number; total?: number };
  className?: string;
}

const FilterComponent: React.FC<FilterComponentProps> = ({
  filters,
  onFilterChange,
  locations = [],
  showLocationFilter = true,
  contentType = 'event',
  resultsCount,
  className = '',
}) => {
  const { t } = useTranslation();
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
    });
  };

  const getResultsText = () => {
    if (contentType === 'event') {
      return resultsCount?.events !== undefined
        ? t('filter.eventsFound', { count: resultsCount.events })
        : t('filter.loading');
    } else {
      return resultsCount?.news !== undefined
        ? t('filter.newsFound', { count: resultsCount.news })
        : t('filter.loading');
    }
  };

  const hasActiveFilters =
    filters.searchTerm ||
    filters.dateRange !== 'all' ||
    filters.location ||
    filters.sortBy !== 'date' ||
    filters.sortOrder !== 'desc';

  return (
    <div className={cn('w-full', className)}>
      <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={
              contentType === 'event'
                ? t('filter.searchEventPlaceholder')
                : t('filter.searchNewsPlaceholder')
            }
            className={cn(
              'w-full pl-10 pr-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-offset-2',
              getThemeClass(
                'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500',
                'bg-gray-800 border-gray-600 focus:ring-cyan-500 focus:border-cyan-500 text-white'
              )
            )}
            value={filters.searchTerm}
            onChange={(e) => updateFilter('searchTerm', e.target.value)}
          />
        </div>

        {/* Date Range Filter */}
        <div className="relative">
          <select
            className={cn(
              'appearance-none pl-3 pr-8 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-offset-2',
              getThemeClass(
                'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500',
                'bg-gray-800 border-gray-600 focus:ring-cyan-500 focus:border-cyan-500 text-white'
              )
            )}
            value={filters.dateRange}
            onChange={(e) => updateFilter('dateRange', e.target.value as any)}
          >
            <option value="all">{t('filter.allDates')}</option>
            <option value="today">{t('filter.today')}</option>
            <option value="week">{t('filter.thisWeek')}</option>
            <option value="month">{t('filter.thisMonth')}</option>
            <option value="upcoming">{t('filter.upcoming')}</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Location Filter */}
        {showLocationFilter && (
          <div className="relative">
            <select
              className={cn(
                'appearance-none pl-3 pr-8 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-offset-2',
                getThemeClass(
                  'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500',
                  'bg-gray-800 border-gray-600 focus:ring-cyan-500 focus:border-cyan-500 text-white'
                )
              )}
              value={filters.location}
              onChange={(e) => updateFilter('location', e.target.value)}
            >
              <option value="">{t('filter.allLocations')}</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        )}

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center text-sm text-blue-600 dark:text-cyan-400 hover:underline"
          >
            <X className="h-4 w-4 mr-1" />
            {t('filter.clearFilters')}
          </button>
        )}

        {/* Results Count */}
        <div className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
          {getResultsText()}
        </div>

        {/* Loading Indicator */}
        {filters.searchTerm && (
          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            {t('filter.filteringResults')}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterComponent;
