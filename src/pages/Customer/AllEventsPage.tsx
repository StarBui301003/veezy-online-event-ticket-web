import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHomeEvents } from '@/services/Event Manager/event.service';
import { connectEventHub, onEvent } from '@/services/signalr.service';
import { StageBackground } from '@/components/StageBackground';
import { useTranslation } from 'react-i18next';
import FilterComponent, { FilterOptions } from '@/components/FilterComponent';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';

export interface Event {
  eventId: string;
  eventName: string;
  eventCoverImageUrl: string;
  startAt: string;
  endAt: string;
  eventLocation: string;
  isApproved: number;
  isCancelled: boolean;
  isActive: boolean;
  description: string;
  isFree: boolean;
}

type ViewMode = 'grid' | 'list';

const AllEventsPage = () => {
  const { t } = useTranslation();
  const { getThemeClass } = useThemeClasses();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    dateRange: 'all',
    location: '',
    sortBy: 'date',
    sortOrder: 'desc',
  });

  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Function to reload events
  const reloadEvents = () => {
    setLoading(true);
    getHomeEvents()
      .then((fetchedEvents) => {
        const activeEvents = (fetchedEvents || []).filter(
          (event) => event.isActive !== false && !event.isCancelled
        );
        setEvents(activeEvents);
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  };

  // Connect to EventHub for real-time updates
  useEffect(() => {
    connectEventHub('http://localhost:5004/notificationHub');

    // Listen for real-time event updates
    onEvent('EventCreated', () => {
      reloadEvents();
    });

    onEvent('EventUpdated', () => {
      reloadEvents();
    });

    onEvent('EventApproved', () => {
      reloadEvents();
    });

    onEvent('EventCancelled', () => {
      reloadEvents();
    });

    // Initial data load
    reloadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get unique locations for filter
  const locations = useMemo(() => {
    return [...new Set(events.map((event) => event.eventLocation).filter(Boolean))] as string[];
  }, [events]);

  // Apply filters to events
  const filteredEvents = useMemo(() => {
    let result = [...events];

    // Search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      result = result.filter(
        (event) =>
          event.eventName.toLowerCase().includes(searchLower) ||
          event.eventLocation.toLowerCase().includes(searchLower)
      );
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      switch (filters.dateRange) {
        case 'today': {
          result = result.filter((event) => {
            const eventDate = new Date(event.startAt);
            const eventDay = new Date(
              eventDate.getFullYear(),
              eventDate.getMonth(),
              eventDate.getDate()
            );
            return eventDay.getTime() === today.getTime();
          });
          break;
        }
        case 'week': {
          const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          result = result.filter((event) => {
            const eventDate = new Date(event.startAt);
            return eventDate >= today && eventDate <= weekFromNow;
          });
          break;
        }
        case 'month': {
          const monthFromNow = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
          result = result.filter((event) => {
            const eventDate = new Date(event.startAt);
            return eventDate >= today && eventDate <= monthFromNow;
          });
          break;
        }
      }
    }

    // Location filter
    if (filters.location) {
      result = result.filter((event) =>
        event.eventLocation.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Sort events
    result.sort((a, b) => {
      const aValue = a[filters.sortBy as keyof Event];
      const bValue = b[filters.sortBy as keyof Event];

      if (filters.sortBy === 'date') {
        const aDate = new Date(a.startAt);
        const bDate = new Date(b.startAt);
        return filters.sortOrder === 'asc'
          ? aDate.getTime() - bDate.getTime()
          : bDate.getTime() - aDate.getTime();
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return filters.sortOrder === 'asc' ? comparison : -comparison;
      }

      return 0;
    });

    return result;
  }, [events, filters]);

  const getGradient = (index: number) => {
    const gradients = [
      'from-pink-500/20 to-purple-500/20',
      'from-cyan-500/20 to-blue-500/20',
      'from-yellow-500/20 to-orange-500/20',
      'from-green-500/20 to-teal-500/20',
      'from-purple-500/20 to-indigo-500/20',
      'from-red-500/20 to-pink-500/20',
    ];
    return gradients[index % gradients.length];
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={cn(
        'relative min-h-screen w-full',
        getThemeClass(
          'bg-gradient-to-r from-blue-500 to-cyan-400',
          'bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900'
        )
      )}
    >
      <StageBackground />
      <div className="relative z-10">
        {/* Header */}
        <div className="text-center pt-40 pb-10 overflow-visible">
          <h1
            className={cn(
              'text-5xl md:text-6xl font-extrabold leading-[1.2] py-4 font-sans bg-gradient-to-r from-pink-400 via-cyan-400 to-yellow-200 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(255,255,255,0.5)] animate-titleGlow mb-4 overflow-visible',
              getThemeClass(
                'bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600',
                'bg-gradient-to-r from-pink-400 via-cyan-400 to-yellow-200'
              )
            )}
          >
            {t('allEventsTitle')}
          </h1>
          {/* Music Visualizer */}
          <div className="flex justify-center gap-1 mb-8 music-visualizer">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  'bar rounded animate-musicBar',
                  getThemeClass(
                    'bg-gradient-to-t from-blue-400 to-cyan-400',
                    'bg-gradient-to-t from-pink-400 to-cyan-400'
                  )
                )}
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>

        {/* Filter Component */}
        <FilterComponent
          filters={filters}
          onFilterChange={(newFilters) => setFilters(newFilters as FilterOptions)}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          locations={locations}
          showLocationFilter={true}
          contentType="sự kiện"
          resultsCount={{ total: filteredEvents.length }}
        />

        {/* Events Grid */}
        <div
          className={`px-4 pb-20 max-w-7xl mx-auto ${
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-6'
          }`}
        >
          {loading ? (
            <div
              className={cn(
                'col-span-full text-center text-2xl py-20 animate-pulse',
                getThemeClass('text-blue-600', 'text-pink-400')
              )}
            >
              {t('loadingEvents')}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div
              className={cn(
                'col-span-full text-center text-lg py-20',
                getThemeClass('text-gray-600', 'text-gray-400')
              )}
            >
              {filters.searchTerm || filters.dateRange !== 'all' || filters.location
                ? 'Không tìm thấy sự kiện phù hợp với bộ lọc'
                : t('noApprovedEvents')}
            </div>
          ) : (
            filteredEvents.map((event, idx) => (
              <motion.div
                key={event.eventId}
                className={cn(
                  'backdrop-blur-xl rounded-2xl border shadow-xl overflow-hidden relative transition-all duration-400 hover:scale-[1.02] hover:shadow-2xl cursor-pointer',
                  getThemeClass(
                    'bg-white/95 border-gray-200 hover:border-gray-300',
                    'border-white/20 hover:border-white/40'
                  ),
                  viewMode === 'grid' ? 'h-full flex flex-col' : 'grid grid-cols-3 gap-6 p-6'
                )}
                style={
                  viewMode === 'grid'
                    ? ({
                        background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                        '--tw-gradient-from': `var(--tw-gradient-to, rgba(236, 72, 153, 0.1))`,
                        '--tw-gradient-to': `var(--tw-gradient-to, rgba(168, 85, 247, 0.1))`,
                        ...(viewMode === 'grid' && {
                          '--tw-gradient-to': `var(--tw-gradient-to, ${
                            getGradient(idx).split(' ')[1]
                          })`,
                        }),
                      } as React.CSSProperties)
                    : {}
                }
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
                whileHover={{
                  boxShadow: getThemeClass(
                    '0 8px 32px 0 rgba(0,0,0,0.1)',
                    '0 8px 32px 0 rgba(0,0,0,0.18)'
                  ),
                }}
              >
                <Link to={`/event/${event.eventId}`} className="block h-full w-full">
                  {viewMode === 'grid' ? (
                    <>
                      {/* Image */}
                      <div className="relative w-full h-60">
                        <img
                          src={
                            event.eventCoverImageUrl ||
                            'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
                          }
                          alt={event.eventName}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      </div>

                      {/* Content */}
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex-1">
                          <h2
                            className={cn(
                              'text-2xl font-bold mb-2 group-hover:transition-colors duration-200',
                              getThemeClass(
                                'text-gray-900 group-hover:text-blue-700',
                                'text-white group-hover:text-cyan-300'
                              )
                            )}
                          >
                            {event.eventName}
                          </h2>
                          <p
                            className={cn(
                              'text-sm mb-4 line-clamp-2',
                              getThemeClass('text-gray-700', 'text-gray-200')
                            )}
                          >
                            {event.description}
                          </p>
                        </div>

                        <div
                          className={cn(
                            'space-y-2 mt-4 pt-4 border-t',
                            getThemeClass('border-gray-200', 'border-white/10')
                          )}
                        >
                          <div
                            className={cn(
                              'flex items-center gap-2 text-sm',
                              getThemeClass('text-gray-600', 'text-gray-300')
                            )}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className={cn(
                                'h-4 w-4 flex-shrink-0',
                                getThemeClass('text-blue-600', 'text-cyan-400')
                              )}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span>
                              {new Date(event.startAt).toLocaleString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className={cn(
                                  'h-4 w-4 flex-shrink-0',
                                  getThemeClass('text-blue-600', 'text-cyan-400')
                                )}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              <span
                                className={cn(
                                  'text-sm',
                                  getThemeClass('text-gray-600', 'text-gray-300')
                                )}
                              >
                                {event.eventLocation || t('tba')}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigate(`/event/${event.eventId}`);
                              }}
                              className={cn(
                                'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                                getThemeClass(
                                  'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white',
                                  'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                                )
                              )}
                            >
                              {t('bookNow')}
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Image for list view */}
                      <div className="col-span-1 w-full h-48 rounded-xl overflow-hidden relative">
                        <img
                          src={
                            event.eventCoverImageUrl ||
                            'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
                          }
                          alt={event.eventName}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      </div>

                      {/* Content for list view */}
                      <div className="col-span-2 flex-1 min-w-0">
                        <h2
                          className={cn(
                            'text-xl font-bold mb-2 group-hover:transition-colors duration-200 line-clamp-1',
                            getThemeClass(
                              'text-gray-900 group-hover:text-blue-700',
                              'text-white group-hover:text-cyan-300'
                            )
                          )}
                        >
                          {event.eventName}
                        </h2>
                        <p
                          className={cn(
                            'text-sm mb-3 line-clamp-2',
                            getThemeClass('text-gray-700', 'text-gray-200')
                          )}
                        >
                          {event.description}
                        </p>

                        {/* Additional metadata for list view */}
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center gap-4 text-xs">
                            <div
                              className={cn(
                                'flex items-center gap-1',
                                getThemeClass('text-gray-500', 'text-gray-400')
                              )}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3 w-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span>
                                {new Date(event.startAt).toLocaleString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            {event.eventLocation && (
                              <div
                                className={cn(
                                  'flex items-center gap-1',
                                  getThemeClass('text-gray-500', 'text-gray-400')
                                )}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-3 w-3"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                </svg>
                                <span className="truncate">{event.eventLocation}</span>
                              </div>
                            )}
                            <div
                              className={cn(
                                'flex items-center gap-1',
                                getThemeClass('text-gray-500', 'text-gray-400')
                              )}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3 w-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span>
                                {new Date(event.endAt).toLocaleString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <div
                              className={cn(
                                'flex items-center gap-1',
                                getThemeClass('text-gray-500', 'text-gray-400')
                              )}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3 w-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span>{event.isFree ? 'Miễn phí' : 'Có phí'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div
                              className={cn(
                                'flex items-center gap-2 text-sm',
                                getThemeClass('text-gray-600', 'text-gray-300')
                              )}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className={cn(
                                  'h-4 w-4 flex-shrink-0',
                                  getThemeClass('text-blue-600', 'text-cyan-400')
                                )}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span>
                                {new Date(event.startAt).toLocaleString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className={cn(
                                  'h-4 w-4 flex-shrink-0',
                                  getThemeClass('text-blue-600', 'text-cyan-400')
                                )}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              <span
                                className={cn(
                                  'text-sm',
                                  getThemeClass('text-gray-600', 'text-gray-300')
                                )}
                              >
                                {event.eventLocation || t('tba')}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              navigate(`/event/${event.eventId}`);
                            }}
                            className={cn(
                              'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                              getThemeClass(
                                'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white',
                                'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                              )
                            )}
                          >
                            {t('bookNow')}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Custom CSS for animation */}
      <style>{`
        @keyframes titleGlow {
          0% { filter: drop-shadow(0 0 10px rgba(255,107,107,0.7)); }
          50% { filter: drop-shadow(0 0 20px rgba(78,205,196,0.7)); }
          100% { filter: drop-shadow(0 0 15px rgba(69,183,209,0.7)); }
        }
        .animate-titleGlow { animation: titleGlow 4s ease-in-out infinite alternate; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px);}
          to { opacity: 1; transform: translateY(0);}
        }
        .animate-fadeInUp { animation: fadeInUp 1s ease-out 0.5s both;}
        @keyframes musicBar {
          0% { height: 10px; opacity: 0.6;}
          100% { height: 60px; opacity: 1;}
        }
        .music-visualizer .bar { width: 4px; border-radius: 2px; animation: musicBar 1s ease-in-out infinite alternate;}
        @keyframes cardFloat {
          0%,100% { transform: translateY(0px);}
          50% { transform: translateY(-15px);}
        }
        .animate-cardFloat { animation: cardFloat 8s ease-in-out infinite;}
        .event-card:hover .play-overlay { opacity: 1;}
        .play-icon { width: 0; height: 0; border-left: 15px solid white; border-top: 10px solid transparent; border-bottom: 10px solid transparent; margin-left: 3px;}
      `}</style>
    </motion.div>
  );
};

export default AllEventsPage;
