import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchEvents } from '@/services/search.service';
import { 
  Loader2, 
  Calendar, 
  MapPin, 
  Filter, 
  X, 
  Search,
  Clock,
  Users,
  Star,
  Grid3X3,
  List,
  SlidersHorizontal
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';

interface SearchResult {
  id: string;
  name: string;
  description: string;
  type: string;
  imageUrl: string;
  date: string;
  location?: string;
  category?: string;
  price?: number;
  rating?: number;
  attendees?: number;
}

export const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  
  const [filters, setFilters] = useState({
    date: 'all',
    category: 'all',
    location: 'all',
    priceRange: 'all',
    dateFrom: '',
    dateTo: ''
  });
  
  const { t } = useTranslation();

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const searchResults = await searchEvents(query);
        const eventResults = searchResults.filter(item => item.type.toLowerCase() === 'event');
        setResults(eventResults);
      } catch (err) {
        console.error('Error fetching search results:', err);
        setError(t('search.errorFetchingResults'));
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query, t]);

  // Get unique categories and locations for filters
  const categories = [...new Set(results.map(item => item.category).filter(Boolean))] as string[];
  const locations = [...new Set(results.map(item => item.location).filter(Boolean))] as string[];

  // Apply filters and sorting
  const filteredAndSortedResults = () => {
    let filtered = results.filter(event => {
      const eventDate = new Date(event.date);
      const today = new Date();
      
      // Date filter
      let matchesDate = true;
      if (filters.date === 'upcoming') {
        matchesDate = isAfter(eventDate, today);
      } else if (filters.date === 'past') {
        matchesDate = isBefore(eventDate, today);
      } else if (filters.date === 'today') {
        matchesDate = eventDate >= startOfDay(today) && eventDate <= endOfDay(today);
      } else if (filters.date === 'thisWeek') {
        const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        matchesDate = eventDate >= today && eventDate <= weekFromNow;
      }
      
      // Custom date range
      if (filters.dateFrom && filters.dateTo) {
        const fromDate = new Date(filters.dateFrom);
        const toDate = new Date(filters.dateTo);
        matchesDate = eventDate >= fromDate && eventDate <= toDate;
      }
      
      const matchesCategory = filters.category === 'all' || event.category === filters.category;
      const matchesLocation = filters.location === 'all' || event.location === filters.location;
      
      // Price range filter
      let matchesPrice = true;
      if (filters.priceRange !== 'all' && event.price !== undefined) {
        switch (filters.priceRange) {
          case 'free':
            matchesPrice = event.price === 0;
            break;
          case 'under50':
            matchesPrice = event.price > 0 && event.price < 50;
            break;
          case '50to100':
            matchesPrice = event.price >= 50 && event.price <= 100;
            break;
          case 'over100':
            matchesPrice = event.price > 100;
            break;
        }
      }
      
      return matchesDate && matchesCategory && matchesLocation && matchesPrice;
    });

    // Sort results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'price':
          return (a.price || 0) - (b.price || 0);
        default:
          return 0; // relevance
      }
    });

    return filtered;
  };

  const filteredResults = filteredAndSortedResults();

  const clearFilters = () => {
    setFilters({
      date: 'all',
      category: 'all',
      location: 'all',
      priceRange: 'all',
      dateFrom: '',
      dateTo: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== 'all' && value !== '');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white pt-32 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <Loader2 className="animate-spin h-16 w-16 text-blue-500" />
              <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-pulse"></div>
            </div>
            <p className="text-xl font-medium">{t('search.loading')}</p>
            <p className="text-gray-400">{t('search.searchingEvents')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white pt-32 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Search className="h-8 w-8 text-blue-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {t('search.resultsFor', { query })}
            </h1>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-gray-300 text-lg">
              <span className="font-semibold text-white">{filteredResults.length}</span> {t('search.events').toLowerCase()} {t('search.found')}
              {hasActiveFilters && (
                <span className="ml-2 text-sm text-blue-400">
                  ({t('filtered')})
                </span>
              )}
            </p>
            
            <div className="flex items-center gap-4">
              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-300">{t('sortBy')}:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-gray-800 border border-gray-600 rounded-lg py-2 px-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="relevance">{t('relevance')}</option>
                  <option value="date">{t('date')}</option>
                  <option value="name">{t('name')}</option>
                  <option value="rating">{t('rating')}</option>
                  <option value="price">{t('price')}</option>
                </select>
              </div>
              
              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
              
              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  showFilters || hasActiveFilters
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">{t('filters')}</span>
                {hasActiveFilters && (
                  <span className="bg-white text-blue-600 text-xs px-2 py-1 rounded-full font-medium">
                    {Object.values(filters).filter(value => value !== 'all' && value !== '').length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 backdrop-blur-sm border border-gray-600/50 rounded-xl p-6 mb-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Filter className="h-5 w-5 text-blue-400" />
                <h3 className="text-xl font-semibold">{t('filters')}</h3>
              </div>
              
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                    {t('clearAll')}
                  </button>
                )}
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-1.5 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Date Filter */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">
                  <Clock className="inline h-4 w-4 mr-2" />
                  {t('date')}
                </label>
                <select
                  value={filters.date}
                  onChange={(e) => setFilters({...filters, date: e.target.value})}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="all">{t('allDates')}</option>
                  <option value="today">{t('today')}</option>
                  <option value="thisWeek">{t('thisWeek')}</option>
                  <option value="upcoming">{t('upcoming')}</option>
                  <option value="past">{t('past')}</option>
                </select>
                
                {/* Custom Date Range */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                    className="bg-gray-700/50 border border-gray-600 rounded-md py-1.5 px-2 text-white text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder={t('from')}
                  />
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                    className="bg-gray-700/50 border border-gray-600 rounded-md py-1.5 px-2 text-white text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder={t('to')}
                  />
                </div>
              </div>
              
              {/* Category Filter */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">
                  {t('category')}
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value})}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="all">{t('allCategories')}</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Location Filter */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">
                  <MapPin className="inline h-4 w-4 mr-2" />
                  {t('location')}
                </label>
                <select
                  value={filters.location}
                  onChange={(e) => setFilters({...filters, location: e.target.value})}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="all">{t('allLocations')}</option>
                  {locations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Price Range Filter */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">
                  {t('priceRange')}
                </label>
                <select
                  value={filters.priceRange}
                  onChange={(e) => setFilters({...filters, priceRange: e.target.value})}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="all">{t('allPrices')}</option>
                  <option value="free">{t('free')}</option>
                  <option value="under50">{t('under')} $50</option>
                  <option value="50to100">$50 - $100</option>
                  <option value="over100">{t('over')} $100</option>
                </select>
              </div>
            </div>
          </div>
        )}
        
        {/* Error State */}
        {error ? (
          <div className="bg-red-500/20 border border-red-500/50 backdrop-blur-sm text-red-200 p-6 rounded-xl shadow-lg">
            <div className="flex items-center gap-3">
              <X className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </div>
        ) : filteredResults.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16">
            <div className="mb-6">
              <Search className="h-24 w-24 text-gray-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-300 mb-2">
                {t('search.noEventsFound')}
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {t('search.tryDifferentKeywords')}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  {t('clearFilters')}
                </button>
              )}
              <Link 
                to="/events" 
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200 shadow-lg shadow-blue-600/25"
              >
                {t('search.browseAllEvents')}
              </Link>
            </div>
          </div>
        ) : (
          /* Results */
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" 
            : "space-y-6"
          }>
            {filteredResults.map((result) => (
              <Link
                key={result.id}
                to={`/event/${result.id}`}
                className={`group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${
                  viewMode === 'grid'
                    ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50'
                    : 'bg-gradient-to-r from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-gray-700/50 flex items-center gap-6 p-6'
                }`}
              >
                {/* Image */}
                <div className={viewMode === 'grid' ? 'h-56 overflow-hidden' : 'flex-shrink-0 w-48 h-32 rounded-xl overflow-hidden'}>
                  <img
                    src={result.imageUrl || '/images/event-placeholder.jpg'}
                    alt={result.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/event-placeholder.jpg';
                    }}
                  />
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                
                {/* Content */}
                <div className={viewMode === 'grid' ? 'p-6' : 'flex-1 min-w-0'}>
                  <div className="flex items-start justify-between mb-3">
                    <h3 className={`font-bold text-white group-hover:text-blue-400 transition-colors ${
                      viewMode === 'grid' ? 'text-xl line-clamp-2' : 'text-lg line-clamp-1'
                    }`}>
                      {result.name}
                    </h3>
                    {result.rating && (
                      <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded-full">
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <span className="text-xs text-yellow-400 font-medium">{result.rating}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Category Badge */}
                  {result.category && (
                    <span className="inline-block bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 text-xs px-3 py-1 rounded-full mb-3 border border-blue-500/30">
                      {result.category}
                    </span>
                  )}
                  
                  <p className={`text-gray-400 mb-4 ${viewMode === 'grid' ? 'line-clamp-2' : 'line-clamp-1'}`}>
                    {result.description}
                  </p>
                  
                  {/* Event Details */}
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-300">
                      <Calendar className="h-4 w-4 mr-2 text-blue-400" />
                      <span className="font-medium">
                        {format(new Date(result.date), 'MMM d, yyyy • h:mm a')}
                      </span>
                    </div>
                    
                    {result.location && (
                      <div className="flex items-center text-sm text-gray-300">
                        <MapPin className="h-4 w-4 mr-2 text-green-400" />
                        <span className="truncate">{result.location}</span>
                      </div>
                    )}
                    
                    {/* Additional Info Row */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-4">
                        {result.price !== undefined && (
                          <span className="text-sm font-semibold text-green-400">
                            {result.price === 0 ? t('free') : `$${result.price}`}
                          </span>
                        )}
                        {result.attendees && (
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Users className="h-3 w-3" />
                            <span>{result.attendees}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Status Badge */}
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        isAfter(new Date(result.date), new Date())
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                      }`}>
                        {isAfter(new Date(result.date), new Date()) ? t('upcoming') : t('past')}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResultsPage;