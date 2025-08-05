import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, MapPin, ChevronDown, X, Grid3X3, List } from 'lucide-react';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';

export interface FilterOptions {
  searchTerm: string;
  dateRange: 'all' | 'today' | 'week' | 'month' | 'upcoming';
  location: string;
  sortBy: 'date' | 'name' | 'relevance';
  sortOrder: 'asc' | 'desc';
}

type ViewMode = 'grid' | 'list';

interface FilterComponentProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  locations?: string[];
  showLocationFilter?: boolean;
  contentType?: string;
  resultsCount?: { events?: number; news?: number; total?: number };
  className?: string;
}

const FilterComponent: React.FC<FilterComponentProps> = ({
  filters,
  onFilterChange,
  viewMode = 'grid',
  onViewModeChange,
  locations = [],
  showLocationFilter = true,
  contentType = 'nội dung',
  resultsCount,
  className = '',
}) => {
  const { getThemeClass } = useThemeClasses();

  const updateFilter = (
    key: keyof FilterOptions,
    value:
      | string
      | 'all'
      | 'today'
      | 'week'
      | 'month'
      | 'upcoming'
      | 'date'
      | 'name'
      | 'relevance'
      | 'asc'
      | 'desc'
  ) => {
    onFilterChange({ ...filters, [key]: value });
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

  const hasActiveFilters = filters.searchTerm || filters.dateRange !== 'all' || filters.location;

  const getResultsText = () => {
    if (!resultsCount) return '';

    if (resultsCount.events !== undefined && resultsCount.news !== undefined) {
      return `Tìm thấy: ${resultsCount.events} sự kiện, ${resultsCount.news} tin tức`;
    }

    if (resultsCount.total !== undefined) {
      return `Tìm thấy: ${resultsCount.total} ${contentType}`;
    }

    return '';
  };

  const selectStyle = cn(
    'border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-48 appearance-none',
    getThemeClass(
      'bg-white border-gray-300 text-gray-900',
      'bg-gray-800 border-gray-700 text-white'
    )
  );

  const optionStyle = getThemeClass('bg-white text-gray-900', 'bg-gray-800 text-white');

  return (
    <div className={`filter-container w-full max-w-7xl mx-auto px-4 mb-8 ${className}`}>
      <motion.div
        className={cn(
          'backdrop-blur-lg rounded-xl p-4 shadow-lg border',
          getThemeClass('bg-white/95 border-gray-200', 'bg-gray-900/80 border-gray-800')
        )}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Main Filter Bar */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Clear Filters Button - Only show when filters are active */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors',
                getThemeClass(
                  'border-gray-300 text-gray-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700',
                  'border-white/20 text-cyan-300 hover:border-cyan-400/50 hover:bg-cyan-900/20 hover:text-white'
                )
              )}
            >
              <X className="w-4 h-4" />
              Xóa bộ lọc
            </button>
          )}

          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search
                className={cn(
                  'absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4',
                  getThemeClass('text-gray-400', 'text-gray-400')
                )}
              />
              <input
                type="text"
                placeholder={`Tìm kiếm ${contentType}...`}
                value={filters.searchTerm}
                onChange={(e) => updateFilter('searchTerm', e.target.value)}
                className={cn(
                  'w-full pl-10 pr-4 py-2 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                  getThemeClass(
                    'bg-white border-gray-300 text-gray-900 placeholder-gray-500',
                    'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                  )
                )}
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <div className="relative">
                <select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-');
                    updateFilter('sortBy', sortBy as 'date' | 'name' | 'relevance');
                    updateFilter('sortOrder', sortOrder as 'asc' | 'desc');
                  }}
                  className={selectStyle}
                >
                  <option value="date-desc" className={optionStyle}>
                    Mới nhất
                  </option>
                  <option value="date-asc" className={optionStyle}>
                    Cũ nhất
                  </option>
                  <option value="name-asc" className={optionStyle}>
                    Tên A-Z
                  </option>
                  <option value="name-desc" className={optionStyle}>
                    Tên Z-A
                  </option>
                </select>
                <ChevronDown
                  className={cn(
                    'absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none',
                    getThemeClass('text-gray-400', 'text-gray-400')
                  )}
                />
              </div>
            </div>

            {/* Date Range Dropdown */}
            <div className="relative">
              <div className="relative">
                <select
                  value={filters.dateRange}
                  onChange={(e) =>
                    updateFilter(
                      'dateRange',
                      e.target.value as 'all' | 'today' | 'week' | 'month' | 'upcoming'
                    )
                  }
                  className={selectStyle}
                >
                  <option value="all" className={optionStyle}>
                    Tất cả ngày
                  </option>
                  <option value="today" className={optionStyle}>
                    Hôm nay
                  </option>
                  <option value="week" className={optionStyle}>
                    Tuần này
                  </option>
                  <option value="month" className={optionStyle}>
                    Tháng này
                  </option>
                  <option value="upcoming" className={optionStyle}>
                    Sắp tới
                  </option>
                </select>
                <Calendar
                  className={cn(
                    'absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none',
                    getThemeClass('text-gray-400', 'text-gray-400')
                  )}
                />
              </div>
            </div>

            {/* Location Dropdown - Only show if locations are provided */}
            {showLocationFilter && locations && locations.length > 0 && (
              <div className="relative">
                <div className="relative">
                  <select
                    value={filters.location || ''}
                    onChange={(e) => updateFilter('location', e.target.value)}
                    className={selectStyle}
                  >
                    <option value="" className={optionStyle}>
                      Tất cả địa điểm
                    </option>
                    {locations.map((location) => (
                      <option key={location} value={location} className={optionStyle}>
                        {location}
                      </option>
                    ))}
                  </select>
                  <MapPin
                    className={cn(
                      'absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none',
                      getThemeClass('text-gray-400', 'text-gray-400')
                    )}
                  />
                </div>
              </div>
            )}

            {/* View Mode Toggle */}
            <div
              className={cn(
                'flex items-center rounded-full p-1',
                getThemeClass(
                  'bg-gray-100 border border-gray-200',
                  'bg-white/10 border border-white/20'
                )
              )}
            >
              <button
                onClick={() => onViewModeChange('grid')}
                className={cn(
                  'p-2 rounded-full transition-colors',
                  viewMode === 'grid'
                    ? getThemeClass('bg-blue-500 text-white', 'bg-cyan-500/20 text-cyan-400')
                    : getThemeClass(
                        'text-gray-600 hover:text-gray-900',
                        'text-gray-400 hover:text-white'
                      )
                )}
                title="Chế độ lưới"
              >
                <Grid3X3 className="h-5 w-5" />
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={cn(
                  'p-2 rounded-full transition-colors',
                  viewMode === 'list'
                    ? getThemeClass('bg-blue-500 text-white', 'bg-cyan-500/20 text-cyan-400')
                    : getThemeClass(
                        'text-gray-600 hover:text-gray-900',
                        'text-gray-400 hover:text-white'
                      )
                )}
                title="Chế độ danh sách"
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {/* isExpanded state was removed, so this block is now always rendered */}
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              'mt-4 pt-4 border-t',
              getThemeClass('border-gray-200', 'border-gray-800')
            )}
          >
            <div
              className={`grid grid-cols-1 ${
                showLocationFilter ? 'md:grid-cols-2' : 'md:grid-cols-1'
              } gap-4`}
            >
              {/* Date Range */}
              <div>
                <label
                  className={cn(
                    'block text-sm font-medium mb-2',
                    getThemeClass('text-gray-700', 'text-gray-300')
                  )}
                >
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Thời gian
                </label>
                <select
                  value={filters.dateRange}
                  onChange={(e) =>
                    updateFilter(
                      'dateRange',
                      e.target.value as 'all' | 'today' | 'week' | 'month' | 'upcoming'
                    )
                  }
                  className={selectStyle}
                >
                  <option value="all" className={optionStyle}>
                    Tất cả
                  </option>
                  <option value="today" className={optionStyle}>
                    Hôm nay
                  </option>
                  <option value="week" className={optionStyle}>
                    Tuần này
                  </option>
                  <option value="month" className={optionStyle}>
                    Tháng này
                  </option>
                  <option value="upcoming" className={optionStyle}>
                    Sắp tới
                  </option>
                </select>
              </div>

              {/* Location Filter - Only show for events */}
              {showLocationFilter && (
                <div>
                  <label
                    className={cn(
                      'block text-sm font-medium mb-2',
                      getThemeClass('text-gray-700', 'text-gray-300')
                    )}
                  >
                    <MapPin className="inline w-4 h-4 mr-1" />
                    Địa điểm
                  </label>
                  <select
                    value={filters.location}
                    onChange={(e) => updateFilter('location', e.target.value)}
                    className={selectStyle}
                  >
                    <option value="" className={optionStyle}>
                      Tất cả địa điểm
                    </option>
                    {locations.map((location) => (
                      <option key={location} value={location} className={optionStyle}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Results Summary */}
        {resultsCount && (
          <div
            className={cn(
              'mt-4 flex justify-between items-center text-sm',
              getThemeClass('text-gray-600', 'text-gray-300')
            )}
          >
            <span>{getResultsText()}</span>
            {hasActiveFilters && (
              <span className={getThemeClass('text-blue-600', 'text-cyan-400')}>
                Đang lọc kết quả
              </span>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default FilterComponent;
