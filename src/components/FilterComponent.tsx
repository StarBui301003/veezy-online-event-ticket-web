import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X, User } from 'lucide-react';
import Select from 'react-select';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';

// Nguồn định nghĩa duy nhất cho FilterOptions
export interface FilterOptions {
  searchTerm: string;
  location: string;
  sortBy: 'date' | 'name' | 'relevance';
  sortOrder: 'asc' | 'desc';
  categoryIds: string[];
  authorFullName: string;
}

interface FilterComponentProps {
  filters: Partial<FilterOptions>;
  onFilterChange: (filters: FilterOptions) => void;
  showLocationFilter?: boolean;
  showCategoryFilter?: boolean;
  showAuthorFilter?: boolean;
  locations?: { value: string; label: string }[];
  categories?: { value: string; label: string }[];
}

const FilterComponent: React.FC<FilterComponentProps> = ({
  filters,
  onFilterChange,
  showLocationFilter = false,
  showCategoryFilter = false,
  showAuthorFilter = false,
  locations = [],
  categories = [],
}) => {
  const { t } = useTranslation();
  const { theme } = useThemeClasses();

  const baseFilters: FilterOptions = {
    searchTerm: '',
    location: '',
    sortBy: 'date',
    sortOrder: 'desc',
    categoryIds: [],
    authorFullName: '',
  };

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    onFilterChange({ ...baseFilters, ...filters, [key]: value });
  };
  
  const handleSelectChange = (key: keyof FilterOptions) => (opt: any) => {
    updateFilter(key, opt ? opt.value : '');
  };

  const handleMultiSelectChange = (key: keyof FilterOptions) => (opts: any) => {
    updateFilter(key, opts ? opts.map((o: any) => o.value) : []);
  };
  
  const hasActiveFilters = filters.searchTerm || filters.authorFullName || filters.location || (filters.categoryIds && filters.categoryIds.length > 0);

  const selectStyles = {
    control: (provided: any, state: any) => ({ ...provided, backgroundColor: theme === 'dark' ? '#1f2937' : 'white', borderColor: state.isFocused ? '#3b82f6' : (theme === 'dark' ? '#4b5563' : '#d1d5db'), boxShadow: 'none', '&:hover': { borderColor: '#3b82f6' }, borderRadius: '0.75rem', minHeight: '48px' }),
    menu: (provided: any) => ({...provided, backgroundColor: theme === 'dark' ? '#1f2937' : 'white', zIndex: 50 }),
    option: (provided: any, state: any) => ({ ...provided, backgroundColor: state.isSelected ? '#3b82f6' : (state.isFocused ? (theme === 'dark' ? '#374151' : '#f3f4f6') : 'transparent'), color: theme === 'dark' ? '#e5e7eb' : '#111827', }),
    singleValue: (provided: any) => ({ ...provided, color: theme === 'dark' ? 'white' : '#111827' }),
    input: (provided: any) => ({ ...provided, color: theme === 'dark' ? 'white' : '#111827' }),
    placeholder: (provided: any) => ({ ...provided, color: theme === 'dark' ? '#9ca3af' : '#6b7280' }),
    multiValue: (styles: any) => ({...styles, backgroundColor: theme === 'dark' ? '#3b82f6' : '#dbeafe',}),
    multiValueLabel: (styles: any) => ({...styles, color: theme === 'dark' ? '#fff' : '#1e40af',}),
  };

  return (
    <div className="p-4 md:p-6 rounded-2xl bg-white/60 dark:bg-gray-800/40 backdrop-blur-lg border border-gray-200 dark:border-gray-700 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Search Term */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
          <input
            type="text"
            placeholder={t('filterOptions.searchPlaceholder')}
            className={cn('w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2', theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900')}
            value={filters.searchTerm}
            onChange={(e) => updateFilter('searchTerm', e.target.value)}
          />
        </div>

        {/* Author Filter (for News) */}
        {showAuthorFilter && (
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
            <input
              type="text"
              placeholder={t('filterOptions.authorPlaceholder')}
              className={cn('w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2', theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900')}
              value={filters.authorFullName}
              onChange={(e) => updateFilter('authorFullName', e.target.value)}
            />
          </div>
        )}
        
        {/* Location Filter (for Events) */}
        {showLocationFilter && <Select options={locations} value={locations.find(l => l.value === filters.location)} onChange={handleSelectChange('location')} isClearable isSearchable placeholder={t('filterOptions.locationPlaceholder')} styles={selectStyles} menuPortalTarget={document.body} maxMenuHeight={220} />}
        
        {/* Category Filter (for Events) */}
        {showCategoryFilter && <Select isMulti options={categories} value={categories.filter(c => filters.categoryIds?.includes(c.value))} onChange={handleMultiSelectChange('categoryIds')} placeholder={t('filterOptions.categoryPlaceholder')} styles={selectStyles} closeMenuOnSelect={false} menuPortalTarget={document.body} maxMenuHeight={220} />}
      
      </div>
      {hasActiveFilters && <button onClick={() => onFilterChange(baseFilters)} className="flex items-center text-sm text-blue-600 dark:text-cyan-400 hover:underline"><X className="h-4 w-4 mr-1" />{t('filterOptions.clearFilters')}</button>}
    </div>
  );
};

export default FilterComponent;