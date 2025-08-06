import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getAllNewsHome } from '@/services/Event Manager/event.service';
import { connectNewsHub, onNews, disconnectNewsHub } from '@/services/signalr.service';
import { News } from '@/types/event';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import FilterComponent, { FilterOptions } from '@/components/FilterComponent';
import { Link } from 'react-router-dom';

const PAGE_SIZE = 8;
const BG_GRADIENTS = [
  'from-pink-500/30 to-purple-500/30',
  'from-blue-500/30 to-cyan-500/30',
  'from-yellow-400/30 to-pink-400/30',
  'from-green-400/30 to-blue-400/30',
  'from-purple-500/30 to-indigo-500/30',
];

function getGradient(idx: number) {
  return BG_GRADIENTS[idx % BG_GRADIENTS.length];
}

const NewsAll: React.FC = () => {
  const { t } = useTranslation();
  const [newsList, setNewsList] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const navigate = useNavigate();

  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    dateRange: 'all',
    location: '',
    sortBy: 'date',
    sortOrder: 'desc'
  });

  const fetchNews = async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await getAllNewsHome(pageNum, PAGE_SIZE);
      const items = res.data?.data?.items || [];
      setNewsList(items);
      setTotalPages(res.data?.data?.totalPages || 1);
    } catch {
      setNewsList([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // Get unique authors for filter
  const authors = useMemo(() => {
    const authorSet = new Set<string>();
    newsList.forEach(news => {
      if (news.authorId) {
        authorSet.add(news.authorId);
      }
    });
    return Array.from(authorSet).map(author => ({
      value: author,
      label: author
    }));
  }, [newsList]);

  // Apply filters to news
  const filteredNews = useMemo(() => {
    return newsList
      .filter(news => {
        // Filter by search term
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase();
          if (!news.newsTitle.toLowerCase().includes(searchLower) && 
              !news.newsDescription.toLowerCase().includes(searchLower)) {
            return false;
          }
        }

        // Filter by date range
        const newsDate = new Date(news.createdAt);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        switch (filters.dateRange) {
          case 'today':
            return newsDate.toDateString() === today.toDateString();
          case 'week':
            const lastWeek = new Date(today);
            lastWeek.setDate(lastWeek.getDate() - 7);
            return newsDate >= lastWeek;
          case 'month':
            const lastMonth = new Date(today);
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            return newsDate >= lastMonth;
          case 'upcoming':
            return newsDate > today;
          default:
            return true;
        }
      })
      .sort((a, b) => {
        // Sort by date by default
        if (filters.sortBy === 'date') {
          return filters.sortOrder === 'asc' 
            ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        // Sort by name if needed
        return filters.sortOrder === 'asc'
          ? a.newsTitle.localeCompare(b.newsTitle)
          : b.newsTitle.localeCompare(a.newsTitle);
      });
  }, [newsList, filters]);

  // Connect to NewsHub for real-time updates
  useEffect(() => {
    connectNewsHub('http://localhost:5004/newsHub');
    
    // Listen for real-time news updates
    const reloadNews = () => {
      fetchNews(page);
    };
    
    const reloadFromFirst = () => {
      fetchNews(1);
      setPage(1);
    };
    
    onNews('OnNewsCreated', reloadFromFirst);
    onNews('OnNewsUpdated', reloadNews);
    onNews('OnNewsApproved', reloadNews);
    onNews('OnNewsDeleted', reloadNews);
    onNews('OnNewsRejected', reloadNews);
    onNews('OnNewsHidden', reloadNews);
    onNews('OnNewsUnhidden', reloadNews);
    
    // Initial data load
    fetchNews(page);
    
    // Cleanup
    return () => {
      disconnectNewsHub();
    };
  }, [page]);

  const getImageUrl = (news: News) => {
    // Return the image URL if it exists, otherwise use a placeholder
    if (news.imageUrl) {
      return news.imageUrl;
    }
    // Fallback to a placeholder if no image URL is provided
    return 'https://via.placeholder.com/600x400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          {t('news.title')}
        </h1>

        {/* Filter Component */}
        <FilterComponent
          filters={filters}
          onFilterChange={(newFilters) => setFilters(newFilters as FilterOptions)}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          locations={Array.from(new Set(newsList.filter(n => n.eventLocation).map(n => n.eventLocation as string)))}
          showLocationFilter={true}
          contentType="tin tức"
          resultsCount={{ total: newsList.length }}
          className="mb-8"
        />

        {/* News Grid/List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400"></div>
          </div>
        ) : newsList.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            {t('news.noNewsFound')}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {newsList.map((news, idx) => (
              <motion.div
                key={news.newsId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="bg-gray-800/50 backdrop-blur-lg rounded-xl overflow-hidden border border-gray-700 hover:border-cyan-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10"
              >
                <Link to={`/news/${news.newsId}`} className="block h-full">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={getImageUrl(news)}
                      alt={news.newsTitle}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = 'https://via.placeholder.com/600x400';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-sm text-cyan-400 mb-2">
                      <span>{news.createdAt ? new Date(news.createdAt).toLocaleDateString('vi-VN') : ''}</span>
                      {news.eventLocation && (
                        <>
                          <span className="text-gray-500">•</span>
                          <span className="flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                              <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            {news.eventLocation}
                          </span>
                        </>
                      )}
                    </div>
                    <h3 className="text-xl font-bold mb-2 line-clamp-2 hover:text-cyan-400 transition-colors">
                      {news.newsTitle}
                    </h3>
                    <p className="text-gray-300 text-sm line-clamp-3">
                      {news.newsDescription || news.newsContent?.substring(0, 150) + '...'}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {newsList.map((news, idx) => (
              <motion.div
                key={news.newsId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="bg-gray-800/50 backdrop-blur-lg rounded-xl overflow-hidden border border-gray-700 hover:border-cyan-400/50 transition-all duration-300"
              >
                <Link to={`/news/${news.newsId}`} className="block h-full">
                  <div className="md:flex">
                    <div className="md:w-1/3 h-48 md:h-auto">
                      <img
                        src={getImageUrl(news)}
                        alt={news.newsTitle}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = 'https://via.placeholder.com/600x400';
                        }}
                      />
                    </div>
                    <div className="p-6 md:w-2/3">
                      <h3 className="text-xl font-bold mb-2 hover:text-cyan-400 transition-colors">
                        {news.newsTitle}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-cyan-400 mb-3">
                        <span>{news.createdAt ? new Date(news.createdAt).toLocaleDateString('vi-VN') : ''}</span>
                        {news.eventLocation && (
                          <>
                            <span className="text-gray-500">•</span>
                            <span className="flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                              </svg>
                              {news.eventLocation}
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-gray-300 text-sm line-clamp-3">
                        {news.newsDescription || news.newsContent?.substring(0, 150) + '...'}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-12">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
              >
                Trước
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        page === pageNum
                          ? 'bg-cyan-500 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      } transition-colors`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
              >
                Tiếp
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsAll;