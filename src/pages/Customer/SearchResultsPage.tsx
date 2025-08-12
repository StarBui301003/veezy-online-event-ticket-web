import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { globalSearch } from '@/services/search.service';
import { Calendar, MapPin, Search, Star, Grid3X3, List, Frown, XCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

// --- INTERFACES ---
interface SearchResult {
  id: string;
  name: string;
  description: string;
  type: 'event' | 'news';
  imageUrl: string;
  date: string;
  location?: string | null;
  category?: string;
  price?: number;
  rating?: number;
  attendees?: number;
}

const EVENT_HUB_URL = 'https://event.vezzy.site/notificationHub';

// --- CÁC COMPONENT CON ---

const Loader = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
      <Loader2 className="animate-spin h-12 w-12 text-blue-500" />
      <p className="text-xl font-medium mt-4">{t('searchLoading')}</p>
    </div>
  );
};

const NoResults = () => {
  const { t } = useTranslation();
  return (
    <div className="text-center py-16">
        <Frown className="h-24 w-24 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
          {t('searchNoEventsFound')}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">{t('searchTryDifferentKeywords')}</p>
    </div>
  );
};

const ErrorDisplay = ({ message }: { message: string }) => (
    <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-500/50 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg flex items-center gap-3">
        <XCircle className="h-5 w-5"/>
        <span>{message}</span>
    </div>
);


// --- COMPONENT CHÍNH ---

export const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { t } = useTranslation();
  const { getThemeClass } = useThemeClasses();

  const fetchSearchResults = useCallback(async () => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await globalSearch(query);
      if (response.flag && Array.isArray(response.data)) {
        setResults(response.data);
      } else {
        setResults([]);
      }
    } catch (err) {
      setError(t('error.searchFailed'));
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, t]);

  useEffect(() => {
    fetchSearchResults();
  }, [fetchSearchResults]);

  useEffect(() => {
    const setupSignalR = async () => {
      try {
        const connection = new HubConnectionBuilder()
          .withUrl(EVENT_HUB_URL)
          .configureLogging(LogLevel.Warning)
          .withAutomaticReconnect()
          .build();
        connection.on('OnEventCreated', async () => { await fetchSearchResults(); });
        connection.on('OnEventDeleted', (eventId: string) => { setResults((prev) => prev.filter((e) => e.id !== String(eventId))); });
        connection.on('OnEventStatusChanged', async () => { await fetchSearchResults(); });
        connection.onreconnected(async () => { await fetchSearchResults(); });
        await connection.start();
        return () => { connection.stop(); };
      } catch (err) {
        console.error('SignalR connection error:', err);
      }
    };
    const cleanupPromise = setupSignalR();
    return () => {
      cleanupPromise.then(cleanup => cleanup && cleanup());
    };
  }, [fetchSearchResults]);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className={cn('min-h-screen pt-32 pb-20 px-4', getThemeClass('bg-gray-50', 'bg-gray-900'))}>
      <div className="max-w-7xl mx-auto">
        <div className={cn('rounded-2xl shadow-lg p-6 md:p-10 mb-8', getThemeClass('bg-white', 'bg-gray-800'))}>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Search className={cn('h-8 w-8', getThemeClass('text-blue-600', 'text-blue-400'))} />
              <h1 className={cn('text-3xl md:text-4xl font-bold', getThemeClass('text-gray-900', 'text-white'))}>
                {t('searchResultsFor')} <span className={cn(getThemeClass('text-blue-600', 'text-blue-400'))}>"{query}"</span>
              </h1>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className={cn('text-lg', getThemeClass('text-gray-700', 'text-gray-300'))}>
                <span className={cn('font-semibold', getThemeClass('text-gray-900', 'text-white'))}>{results.length}</span> {t('resultsFound')}
              </p>
              <div className={cn('flex items-center rounded-lg p-1', getThemeClass('bg-gray-100', 'bg-gray-700'))}>
                <button onClick={() => setViewMode('grid')} className={cn('p-2 rounded-md transition-colors', viewMode === 'grid' ? 'bg-blue-600 text-white' : getThemeClass('hover:bg-gray-200', 'hover:bg-gray-600'))}>
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button onClick={() => setViewMode('list')} className={cn('p-2 rounded-md transition-colors', viewMode === 'list' ? 'bg-blue-600 text-white' : getThemeClass('hover:bg-gray-200', 'hover:bg-gray-600'))}>
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          
          {/* FIX: Thêm phần hiển thị lỗi */}
          {error ? (
            <ErrorDisplay message={error} />
          ) : results.length === 0 ? (
            <NoResults />
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8' : 'space-y-6'}>
              {results.map((result) => (
                <Link
                  key={result.id}
                  to={`/${result.type === 'news' ? 'news' : 'event'}/${result.id}`}
                  className={cn('group block overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl shadow-md', viewMode === 'grid' ? getThemeClass('bg-white', 'bg-gray-800 border border-gray-200 dark:border-gray-700') : getThemeClass('bg-white grid grid-cols-1 md:grid-cols-3 gap-6 p-4 items-center', 'bg-gray-800 border border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-6 p-4 items-center'))}
                >
                  <div className={cn('relative', viewMode === 'grid' ? 'h-56' : 'md:col-span-1 w-full h-48 rounded-xl overflow-hidden')}>
                    <img
                      src={result.imageUrl || '/images/placeholder.jpg'}
                      alt={result.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.jpg'; }}
                    />
                  </div>
                  <div className={cn('flex flex-col', viewMode === 'grid' ? 'p-5' : 'md:col-span-2')}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={cn('inline-block text-xs font-semibold px-3 py-1 rounded-full', result.type === 'event' ? getThemeClass('bg-blue-100 text-blue-800', 'bg-blue-900/60 text-blue-300') : getThemeClass('bg-green-100 text-green-800', 'bg-green-900/60 text-green-300'))}>
                        {result.type === 'event' ? t('event') : t('news')}
                      </span>
                      {result.rating ? <div className="flex items-center gap-1"><Star className="h-3 w-3 text-yellow-400 fill-current" /><span className="text-xs text-yellow-400 font-medium">{result.rating}</span></div> : null}
                    </div>
                    <h3 className={cn('font-bold transition-colors line-clamp-2 flex-grow', getThemeClass('text-gray-900 group-hover:text-blue-600', 'text-white group-hover:text-blue-400'), viewMode === 'grid' ? 'text-xl' : 'text-lg')}>
                      {result.name}
                    </h3>
                    <p className={cn('my-2 line-clamp-2 text-sm', getThemeClass('text-gray-600', 'text-gray-400'))}>
                      {result.description}
                    </p>
                    <div className={cn('space-y-2 text-sm mt-auto pt-2 border-t', getThemeClass('border-gray-200', 'border-gray-700/50'))}>
                      <div className={cn('flex items-center', getThemeClass('text-gray-700', 'text-gray-300'))}>
                        <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                        <span className="font-medium">{format(new Date(result.date), 'dd/MM/yyyy • HH:mm')}</span>
                      </div>
                      {result.location && (
                        <div className={cn('flex items-center', getThemeClass('text-gray-700', 'text-gray-300'))}>
                          <MapPin className="h-4 w-4 mr-2 text-green-500" />
                          <span className="truncate">{result.location}</span>
                        </div>
                      )}
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