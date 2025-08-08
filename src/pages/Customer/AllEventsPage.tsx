/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, MapPin, Frown } from 'lucide-react';

import FilterComponent, { FilterOptions } from '@/components/FilterComponent';
// FIX: Import Event và PaginatedEventsResponse từ service
import { searchEventsAPI, Event } from '@/services/search.service';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';
import { NO_IMAGE } from '@/assets/img';

type ViewMode = 'grid' | 'list';
const PAGE_SIZE = 12;

// ... (Các component con như formatDate, getImageUrl, EventCardSkeleton, NoResults giữ nguyên) ...
const formatDate = (dateString?: string | Date): string => {
  if (!dateString) return 'Ngày đang cập nhật';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Ngày không hợp lệ';
    return date.toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'Ngày đang cập nhật';
  }
};
const getImageUrl = (imageUrl?: string): string => imageUrl || NO_IMAGE;
const EventCardSkeleton = ({ viewMode }: { viewMode: ViewMode }) => (
  <div
    className={`animate-pulse ${
      viewMode === 'list' ? 'flex flex-col md:flex-row' : 'flex flex-col h-full'
    } rounded-xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700`}
  >
    {' '}
    <div
      className={`${
        viewMode === 'list' ? 'md:w-1/3 h-48 md:h-auto' : 'aspect-video'
      } bg-gray-300 dark:bg-gray-700`}
    ></div>{' '}
    <div className="p-4 flex-1 space-y-3">
      {' '}
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>{' '}
      <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-4/5"></div>{' '}
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>{' '}
      <div className="h-9 bg-gray-300 dark:bg-gray-700 rounded mt-4"></div>{' '}
    </div>{' '}
  </div>
);
const NoResults = () => {
  const { t } = useTranslation();
  const { getThemeClass } = useThemeClasses();
  return (
    <div
      className={cn(
        'text-center py-16 px-6 rounded-lg',
        getThemeClass('bg-gray-50', 'bg-gray-800')
      )}
    >
      <Frown className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className={cn('mt-4 text-lg font-medium', getThemeClass('text-gray-900', 'text-white'))}>
        {t('allEvents.noEventsFound')}
      </h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {t('allEvents.noEventsDescription')}
      </p>
    </div>
  );
};

const AllEventsPage = () => {
  const { t } = useTranslation();
  const { getThemeClass } = useThemeClasses();

  // State vẫn giữ nguyên, nhưng bây giờ chúng sẽ được cập nhật đúng cách
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '', dateRange: 'all', location: '', sortBy: 'date', sortOrder: 'desc',
  });

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const { events, totalCount } = await searchEventsAPI({
          ...filters,
          page: currentPage,
          pageSize: PAGE_SIZE,
        });

        setEvents(events);

        // Calculate total pages, ensure at least 1 page
        const calculatedTotalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
        setTotalPages(calculatedTotalPages);

        // Reset to first page if current page exceeds total pages
        if (currentPage > calculatedTotalPages) {
          setCurrentPage(1);
        }
      } catch (err: unknown) {
        console.error('Error loading events:', err);
        setError('Không thể tải danh sách sự kiện. Vui lòng thử lại sau.');
        setEvents([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [filters, currentPage]);

  const handleFilterChange = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [totalPages]
  );

  const locations = useMemo(() => {
    const locationSet = new Set<string>();
    events.forEach((event) => {
      if (event.location) locationSet.add(event.location);
    });
    return Array.from(locationSet).sort();
  }, [events]);

  return (
    <div className={cn('min-h-screen', getThemeClass('bg-gray-50', 'bg-gray-900'))}>
      {/* Header Section */}
      <div
        className="relative bg-cover bg-center py-20 md:py-32"
        style={{ backgroundImage: "url('/path-to-your-header-image.jpg')" }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            {t('allEvents.pageTitle')}
          </h1>
          <p className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto">
            {t('allEvents.pageSubtitle')}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
            <FilterComponent
                filters={filters}
                onFilterChange={handleFilterChange}
                locations={locations}
                contentType="event"
                resultsCount={{ events: events.length }}
            />
        </div>

        {/* Conditional Rendering */}
        {loading ? (
            <div className={`grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`}>
                {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    <EventCardSkeleton key={i} viewMode={'grid'} />
                ))}
            </div>
        ) : error ? (
          <div className="text-center py-16 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p>{t('allEvents.errorLoadingEvents')}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {t('allEvents.reloadPage')}
            </button>
          </div>
        ) : events.length > 0 ? (
            <>
                <div className={`grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`}>
                    {events.map((event) => (
                        <EventCard key={event.id} event={event} viewMode={'grid'} />
                    ))}
                </div>

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        ) : (
          <NoResults />
        )}
      </div>
    </div>
  );
};

const EventCard = React.memo(({ event, viewMode }: { event: Event; viewMode: ViewMode }) => {
  const { t } = useTranslation();
  const { getThemeClass } = useThemeClasses();
  const navigate = useNavigate();

  // Handle click on event card
  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Make sure we have a valid event ID
      if (!event.id) {
        console.error('Event ID is missing');
        return;
      }

      // Navigate to event detail page
      navigate(`/event/${event.id}`);

      // Scroll to top of the page
      window.scrollTo(0, 0);
    },
    [event.id, navigate]
  );

  const cardClasses = cn(
    'flex flex-col rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer',
    getThemeClass('bg-white border border-gray-100', 'bg-gray-800 border-gray-700'),
    viewMode === 'grid' ? 'h-full' : 'md:flex-row'
  );

  return (
    // FIX: onClick trên cả card và button giờ đều dùng chung 1 hàm
    <div className={cardClasses} onClick={handleCardClick}>
      <div
        className={`relative ${
          viewMode === 'grid' ? 'aspect-video' : 'md:w-1/3 h-48 md:h-auto flex-shrink-0'
        }`}
      >
        {/* FIX: Dùng event.coverImageUrl đã được chuẩn hóa */}
        <img
          src={getImageUrl(event.coverImageUrl)}
          alt={event.name}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => (e.currentTarget.src = NO_IMAGE)}
        />
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
          <Calendar className="h-4 w-4 mr-1.5 flex-shrink-0" />
          {/* FIX: Dùng event.startAt đã được chuẩn hóa */}
          <span>{formatDate(event.startAt) || t('allEvents.dateUpdating')}</span>
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2">
          {/* FIX: Dùng event.name đã được chuẩn hóa */}
          {event.name}
        </h3>
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
          <MapPin className="h-4 w-4 mr-1.5 flex-shrink-0" />
          {/* FIX: Dùng event.location đã được chuẩn hóa */}
          <span className="truncate">{event.location || t('allEvents.locationUpdating')}</span>
        </div>
        <div className="mt-auto">
          {/* Nút này cũng kích hoạt hàm handleCardClick của card cha */}
          <button
            className="w-full py-2.5 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/event/${event.id}`);
            }}
          >
            {t('allEvents.viewDetails')}
          </button>
        </div>
      </div>
    </div>
  );
});

// Component Pagination giữ nguyên, nó đã được viết tốt.
const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => {
  const pages = useMemo(() => {
    const delta = 2;
    const left = currentPage - delta;
    const right = currentPage + delta + 1;
    const range = [];
    const rangeWithDots = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= left && i < right)) {
        range.push(i);
      }
    }
    let l;
    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l > 2) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }
    return rangeWithDots;
  }, [currentPage, totalPages]);
  return (
    <nav className="mt-12 flex justify-center items-center gap-2">
      {' '}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 rounded-md disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        &lsaquo;
      </button>{' '}
      {pages.map((page, index) =>
        typeof page === 'number' ? (
          <button
            key={index}
            onClick={() => onPageChange(page)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              currentPage === page
                ? 'bg-blue-600 text-white'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {page}
          </button>
        ) : (
          <span key={index} className="px-4 py-2">
            ...
          </span>
        )
      )}{' '}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 rounded-md disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        &rsaquo;
      </button>{' '}
    </nav>
  );
};

export default AllEventsPage;
