import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Calendar, MapPin, ChevronDown, X, SortAsc, SortDesc, Grid3X3, List } from 'lucide-react';

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
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({
      searchTerm: '',
      dateRange: 'all',
      location: '',
      sortBy: 'date',
      sortOrder: 'desc'
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

  const selectStyle = "bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full appearance-none";
  const optionStyle = "bg-gray-800 text-white";

  return (
    <div className={`filter-container w-full max-w-7xl mx-auto px-4 mb-8 ${className}`}>
      <motion.div
        className="bg-gray-900/80 backdrop-blur-lg rounded-xl p-4 shadow-lg border border-gray-800"
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
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 hover:border-cyan-400/50 hover:bg-cyan-900/20 text-cyan-300 hover:text-white transition-colors text-sm font-medium"
            >
              <X className="w-4 h-4" />
              Xóa bộ lọc
            </button>
          )}

          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={`Tìm kiếm ${contentType}...`}
                value={filters.searchTerm}
                onChange={(e) => updateFilter('searchTerm', e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <div className="relative">
                <select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-');
                    updateFilter('sortBy', sortBy);
                    updateFilter('sortOrder', sortOrder);
                  }}
                  className={selectStyle}
                >
                  <option value="date-desc" className={optionStyle}>Mới nhất</option>
                  <option value="date-asc" className={optionStyle}>Cũ nhất</option>
                  <option value="name-asc" className={optionStyle}>Tên A-Z</option>
                  <option value="name-desc" className={optionStyle}>Tên Z-A</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>
            </div>

            {/* Date Range Dropdown */}
            <div className="relative">
              <div className="relative">
                <select
                  value={filters.dateRange}
                  onChange={(e) => updateFilter('dateRange', e.target.value)}
                  className={selectStyle}
                >
                  <option value="all" className={optionStyle}>Tất cả ngày</option>
                  <option value="today" className={optionStyle}>Hôm nay</option>
                  <option value="week" className={optionStyle}>Tuần này</option>
                  <option value="month" className={optionStyle}>Tháng này</option>
                  <option value="upcoming" className={optionStyle}>Sắp tới</option>
                </select>
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
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
                    <option value="" className={optionStyle}>Tất cả địa điểm</option>
                    {locations.map((location) => (
                      <option key={location} value={location} className={optionStyle}>
                        {location}
                      </option>
                    ))}
                  </select>
                  <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>
              </div>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center bg-white/10 border border-white/20 rounded-full p-1">
              <button
                onClick={() => onViewModeChange('grid')}
                className={`p-2 rounded-full ${viewMode === 'grid' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-white'}`}
                title="Chế độ lưới"
              >
                <Grid3X3 className="h-5 w-5" />
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={`p-2 rounded-full ${viewMode === 'list' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-white'}`}
                title="Chế độ danh sách"
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 pt-4 border-t border-gray-800"
            >
              <div className={`grid grid-cols-1 ${showLocationFilter ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-4`}>
                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    Thời gian
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => updateFilter('dateRange', e.target.value as 'all' | 'today' | 'week' | 'month' | 'upcoming')}
                    className={selectStyle}
                  >
                    <option value="all" className={optionStyle}>Tất cả</option>
                    <option value="today" className={optionStyle}>Hôm nay</option>
                    <option value="week" className={optionStyle}>Tuần này</option>
                    <option value="month" className={optionStyle}>Tháng này</option>
                    <option value="upcoming" className={optionStyle}>Sắp tới</option>
                  </select>
                </div>

                {/* Location Filter - Only show for events */}
                {showLocationFilter && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <MapPin className="inline w-4 h-4 mr-1" />
                      Địa điểm
                    </label>
                    <select
                      value={filters.location}
                      onChange={(e) => updateFilter('location', e.target.value)}
                      className={selectStyle}
                    >
                      <option value="" className={optionStyle}>Tất cả địa điểm</option>
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
          )}
        </AnimatePresence>

        {/* Results Summary */}
        {resultsCount && (
          <div className="mt-4 flex justify-between items-center text-sm text-gray-300">
            <span>{getResultsText()}</span>
            {hasActiveFilters && (
              <span className="text-cyan-400">
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