import { useEffect, useState } from 'react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableFooter,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
} from '@/components/ui/pagination';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import { getPendingNews } from '@/services/Admin/news.service';
import { getUserByIdAPI } from '@/services/Admin/user.service';
import { connectNewsHub, onNews } from '@/services/signalr.service';
import type { News, NewsListResponse } from '@/types/Admin/news';
import { FaEye } from 'react-icons/fa';
import PendingNewsDetailModal from './PendingNewsDetailModal';

const pageSizeOptions = [5, 10, 20, 50];

export const PendingNewsList = ({
  onChangePending,
  activeTab,
}: {
  onChangePending?: () => void;
  activeTab: string;
}) => {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedNews, setSelectedNews] = useState<News | null>(null);
  const [authorNames, setAuthorNames] = useState<Record<string, string>>({});

  const fetchData = () => {
    setLoading(true);
    getPendingNews(page, pageSize)
      .then((res: NewsListResponse) => {
        if (res && res.data && Array.isArray(res.data.items)) {
          setNews(res.data.items);
          setTotalItems(res.data.totalItems);
          setTotalPages(res.data.totalPages);
        } else {
          setNews([]);
          setTotalItems(0);
          setTotalPages(1);
        }
      })
      .finally(() => setTimeout(() => setLoading(false), 500));
  };

  useEffect(() => {
    if (activeTab !== 'pending') return;
    connectNewsHub('http://localhost:5004/newsHub');
    // Lắng nghe realtime SignalR cho news
    const reload = () => {
      fetchData();
      if (onChangePending) {
        setTimeout(() => onChangePending(), 600);
      }
    };
    onNews('OnNewsCreated', reload);
    onNews('OnNewsUpdated', reload);
    onNews('OnNewsDeleted', reload);
    onNews('OnNewsApproved', reload);
    onNews('OnNewsRejected', reload);
    onNews('OnNewsHidden', reload);
    onNews('OnNewsUnhidden', reload);
  }, [activeTab]);

  // Load data when component mounts, activeTab changes, or pagination changes
  useEffect(() => {
    if (activeTab !== 'pending') return;
    fetchData();
  }, [activeTab, page, pageSize]);

  useEffect(() => {
    const fetchAuthors = async () => {
      const ids = Array.from(new Set(news.map((n) => n.authorId).filter(Boolean)));
      const names: Record<string, string> = {};
      await Promise.all(
        ids.map(async (id) => {
          try {
            const res = await getUserByIdAPI(id);
            names[id] = res.fullName || id;
          } catch {
            names[id] = id;
          }
        })
      );
      setAuthorNames(names);
    };
    if (news.length > 0) fetchAuthors();
  }, [news]);

  const reloadList = () => {
    fetchData();
    if (onChangePending) {
      setTimeout(() => {
        onChangePending();
      }, 600); // đảm bảo gọi sau khi fetchData hoàn thành
    }
  };

  const filteredNews = news.filter(
    (item) => !search || item.newsTitle.toLowerCase().includes(search.trim().toLowerCase())
  );
  const pagedNews = filteredNews;

  return (
    <div className="p-3">
      <SpinnerOverlay show={loading} />
      <div className="overflow-x-auto">
        <div className="p-4 bg-white rounded-xl shadow">
          {/* Search */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
            <div className="flex-1 flex items-center gap-2">
              <div
                className="InputContainer relative"
                style={{
                  width: 310,
                  height: 50,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(to bottom, #c7eafd, #e0e7ff)',
                  borderRadius: 30,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: '2px 2px 10px rgba(0,0,0,0.075)',
                  position: 'relative',
                }}
              >
                <input
                  className="input pr-8"
                  style={{
                    width: 300,
                    height: 40,
                    border: 'none',
                    outline: 'none',
                    caretColor: 'rgb(255,81,0)',
                    backgroundColor: 'rgb(255,255,255)',
                    borderRadius: 30,
                    paddingLeft: 15,
                    letterSpacing: 0.8,
                    color: 'rgb(19,19,19)',
                    fontSize: 13.4,
                  }}
                  placeholder="Search by news title..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
                {search && (
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-red-500 hover:text-red-600 focus:outline-none bg-white rounded-full"
                    style={{
                      border: 'none',
                      outline: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      height: 24,
                      width: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onClick={() => {
                      setSearch('');
                      setPage(1);
                    }}
                    tabIndex={-1}
                    type="button"
                    aria-label="Clear search"
                  >
                    &#10005;
                  </button>
                )}
              </div>
            </div>
          </div>
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="bg-yellow-200 hover:bg-yellow-200">
                <TableHead className="text-center" style={{ width: '5%' }}>
                  #
                </TableHead>
                <TableHead style={{ width: '25%' }}>Title</TableHead>
                <TableHead style={{ width: '15%' }}>Author Name</TableHead>
                <TableHead className="text-center" style={{ width: '15%' }}>
                  Created At
                </TableHead>
                <TableHead className="text-center" style={{ width: '15%' }}>
                  Updated At
                </TableHead>

                <TableHead className="text-center" style={{ width: '15%' }}>
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedNews.length === 0 ? (
                <>
                  {/* Show 5 empty rows when no data */}
                  {Array.from({ length: 5 }, (_, idx) => (
                    <TableRow key={`empty-${idx}`} className="h-[56.8px]">
                      <TableCell colSpan={6} className="border-0"></TableCell>
                    </TableRow>
                  ))}
                </>
              ) : (
                <>
                  {pagedNews.map((item, idx) => (
                    <TableRow key={item.newsId} className="hover:bg-yellow-50">
                      <TableCell className="text-center">
                        {(page - 1) * pageSize + idx + 1}
                      </TableCell>
                      <TableCell className="truncate max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap">
                        {item.newsTitle}
                      </TableCell>
                      <TableCell className="truncate max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap">
                        {item.newsContent}
                      </TableCell>
                      <TableCell className="text-center">
                        {authorNames[item.authorId] || item.authorId || 'Unknown'}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Unknown'}
                      </TableCell>
                      <TableCell className="text-center flex items-center justify-center gap-2">
                        <button
                          className="border-2 border-yellow-400 bg-yellow-400 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white flex items-center justify-center hover:bg-yellow-500 hover:text-white"
                          title="View details"
                          onClick={() => setSelectedNews(item)}
                        >
                          <FaEye className="w-4 h-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Add empty rows to maintain table height */}
                  {Array.from({ length: Math.max(0, 5 - pagedNews.length) }, (_, idx) => (
                    <TableRow key={`empty-${idx}`} className="h-[56.8px]">
                      <TableCell colSpan={6} className="border-0"></TableCell>
                    </TableRow>
                  ))}
                </>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={7}>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 px-2 py-2">
                    <div className="flex-1 flex justify-center pl-[200px]">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => setPage((p) => Math.max(1, p - 1))}
                              aria-disabled={page === 1}
                              className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                            />
                          </PaginationItem>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((i) => (
                            <PaginationItem key={i}>
                              <PaginationLink
                                isActive={i === page}
                                onClick={() => setPage(i)}
                                className={`transition-colors rounded 
                                  ${
                                    i === page
                                      ? 'bg-yellow-400 text-white border hover:bg-yellow-500 hover:text-white'
                                      : 'text-gray-700 hover:bg-yellow-100 hover:text-black'
                                  }
                                  px-2 py-1 mx-0.5`}
                              >
                                {i}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          <PaginationItem>
                            <PaginationNext
                              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                              aria-disabled={page === totalPages}
                              className={
                                page === totalPages ? 'pointer-events-none opacity-50' : ''
                              }
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                    <div className="flex items-center gap-2 justify-end w-full md:w-auto">
                      <span className="text-sm text-gray-700">
                        {totalItems === 0
                          ? '0-0 of 0'
                          : `${(page - 1) * pageSize + 1}-${Math.min(
                              page * pageSize,
                              totalItems
                            )} of ${totalItems}`}
                      </span>
                      <span className="text-sm text-gray-700">Rows per page</span>
                      <select
                        className="flex items-center gap-1 px-2 py-1 border rounded text-sm bg-white hover:bg-gray-100 transition min-w-[48px] text-left"
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setPage(1);
                        }}
                      >
                        {pageSizeOptions.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
          {selectedNews && (
            <PendingNewsDetailModal
              news={selectedNews}
              authorName={authorNames[selectedNews.authorId] || selectedNews.authorId || 'unknown'}
              onClose={() => setSelectedNews(null)}
              onActionDone={reloadList}
            />
          )}
        </div>
      </div>
    </div>
  );
};
