import { useEffect, useState, useRef } from 'react';
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import { getAllApprovedNews } from '@/services/Admin/news.service';
import { hideNews, showNews } from '@/services/Admin/news.service';
import { connectNewsHub, onNews } from '@/services/signalr.service';
import type { News, NewsFilterParams } from '@/types/Admin/news';
import { FaEye, FaFilter, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import ApprovedNewsDetailModal from './ApprovedNewsDetailModal';
import { Switch } from '@/components/ui/switch';
import { toast } from 'react-toastify';

const pageSizeOptions = [5, 10, 20, 50];

export const ApprovedNewsList = ({ activeTab }: { activeTab: string }) => {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedNews, setSelectedNews] = useState<News | null>(null);

  // Search and filter states
  const [approvedNewsSearch, setApprovedNewsSearch] = useState('');
  const [filters, setFilters] = useState<NewsFilterParams>({
    page: 1,
    pageSize: 5,
    sortDescending: true,
  });
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortDescending, setSortDescending] = useState(true);

  // Event and Author filter states
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedAuthorName, setSelectedAuthorName] = useState<string>('');

  // Sync filters.pageSize with pageSize prop
  useEffect(() => {
    setFilters((prev) => ({ ...prev, pageSize }));
  }, [pageSize]);

  // Sync filters.page with page prop
  useEffect(() => {
    setFilters((prev) => ({ ...prev, page }));
  }, [page]);

  // Ensure filters.page is synced on mount
  useEffect(() => {
    setFilters((prev) => ({ ...prev, page: page || 1 }));
  }, []); // Only run once on mount

  // Set default pageSize to 5 on mount if not already set
  useEffect(() => {
    if (pageSize !== 5) {
      setPageSize(5);
    }
  }, []); // Only run once on mount

  const pageRef = useRef(page);
  const pageSizeRef = useRef(pageSize);
  const searchRef = useRef(approvedNewsSearch);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);
  useEffect(() => {
    pageSizeRef.current = pageSize;
  }, [pageSize]);
  useEffect(() => {
    searchRef.current = approvedNewsSearch;
  }, [approvedNewsSearch]);

  // Connect hub chỉ 1 lần khi mount
  useEffect(() => {
    connectNewsHub('http://localhost:5004/newsHub');
    const reload = () => {
      fetchData(pageRef.current, pageSizeRef.current);
    };
    onNews('OnNewsCreated', reload);
    onNews('OnNewsUpdated', reload);
    onNews('OnNewsDeleted', reload);
    onNews('OnNewsApproved', reload);
    onNews('OnNewsRejected', reload);
    onNews('OnNewsHidden', reload);
    onNews('OnNewsUnhidden', reload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = (p = page, ps = pageSize) => {
    setLoading(true);

    // Use current page and pageSize, but reset to page 1 when searching
    const currentPage = approvedNewsSearch ? 1 : p;
    const currentPageSize = ps;

    const filterParams = {
      page: currentPage,
      pageSize: currentPageSize,
      searchTerm: approvedNewsSearch,
      authorFullName: selectedAuthorName || filters.authorFullName,
      eventId: selectedEventId || filters.eventId,
      authorId: filters.authorId,
      sortBy: sortBy || filters.sortBy,
      sortDescending: sortDescending,
    };

    // Debug: Log search parameters
    console.log('🔍 Approved News Search Parameters:', filterParams);

    getAllApprovedNews(filterParams)
      .then(async (res) => {
        if (res && res.data) {
          setNews(res.data.items);
          setTotalItems(res.data.totalItems);
          setTotalPages(res.data.totalPages);
        } else {
          setNews([]);
          setTotalItems(0);
          setTotalPages(1);
        }
      })
      .catch(() => {
        setNews([]);
        setTotalItems(0);
        setTotalPages(1);
      })
      .finally(() => {
        setTimeout(() => setLoading(false), 500);
      });
  };

  // Chỉ gọi fetchData khi [filters, sortBy, sortDescending, approvedNewsSearch, selectedEventId, selectedAuthorName] đổi
  useEffect(() => {
    if (activeTab === 'approved') {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters,
    sortBy,
    sortDescending,
    approvedNewsSearch,
    selectedEventId,
    selectedAuthorName,
    activeTab,
  ]);

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setFilters((prev) => ({ ...prev, page: 1, pageSize: newPageSize }));
    setPageSize(newPageSize);
    setPage(1);
  };

  // Sort handlers
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDescending(!sortDescending);
    } else {
      setSortBy(field);
      setSortDescending(true);
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <FaSort className="w-3 h-3 text-gray-400" />;
    }
    return sortDescending ? (
      <FaSortDown className="w-3 h-3 text-green-600" />
    ) : (
      <FaSortUp className="w-3 h-3 text-green-600" />
    );
  };

  // Filter handlers
  const updateFilter = (key: keyof NewsFilterParams, value: string | string[] | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
    setPage(1);
  };

  // Toggle status handler (giống NewsOwnList)
  const handleToggleStatus = async (item: News) => {
    try {
      if (item.status) {
        await hideNews(item.newsId);
        toast.success('News hidden successfully!');
      } else {
        await showNews(item.newsId);
        toast.success('News shown successfully!');
      }
      fetchData();
    } catch {
      toast.error('Failed to update status!');
    }
  };

  return (
    <div className="p-3">
      <SpinnerOverlay show={loading} />
      <div className="overflow-x-auto">
        <div className="p-4 bg-white rounded-xl shadow">
          {/* Search and Filter UI */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
            {/* Search input (left) */}
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
                  placeholder="Search title, description, content..."
                  value={approvedNewsSearch}
                  onChange={(e) => {
                    setApprovedNewsSearch(e.target.value);
                    // Reset to page 1 when searching
                    setFilters((prev) => ({ ...prev, page: 1 }));
                    setPage(1);
                  }}
                />
                {approvedNewsSearch && (
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
                      setApprovedNewsSearch('');
                      setFilters((prev) => ({ ...prev, page: 1 }));
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

            {/* Filter dropdown (right) */}
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex gap-2 items-center border-2 border-blue-500 bg-blue-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-blue-600 hover:text-white hover:border-blue-500">
                    <FaFilter />
                    Filter
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  {/* Event Filter */}
                  <div className="px-2 py-1 text-sm font-semibold">Event</div>
                  <DropdownMenuItem
                    onSelect={() => setSelectedEventId('')}
                    className="flex items-center gap-2"
                  >
                    <input type="checkbox" checked={!selectedEventId} readOnly className="mr-2" />
                    <span>All Events</span>
                  </DropdownMenuItem>
                  {selectedEventId && (
                    <DropdownMenuItem
                      onSelect={() => setSelectedEventId('')}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear Filter
                    </DropdownMenuItem>
                  )}
                  {(() => {
                    // Extract unique events from current data
                    const uniqueEvents = news
                      ? Array.from(
                          new Map(news.map((item) => [item.eventId, item.eventName])).entries()
                        )
                      : [];

                    return uniqueEvents.map(([eventId, eventName]) => (
                      <DropdownMenuItem
                        key={eventId}
                        onSelect={() => setSelectedEventId(eventId)}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="checkbox"
                          checked={selectedEventId === eventId}
                          readOnly
                          className="mr-2"
                        />
                        <span className="truncate" title={eventName}>
                          {eventName}
                        </span>
                      </DropdownMenuItem>
                    ));
                  })()}
                  <DropdownMenuSeparator />

                  {/* Author Filter */}
                  <div className="px-2 py-1 text-sm font-semibold">Author</div>
                  <DropdownMenuItem
                    onSelect={() => setSelectedAuthorName('')}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      checked={!selectedAuthorName}
                      readOnly
                      className="mr-2"
                    />
                    <span>All Authors</span>
                  </DropdownMenuItem>
                  {selectedAuthorName && (
                    <DropdownMenuItem
                      onSelect={() => setSelectedAuthorName('')}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear Filter
                    </DropdownMenuItem>
                  )}
                  {(() => {
                    // Extract unique authors from current data
                    const uniqueAuthors = news
                      ? Array.from(
                          new Map(news.map((item) => [item.authorName, item.authorName])).entries()
                        )
                      : [];

                    return uniqueAuthors.map(([authorName, authorNameValue]) => (
                      <DropdownMenuItem
                        key={authorName}
                        onSelect={() => setSelectedAuthorName(authorName)}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="checkbox"
                          checked={selectedAuthorName === authorName}
                          readOnly
                          className="mr-2"
                        />
                        <span className="truncate" title={authorNameValue}>
                          {authorNameValue}
                        </span>
                      </DropdownMenuItem>
                    ));
                  })()}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="bg-green-200 hover:bg-green-200">
                <TableHead className="text-center" style={{ width: '5%' }}>
                  #
                </TableHead>
                <TableHead style={{ width: '20%' }}>
                  <div
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort('newsTitle')}
                  >
                    Title
                    {getSortIcon('newsTitle')}
                  </div>
                </TableHead>
                <TableHead style={{ width: '15%' }}>
                  <div
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort('eventName')}
                  >
                    Event Name
                    {getSortIcon('eventName')}
                  </div>
                </TableHead>
                <TableHead style={{ width: '12%' }}>
                  <div
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort('authorName')}
                  >
                    Author Name
                    {getSortIcon('authorName')}
                  </div>
                </TableHead>
                <TableHead className="text-center" style={{ width: '10%' }}>
                  Status
                </TableHead>
                <TableHead className="text-center" style={{ width: '12%' }}>
                  <div
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort('createdAt')}
                  >
                    Created At
                    {getSortIcon('createdAt')}
                  </div>
                </TableHead>
                <TableHead className="text-center" style={{ width: '12%' }}>
                  <div
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort('updatedAt')}
                  >
                    Updated At
                    {getSortIcon('updatedAt')}
                  </div>
                </TableHead>
                <TableHead className="text-center" style={{ width: '10%' }}>
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {news.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                    No approved news found.
                  </TableCell>
                </TableRow>
              ) : (
                news.map((item, idx) => (
                  <TableRow key={item.newsId} className="hover:bg-green-50">
                    <TableCell className="text-center">
                      {((page || 1) - 1) * (pageSize || 5) + idx + 1}
                    </TableCell>
                    <TableCell
                      className="truncate max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap"
                      title={item.newsTitle}
                    >
                      {item.newsTitle}
                    </TableCell>
                    <TableCell
                      className="truncate max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap"
                      title={item.eventName || 'N/A'}
                    >
                      {item.eventName || 'N/A'}
                    </TableCell>
                    <TableCell
                      className="truncate max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap"
                      title={item.authorName || item.authorId || 'Unknown'}
                    >
                      {item.authorName || item.authorId || 'Unknown'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={item.status}
                        onCheckedChange={() => handleToggleStatus(item)}
                        disabled={loading}
                        className={
                          item.status
                            ? '!bg-green-500 !border-green-500'
                            : '!bg-red-400 !border-red-400'
                        }
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Unknown'}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : 'Unknown'}
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
                ))
              )}
              {/* Add empty rows to maintain table height */}
              {Array.from({ length: Math.max(0, 5 - news.length) }, (_, idx) => (
                <TableRow key={`empty-${idx}`} className="h-[56.8px]">
                  <TableCell colSpan={7} className="border-0"></TableCell>
                </TableRow>
              ))}
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
                              onClick={() => handlePageChange(Math.max(1, page - 1))}
                              aria-disabled={page === 1}
                              className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                            />
                          </PaginationItem>
                          {(() => {
                            const pages = [];
                            const maxVisiblePages = 7;

                            if (totalPages <= maxVisiblePages) {
                              // Hiển thị tất cả trang nếu tổng số trang <= 7
                              for (let i = 1; i <= totalPages; i++) {
                                pages.push(i);
                              }
                            } else {
                              // Logic hiển thị trang với dấu "..."
                              if (page <= 4) {
                                // Trang hiện tại ở đầu
                                for (let i = 1; i <= 5; i++) {
                                  pages.push(i);
                                }
                                pages.push('...');
                                pages.push(totalPages);
                              } else if (page >= totalPages - 3) {
                                // Trang hiện tại ở cuối
                                pages.push(1);
                                pages.push('...');
                                for (let i = totalPages - 4; i <= totalPages; i++) {
                                  pages.push(i);
                                }
                              } else {
                                // Trang hiện tại ở giữa
                                pages.push(1);
                                pages.push('...');
                                for (let i = page - 1; i <= page + 1; i++) {
                                  pages.push(i);
                                }
                                pages.push('...');
                                pages.push(totalPages);
                              }
                            }

                            return pages.map((item, index) => (
                              <PaginationItem key={index}>
                                {item === '...' ? (
                                  <span className="px-2 py-1 text-gray-500">...</span>
                                ) : (
                                  <PaginationLink
                                    isActive={item === page}
                                    onClick={() => handlePageChange(item as number)}
                                    className={`transition-colors rounded 
                                      ${
                                        item === page
                                          ? 'bg-green-500 text-white border hover:bg-green-700 hover:text-white'
                                          : 'text-gray-700 hover:bg-slate-200 hover:text-black'
                                      }
                                      px-2 py-1 mx-0.5`}
                                    style={{
                                      minWidth: 32,
                                      textAlign: 'center',
                                      fontWeight: item === page ? 700 : 400,
                                      cursor: item === page ? 'default' : 'pointer',
                                    }}
                                  >
                                    {item}
                                  </PaginationLink>
                                )}
                              </PaginationItem>
                            ));
                          })()}
                          <PaginationItem>
                            <PaginationNext
                              onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
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
                          handlePageSizeChange(Number(e.target.value));
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
            <ApprovedNewsDetailModal news={selectedNews} onClose={() => setSelectedNews(null)} />
          )}
        </div>
      </div>
    </div>
  );
};
