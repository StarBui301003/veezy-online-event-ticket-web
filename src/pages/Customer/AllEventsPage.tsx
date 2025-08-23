import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, MapPin } from 'lucide-react';
import useDebounce from '@/hooks/useDebounce';
import FilterComponent, { FilterOptions } from '@/components/FilterComponent';
import AppPagination from '@/components/ui/AppPagination';
import NoResults from '@/components/common/NoResults';
import { searchEventsAPI, Event, getAllCategoriesAPI, Category } from '@/services/search.service';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';
import { NO_IMAGE } from '@/assets/img';

const PAGE_SIZE = 12;

const PageHeader = ({ title, subtitle }: { title: string; subtitle: string }) => {
  const { getThemeClass } = useThemeClasses();
  return (
    <div className="text-center sm:pt-24 pt-10 pb-12">
      <h1
        className={cn(
          'text-4xl md:text-5xl font-extrabold tracking-tight mb-4',
          getThemeClass('text-gray-900', 'text-white')
        )}
      >
        {title}
      </h1>
      <p
        className={cn('text-lg max-w-2xl mx-auto', getThemeClass('text-gray-600', 'text-gray-300'))}
      >
        {subtitle}
      </p>
    </div>
  );
};
const EventCardSkeleton = () => (
  <div className="animate-pulse rounded-2xl bg-white dark:bg-gray-800 h-[320px]"></div>
);

const AllEventsPage = () => {
  const { t } = useTranslation();
  const { getThemeClass } = useThemeClasses();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [allLocations, setAllLocations] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    location: '',
    sortBy: 'date',
    sortOrder: 'desc',
    categoryIds: [],
    authorFullName: '',
  });

  const debouncedFilters = useDebounce(filters, 500);

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      try {
        const { events: fetchedEvents, totalCount } = await searchEventsAPI({
          ...debouncedFilters,
          page: currentPage,
          pageSize: PAGE_SIZE,
        });
        setEvents(fetchedEvents);
        setTotalPages(Math.max(1, Math.ceil(totalCount / PAGE_SIZE)));
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, [debouncedFilters, currentPage]);

  useEffect(() => {
    const fetchFilterData = async () => {
      const { events: allEvents } = await searchEventsAPI({ pageSize: 100 });
      const locationSet = new Set<string>(
        allEvents.map((e) => e.location).filter(Boolean) as string[]
      );
      setAllLocations(Array.from(locationSet).sort());
      const categories = await getAllCategoriesAPI();
      setAllCategories(categories);
    };
    fetchFilterData();
  }, []);

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

  const locationOptions = useMemo(
    () => allLocations.map((loc) => ({ value: loc, label: loc })),
    [allLocations]
  );
  const categoryOptions = useMemo(
    () => allCategories.map((cat) => ({ value: cat.categoryId, label: cat.categoryName })),
    [allCategories]
  );

  return (
    <div className={cn('min-h-screen', getThemeClass('bg-gray-100', 'bg-gray-900'))}>
      <div className="container mx-auto px-4 py-8">
        <PageHeader title={t('allEvents.pageTitle')} subtitle={t('allEvents.pageSubtitle')} />
        <div className="mb-8">
          <FilterComponent
            filters={filters}
            onFilterChange={handleFilterChange}
            locations={locationOptions}
            categories={categoryOptions}
            showLocationFilter={true}
            showCategoryFilter={true}
          />
        </div>

        {loading ? (
          <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        ) : events.length > 0 ? (
          <>
            <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
            <AppPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        ) : (
          <NoResults />
        )}
      </div>
    </div>
  );
};

const EventCard = React.memo(({ event }: { event: Event }) => {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/event/${event.id}`)}
      className="group bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 cursor-pointer flex flex-col h-full"
    >
      <div className="relative h-48 w-full overflow-hidden rounded-t-2xl">
        <img
          src={event.coverImageUrl || NO_IMAGE}
          alt={event.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-2 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {event.name}
        </h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mt-auto">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-blue-500" />
            <span>{new Date(event.startAt).toLocaleDateString('vi-VN')}</span>
          </div>
          {event.location && (
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-green-500" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default AllEventsPage;
