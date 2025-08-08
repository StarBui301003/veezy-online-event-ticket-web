/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchEventsAPI } from '@/services/search.service';
import { getAllCategories } from '@/services/Event Manager/event.service';
import { getProvinces } from 'sub-vn';
import {
  Loader2,
  Calendar,
  MapPin,
  X,
  Search,
  Clock,
  Users,
  Star,
  Grid3X3,
  List,
  Filter,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format, isAfter, startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';

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

const EVENT_HUB_URL =
  ((import.meta as any)?.env?.VITE_EVENT_HUB_URL as string) ||
  (process.env as any)?.REACT_APP_EVENT_HUB_URL ||
  'https://event.vezzy.site/notificationHub';

export const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<SearchResult[]>([]);
  const [categories, setCategories] = useState<{ categoryId: string; categoryName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('date');
  const [showFilters, setShowFilters] = useState(false);
  const { t } = useTranslation();
  const { getThemeClass } = useThemeClasses();

  const [filters, setFilters] = useState({
    date: 'all',
    category: 'all',
    location: '',
    priceRange: 'all',
    dateFrom: '',
    dateTo: '',
  });

  // State cho location dropdown
  const [locationInput, setLocationInput] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const connectionRef = useRef<HubConnection | null>(null);
  const joinedEventIdsRef = useRef<Set<string>>(new Set());

  const mapEventToSearchResult = useCallback(
    (event: any): SearchResult => ({
      id: String(event.id),
      name: event.name,
      description: event.description || '',
      type: 'event',
      imageUrl: event.coverImageUrl || '',
      date: event.startAt,
      location: event.location,
      price: event.isFree ? 0 : undefined,
    }),
    []
  );

  const fetchSearchResults = useCallback(async () => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { events } = await searchEventsAPI({
        searchTerm: query,
        dateRange: 'all',
        location: '',
        sortBy: 'relevance',
        sortOrder: 'desc',
        page: 1,
        pageSize: 50, // Increase page size to get more results
      });

      // Map API response to SearchResult type
      const mappedResults = events.map(mapEventToSearchResult);

      setResults(mappedResults);
    } catch (err: any) {
      console.error('Search failed:', err);
      setError(err.message || 'Có lỗi xảy ra khi tìm kiếm');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, mapEventToSearchResult]);

  useEffect(() => {
    fetchSearchResults();
  }, [fetchSearchResults]);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getAllCategories();
        setCategories(data);
      } catch {
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  // Lấy danh sách tỉnh/thành phố Việt Nam từ thư viện sub-vn
  const provinces = getProvinces();

  // Lọc location theo input, ưu tiên bắt đầu bằng ký tự nhập
  const filteredLocations = locationInput
    ? provinces
        .filter((p) => p.name.toLowerCase().includes(locationInput.toLowerCase()))
        .sort((a, b) => {
          // Ưu tiên những tỉnh bắt đầu bằng ký tự tìm kiếm
          const aStarts = a.name.toLowerCase().startsWith(locationInput.toLowerCase());
          const bStarts = b.name.toLowerCase().startsWith(locationInput.toLowerCase());
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          return a.name.localeCompare(b.name);
        })
        .slice(0, 8)
    : provinces.slice(0, 8);

  // Apply filters and sorting
  const filteredResults = useMemo(() => {
    const filtered = results.filter((event) => {
      const eventDate = new Date(event.date);
      const today = startOfDay(new Date());

      // Date filter - bỏ past filter
      let matchesDate = true;
      if (filters.date === 'today') {
        const todayEnd = endOfDay(new Date());
        matchesDate = eventDate >= today && eventDate <= todayEnd;
      } else if (filters.date === 'thisWeek') {
        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Bắt đầu từ thứ 2
        const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
        matchesDate = eventDate >= weekStart && eventDate <= weekEnd;
      } else if (filters.date === 'upcoming') {
        matchesDate = isAfter(eventDate, today);
      }

      // Custom date range
      if (filters.dateFrom && filters.dateTo) {
        const fromDate = startOfDay(new Date(filters.dateFrom));
        const toDate = endOfDay(new Date(filters.dateTo));
        matchesDate = eventDate >= fromDate && eventDate <= toDate;
      }

      const matchesCategory = filters.category === 'all' || event.category === filters.category;
      const matchesLocation = !filters.location || event.location?.includes(filters.location);

      // Price range filter (giá VNĐ)
      let matchesPrice = true;
      if (filters.priceRange !== 'all' && event.price !== undefined) {
        switch (filters.priceRange) {
          case 'free':
            matchesPrice = event.price === 0;
            break;
          case 'under100k':
            matchesPrice = event.price > 0 && event.price < 100000;
            break;
          case '100k-500k':
            matchesPrice = event.price >= 100000 && event.price <= 500000;
            break;
          case 'over500k':
            matchesPrice = event.price > 500000;
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
          return a.name.localeCompare(b.name, 'vi');
        case 'price':
          return (a.price || 0) - (b.price || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [results, filters, sortBy]);

  // Setup SignalR connection and realtime updates
  useEffect(() => {
    const setupSignalR = async () => {
      try {
        const connection = new HubConnectionBuilder()
          .withUrl(EVENT_HUB_URL)
          .configureLogging(LogLevel.Warning)
          .withAutomaticReconnect()
          .build();

        // Event created: refetch to see if it matches current query/filters
        connection.on('OnEventCreated', async () => {
          await fetchSearchResults();
        });

        // Event updated: merge into results; if it stops matching, filteredResults will hide it
        connection.on('OnEventUpdated', (eventData: any) => {
          const updated = mapEventToSearchResult(eventData);
          setResults((prev) => {
            const exists = prev.some((e) => e.id === updated.id);
            return exists
              ? prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e))
              : prev;
          });
        });

        // Event deleted: remove from results
        connection.on('OnEventDeleted', (eventId: string) => {
          setResults((prev) => prev.filter((e) => e.id !== String(eventId)));
        });

        // Status changed: safest is refetch, since it may affect sorting/visibility
        connection.on('OnEventStatusChanged', async () => {
          await fetchSearchResults();
        });

        // Re-join groups on reconnect
        connection.onreconnected(async () => {
          await joinGroupsForVisibleResults();
          await fetchSearchResults();
        });

        await connection.start();
        connectionRef.current = connection;
        await joinGroupsForVisibleResults();
      } catch (err) {
        console.error('SignalR connection error (SearchResultsPage):', err);
      }
    };

    const joinGroupsForVisibleResults = async () => {
      const connection = connectionRef.current;
      if (!connection || connection.state !== HubConnectionState.Connected) return;
      const currentIds = new Set<string>(filteredResults.map((e) => String(e.id)));
      // Leave obsolete groups
      for (const joinedId of Array.from(joinedEventIdsRef.current)) {
        if (!currentIds.has(joinedId)) {
          try {
            await connection.invoke('LeaveEventGroup', joinedId);
          } catch {}
          joinedEventIdsRef.current.delete(joinedId);
        }
      }
      // Join new groups
      for (const id of currentIds) {
        if (!joinedEventIdsRef.current.has(id)) {
          try {
            await connection.invoke('JoinEventGroup', id);
            joinedEventIdsRef.current.add(id);
          } catch {}
        }
      }
    };

    setupSignalR();
    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
        joinedEventIdsRef.current.clear();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep group membership in sync with currently visible results
  useEffect(() => {
    const syncGroups = async () => {
      const connection = connectionRef.current;
      if (!connection || connection.state !== HubConnectionState.Connected) return;
      const currentIds = new Set<string>(filteredResults.map((e) => String(e.id)));
      for (const joinedId of Array.from(joinedEventIdsRef.current)) {
        if (!currentIds.has(joinedId)) {
          try {
            await connection.invoke('LeaveEventGroup', joinedId);
          } catch {}
          joinedEventIdsRef.current.delete(joinedId);
        }
      }
      for (const id of currentIds) {
        if (!joinedEventIdsRef.current.has(id)) {
          try {
            await connection.invoke('JoinEventGroup', id);
            joinedEventIdsRef.current.add(id);
          } catch {}
        }
      }
    };
    syncGroups();
  }, [filteredResults]);

  const clearFilters = () => {
    setFilters({
      date: 'all',
      category: 'all',
      location: '',
      priceRange: 'all',
      dateFrom: '',
      dateTo: '',
    });
    setLocationInput('');
  };

  const hasActiveFilters =
    filters.date !== 'all' ||
    filters.category !== 'all' ||
    filters.location !== '' ||
    filters.priceRange !== 'all' ||
    filters.dateFrom !== '' ||
    filters.dateTo !== '';

  // Format Vietnamese currency
  const formatVNDPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  if (loading) {
    return (
      <div
        className={cn(
          'min-h-screen pt-32 px-4',
          getThemeClass(
            'bg-gradient-to-r from-blue-500 to-cyan-400 text-white',
            'bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white'
          )
        )}
      >
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <Loader2
                className={cn(
                  'animate-spin h-16 w-16',
                  getThemeClass('text-blue-600', 'text-blue-500')
                )}
              />
              <div
                className={cn(
                  'absolute inset-0 rounded-full animate-pulse',
                  getThemeClass('bg-blue-500/20', 'bg-blue-500/20')
                )}
              ></div>
            </div>
            <p className="text-xl font-medium">{t('searchLoading')}</p>
            <p className={cn('', getThemeClass('text-gray-600', 'text-gray-400'))}>
              {t('searchSearchingEvents')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'min-h-screen pt-32 pb-20 px-4',
        getThemeClass(
          'bg-gradient-to-r from-blue-500 to-cyan-400 text-white',
          'bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white'
        )
      )}
    >
      <div className="max-w-7xl mx-auto">
        {/* Wrapper card background */}
        <div
          className={cn(
            'rounded-3xl shadow-2xl p-8 md:p-12 mb-8',
            getThemeClass(
              'bg-white/80 border border-gray-200/40',
              'bg-gray-900/60 border border-gray-700/40'
            )
          )}
        >
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Search className={cn('h-8 w-8', getThemeClass('text-blue-600', 'text-blue-400'))} />
              <h1
                className={cn(
                  'text-4xl font-bold bg-clip-text text-transparent',
                  getThemeClass(
                    'bg-gradient-to-r from-blue-600 to-purple-600',
                    'bg-gradient-to-r from-blue-400 to-purple-400'
                  ),
                  getThemeClass('!text-gray-900 !bg-none', '')
                )}
              >
                {t('searchResultsFor')} "{query}"
              </h1>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className={cn('text-lg', getThemeClass('text-gray-700', 'text-gray-300'))}>
                <span className={cn('font-semibold', getThemeClass('text-gray-900', 'text-white'))}>
                  {filteredResults.length}
                </span>{' '}
                {t('eventsFound')}
                {hasActiveFilters && (
                  <span
                    className={cn('ml-2 text-sm', getThemeClass('text-blue-600', 'text-blue-400'))}
                  >
                    ({t('filtered')})
                  </span>
                )}
              </p>

              <div className="flex items-center gap-4">
                {/* Filter Toggle Button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                    showFilters
                      ? getThemeClass('bg-blue-600 text-white', 'bg-blue-600 text-white')
                      : getThemeClass(
                          'bg-white text-gray-900 hover:bg-gray-100',
                          'bg-gray-800 text-gray-300 hover:text-white'
                        )
                  )}
                >
                  <Filter className="h-4 w-4" />
                  {t('filters')}
                  {hasActiveFilters && (
                    <span
                      className={cn(
                        'text-white text-xs px-1.5 py-0.5 rounded-full',
                        getThemeClass('bg-blue-500', 'bg-blue-500')
                      )}
                    >
                      {Object.values(filters).filter((v) => v !== 'all' && v !== '').length}
                    </span>
                  )}
                </button>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2">
                  <label className={cn('text-sm', getThemeClass('text-gray-700', 'text-gray-300'))}>
                    {t('sortBy')}:
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className={cn(
                      'border rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors',
                      getThemeClass(
                        'bg-white border-gray-300 text-gray-900',
                        'bg-gray-700/50 border-gray-600 text-white'
                      )
                    )}
                  >
                    <option value="date">{t('date')}</option>
                    <option value="name">{t('name')}</option>
                    <option value="price">{t('price')}</option>
                  </select>
                </div>

                {/* View Mode Toggle */}
                <div
                  className={cn(
                    'flex items-center rounded-lg p-1',
                    getThemeClass('bg-gray-100', 'bg-gray-800')
                  )}
                >
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      'p-2 rounded-md transition-colors',
                      viewMode === 'grid'
                        ? getThemeClass('bg-blue-600 text-white', 'bg-blue-600 text-white')
                        : getThemeClass(
                            'text-gray-600 hover:text-gray-900',
                            'text-gray-400 hover:text-white'
                          )
                    )}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      'p-2 rounded-md transition-colors',
                      viewMode === 'list'
                        ? getThemeClass('bg-blue-600 text-white', 'bg-blue-600 text-white')
                        : getThemeClass(
                            'text-gray-600 hover:text-gray-900',
                            'text-gray-400 hover:text-white'
                          )
                    )}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div
              className={cn(
                'backdrop-blur-sm border rounded-2xl p-6 mb-8 animate-in slide-in-from-top-2 duration-200',
                getThemeClass('bg-white/80 border-gray-200/50', 'bg-gray-800/30 border-gray-700/50')
              )}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
                {/* Date Filter */}
                <div className="space-y-3">
                  <label
                    className={cn(
                      'block text-sm font-medium',
                      getThemeClass('text-gray-700', 'text-gray-300')
                    )}
                  >
                    <Clock className="inline h-4 w-4 mr-2" />
                    {t('date')}
                  </label>
                  <select
                    value={filters.date}
                    onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                    className={cn(
                      'w-full rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-blue-500 border-2',
                      getThemeClass(
                        'bg-gray-50 border-gray-500 text-gray-900',
                        'bg-gray-700/50 border-gray-600 text-white'
                      )
                    )}
                  >
                    <option value="all">{t('allDates')}</option>
                    <option value="today">{t('today')}</option>
                    <option value="thisWeek">{t('thisWeek')}</option>
                    <option value="upcoming">{t('upcoming')}</option>
                  </select>
                </div>

                {/* Category Filter */}
                <div className="space-y-3">
                  <label
                    className={cn(
                      'block text-sm font-medium',
                      getThemeClass('text-gray-700', 'text-gray-300')
                    )}
                  >
                    {t('category')}
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className={cn(
                      'w-full rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-blue-500 border-2',
                      getThemeClass(
                        'bg-gray-50 border-gray-500 text-gray-900',
                        'bg-gray-700/50 border-gray-600 text-white'
                      )
                    )}
                  >
                    <option value="all">{t('allCategories')}</option>
                    {categories.map((cat) => (
                      <option key={cat.categoryId} value={cat.categoryName}>
                        {cat.categoryName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location Filter */}
                <div className="space-y-3 relative">
                  <label
                    className={cn(
                      'block text-sm font-medium',
                      getThemeClass('text-gray-700', 'text-gray-300')
                    )}
                  >
                    <MapPin className="inline h-4 w-4 mr-2" />
                    {t('location')}
                  </label>
                  <input
                    ref={locationInputRef}
                    type="text"
                    value={locationInput}
                    onChange={(e) => {
                      setLocationInput(e.target.value);
                      setShowLocationDropdown(true);
                    }}
                    onFocus={() => setShowLocationDropdown(true)}
                    onBlur={() => setTimeout(() => setShowLocationDropdown(false), 200)}
                    placeholder={t('selectLocation')}
                    className={cn(
                      'w-full rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-blue-500 border-2',
                      getThemeClass(
                        'bg-gray-50 border-gray-500 text-gray-900 placeholder-gray-500',
                        'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400'
                      )
                    )}
                    autoComplete="off"
                  />
                  {showLocationDropdown && (
                    <div
                      className={cn(
                        'absolute z-50 w-full rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg',
                        getThemeClass('bg-white border-gray-200', 'bg-gray-800 border-gray-600')
                      )}
                    >
                      {filteredLocations.length === 0 ? (
                        <div
                          className={cn(
                            'px-4 py-2',
                            getThemeClass('text-gray-500', 'text-gray-400')
                          )}
                        >
                          {t('noResults')}
                        </div>
                      ) : (
                        filteredLocations.map((province) => (
                          <div
                            key={province.code}
                            className={cn(
                              'px-4 py-2 cursor-pointer transition-colors',
                              filters.location === province.name
                                ? 'bg-blue-600 text-white'
                                : getThemeClass(
                                    'hover:bg-gray-100 text-gray-700',
                                    'hover:bg-blue-600 hover:text-white text-gray-300'
                                  )
                            )}
                            onMouseDown={() => {
                              setFilters({ ...filters, location: province.name });
                              setLocationInput(province.name);
                              setShowLocationDropdown(false);
                            }}
                          >
                            {province.name}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                  {/* Clear location button */}
                  {filters.location && (
                    <button
                      type="button"
                      className={cn(
                        'absolute right-3 top-9 transition-colors',
                        getThemeClass(
                          'text-gray-500 hover:text-gray-700',
                          'text-gray-400 hover:text-white'
                        )
                      )}
                      onClick={() => {
                        setFilters({ ...filters, location: '' });
                        setLocationInput('');
                      }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Price Range Filter */}
                <div className="space-y-3">
                  <label
                    className={cn(
                      'block text-sm font-medium',
                      getThemeClass('text-gray-700', 'text-gray-300')
                    )}
                  >
                    {t('priceRange')}
                  </label>
                  <select
                    value={filters.priceRange}
                    onChange={(e) => setFilters({ ...filters, priceRange: e.target.value })}
                    className={cn(
                      'w-full rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-blue-500 border-2',
                      getThemeClass(
                        'bg-gray-50 border-gray-500 text-gray-900',
                        'bg-gray-700/50 border-gray-600 text-white'
                      )
                    )}
                  >
                    <option value="all">{t('allPrices')}</option>
                    <option value="free">{t('free')}</option>
                    <option value="under100k">{t('under')} 100K</option>
                    <option value="100k-500k">100K - 500K</option>
                    <option value="over500k">{t('over')} 500K</option>
                  </select>
                </div>
              </div>

              {/* Custom Date Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label
                    className={cn(
                      'block text-xs mb-1',
                      getThemeClass('text-gray-600', 'text-gray-400')
                    )}
                  >
                    {t('fromDate')}
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    className={cn(
                      'rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 w-full border-2',
                      getThemeClass(
                        'bg-gray-50 border-gray-500 text-gray-900',
                        'bg-gray-700/50 border-gray-600 text-white'
                      )
                    )}
                  />
                </div>
                <div>
                  <label
                    className={cn(
                      'block text-xs mb-1',
                      getThemeClass('text-gray-600', 'text-gray-400')
                    )}
                  >
                    {t('toDate')}
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    className={cn(
                      'rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 w-full border-2',
                      getThemeClass(
                        'bg-gray-50 border-gray-500 text-gray-900',
                        'bg-gray-700/50 border-gray-600 text-white'
                      )
                    )}
                  />
                </div>
              </div>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <div
                  className={cn(
                    'pt-4 border-t',
                    getThemeClass('border-gray-200', 'border-gray-700')
                  )}
                >
                  <button
                    onClick={clearFilters}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm',
                      getThemeClass(
                        'bg-gray-200 hover:bg-gray-300 text-gray-700',
                        'bg-gray-700 hover:bg-gray-600 text-white'
                      )
                    )}
                  >
                    <X className="h-4 w-4" />
                    {t('clearAllFilters')}
                  </button>
                </div>
              )}
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
                  {t('searchNoEventsFound')}
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">{t('searchTryDifferentKeywords')}</p>
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
                  {t('searchBrowseAllEvents')}
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
                <Link
                  key={result.id}
                  to={`/event/${result.id}`}
                  className={cn(
                    'group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl',
                    viewMode === 'grid'
                      ? getThemeClass(
                          'bg-white/80 border-gray-200/50',
                          'bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50'
                        )
                      : getThemeClass(
                          'bg-white/60 border-gray-200/50 grid grid-cols-3 gap-6 p-6',
                          'bg-gradient-to-r from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-gray-700/50 grid grid-cols-3 gap-6 p-6'
                        )
                  )}
                >
                  {/* Image */}
                  <div
                    className={
                      viewMode === 'grid'
                        ? 'h-56 overflow-hidden relative'
                        : 'col-span-1 w-full h-48 rounded-xl overflow-hidden relative'
                    }
                  >
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
                  <div className={viewMode === 'grid' ? 'p-6' : 'col-span-2 flex-1 min-w-0'}>
                    <div className="flex items-start justify-between mb-3">
                      <h3
                        className={cn(
                          'font-bold transition-colors',
                          getThemeClass(
                            'text-gray-900 group-hover:text-blue-600',
                            'text-white group-hover:text-blue-400'
                          ),
                          viewMode === 'grid' ? 'text-xl line-clamp-2' : 'text-lg line-clamp-1'
                        )}
                      >
                        {result.name}
                      </h3>
                      {result.rating && (
                        <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded-full">
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                          <span className="text-xs text-yellow-400 font-medium">
                            {result.rating}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Category Badge */}
                    {result.category && (
                      <span className="inline-block bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 text-xs px-3 py-1 rounded-full mb-3 border border-blue-500/30">
                        {result.category}
                      </span>
                    )}

                    <p
                      className={cn(
                        'mb-4',
                        getThemeClass('text-gray-600', 'text-gray-400'),
                        viewMode === 'grid' ? 'line-clamp-2' : 'line-clamp-1'
                      )}
                    >
                      {result.description}
                    </p>

                    {/* Event Details */}
                    <div className="space-y-2">
                      <div
                        className={cn(
                          'flex items-center text-sm',
                          getThemeClass('text-gray-700', 'text-gray-300')
                        )}
                      >
                        <Calendar className="h-4 w-4 mr-2 text-blue-400" />
                        <span className="font-medium">
                          {format(new Date(result.date), 'dd/MM/yyyy • HH:mm')}
                        </span>
                      </div>

                      {result.location && (
                        <div
                          className={cn(
                            'flex items-center text-sm',
                            getThemeClass('text-gray-700', 'text-gray-300')
                          )}
                        >
                          <MapPin className="h-4 w-4 mr-2 text-green-400" />
                          <span className="truncate">{result.location}</span>
                        </div>
                      )}

                      {/* Additional Info Row */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-4">
                          {result.price !== undefined && (
                            <span className="text-sm font-semibold text-green-400">
                              {formatVNDPrice(result.price)}
                            </span>
                          )}
                          {result.attendees && (
                            <div
                              className={cn(
                                'flex items-center gap-1 text-xs',
                                getThemeClass('text-gray-500', 'text-gray-400')
                              )}
                            >
                              <Users className="h-3 w-3" />
                              <span>{result.attendees.toLocaleString('vi-VN')}</span>
                            </div>
                          )}
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            isAfter(new Date(result.date), new Date())
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                          }`}
                        >
                          {isAfter(new Date(result.date), new Date()) ? t('upcoming') : t('ended')}
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
    </div>
  );
};

export default SearchResultsPage;
