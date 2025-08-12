import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import useDebounce from '@/hooks/useDebounce';
import FilterComponent, { FilterOptions } from '@/components/FilterComponent';
import AppPagination from '@/components/ui/AppPagination';
import NoResults from '@/components/common/NoResults';
import { searchNewsAPI, News } from '@/services/search.service';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { cn } from '@/lib/utils';
import { NO_IMAGE } from '@/assets/img';
import { Calendar, User } from 'lucide-react';

const PAGE_SIZE = 12;

const PageHeader = ({ title, subtitle }: { title: string; subtitle: string; }) => {
    const { getThemeClass } = useThemeClasses();
    return (
        <div className="text-center pt-24 pb-12">
            <h1 className={cn('text-4xl md:text-5xl font-extrabold tracking-tight mb-4', getThemeClass('text-gray-900', 'text-white'))}>{title}</h1>
            <p className={cn('text-lg max-w-2xl mx-auto', getThemeClass('text-gray-600', 'text-gray-300'))}>{subtitle}</p>
        </div>
    );
};
const NewsCardSkeleton = () => ( <div className="animate-pulse rounded-2xl bg-white dark:bg-gray-800 h-[400px]"></div> );

const NewsAll: React.FC = () => {
  const { t } = useTranslation();
  const { getThemeClass } = useThemeClasses();
  const [newsList, setNewsList] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    authorFullName: '',
    location: '',
    sortBy: 'date',
    sortOrder: 'desc',
    categoryIds: [],
  });
  
  const debouncedFilters = useDebounce(filters, 500);

  useEffect(() => {
    const loadNews = async () => {
      setLoading(true);
      try {
        const { news, totalCount } = await searchNewsAPI({ ...debouncedFilters, page: currentPage, pageSize: PAGE_SIZE });
        setNewsList(news);
        setTotalPages(Math.ceil(totalCount / PAGE_SIZE) || 1);
      } finally { setLoading(false); }
    };
    loadNews();
  }, [debouncedFilters, currentPage]);

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handlePageChange = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [totalPages]);

  return (
    <div className={cn('min-h-screen', getThemeClass('bg-gray-100', 'bg-gray-900'))}>
      <div className="container mx-auto px-4 py-8">
        <PageHeader title={t('allNewsTitle')} subtitle={t('allNewsSubtitle')} />
        <div className="mb-8">
          <FilterComponent
            filters={filters}
            onFilterChange={handleFilterChange}
            showAuthorFilter={true}
          />
        </div>
        
        {loading ? (
          <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
             {Array.from({ length: PAGE_SIZE }).map((_, i) => <NewsCardSkeleton key={i} />)}
          </div>
        ) : newsList.length === 0 ? (
          <NoResults />
        ) : (
          <>
            <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {newsList.map((news) => <NewsCard key={news.newsId} news={news} />)}
            </div>
             <AppPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
          </>
        )}
      </div>
    </div>
  );
};

const NewsCard = React.memo(({ news }: { news: News }) => {
    return (
        <Link 
            to={`/news/${news.newsId}`} 
            className="block group bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 cursor-pointer flex flex-col h-full"
        >
            <div className="relative h-56 w-full overflow-hidden rounded-t-2xl">
                <img src={news.imageUrl || NO_IMAGE} alt={news.newsTitle} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
            </div>
            <div className="p-5 flex flex-col flex-grow">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-2 mb-2 group-hover:text-blue-600 dark:group-hover:text-purple-400 transition-colors">{news.newsTitle}</h3>
                <p className="text-gray-600 dark:text-gray-400 line-clamp-3 text-sm flex-grow">{news.newsDescription}</p>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 space-y-2">
                    <div className="flex items-center"><Calendar className="h-4 w-4 mr-2" /><span>{new Date(news.createdAt).toLocaleDateString('vi-VN')}</span></div>
                    {news.authorFullName && <div className="flex items-center"><User className="h-4 w-4 mr-2" /><span>{news.authorFullName}</span></div>}
                </div>
            </div>
        </Link>
    );
});

export default NewsAll;