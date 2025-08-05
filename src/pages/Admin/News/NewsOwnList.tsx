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
} from '@/components/ui/dropdown-menu';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import { getOwnNews, hideNews, showNews, deleteNews } from '@/services/Admin/news.service';
import CreateNewsModal from './CreateNewsModal';
import EditNewsModal from './EditNewsModal';
import { connectNewsHub, onNews } from '@/services/signalr.service';

import type { News, NewsFilterParams } from '@/types/Admin/news';
import { FaEye, FaFilter, FaRegTrashAlt, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { MdOutlineEdit } from 'react-icons/md';
import NewsOwnDetailModal from './NewsOwnDetailModal';
import { Switch } from '@/components/ui/switch';
import { toast } from 'react-toastify';
import { useThemeClasses } from '@/hooks/useThemeClasses';

const pageSizeOptions = [5, 10, 20, 50];

export const NewsOwnList = ({ activeTab }: { activeTab: string }) => {
  const {
    getProfileInputClass,
    getAdminListCardClass,
    getAdminListTableClass,
    getAdminListTableRowClass,
    getAdminListDropdownClass,
    getAdminListPaginationClass,
    getAdminListPageSizeSelectClass,
    getAdminListTableBorderClass,
    getAdminListTableCellBorderClass,
    getAdminListTableHeaderBorderClass,
  } = useThemeClasses();

  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedNews, setSelectedNews] = useState<News | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editNews, setEditNews] = useState<News | null>(null);

  // Search and filter states
  const [ownNewsSearch, setOwnNewsSearch] = useState('');
  const [filters, setFilters] = useState<NewsFilterParams>({
    page: 1,
    pageSize: 5,
    sortDescending: true,
  });
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortDescending, setSortDescending] = useState(true);

  // Event filter states
  const [selectedEventId, setSelectedEventId] = useState<string>('');

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
  const searchRef = useRef(ownNewsSearch);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);
  useEffect(() => {
    pageSizeRef.current = pageSize;
  }, [pageSize]);
  useEffect(() => {
    searchRef.current = ownNewsSearch;
  }, [ownNewsSearch]);

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
    const currentPage = ownNewsSearch ? 1 : p;
    const currentPageSize = ps;

    const filterParams = {
      page: currentPage,
      pageSize: currentPageSize,
      searchTerm: ownNewsSearch,
      authorFullName: filters.authorFullName,
      eventId: selectedEventId || filters.eventId,
      authorId: filters.authorId,
      createdFrom: filters.createdFrom,
      createdTo: filters.createdTo,
      sortBy: sortBy || filters.sortBy,
      sortDescending: sortDescending,
    };

    // Debug: Log search parameters
    console.log('🔍 Own News Search Parameters:', filterParams);
    console.log('🔍 Date filters:', {
      createdFrom: filters.createdFrom,
      createdTo: filters.createdTo,
    });

    getOwnNews(filterParams)
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

  // Chỉ gọi fetchData khi [filters, sortBy, sortDescending, ownNewsSearch, selectedEventId] đổi
  useEffect(() => {
    if (activeTab === 'own') {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sortBy, sortDescending, ownNewsSearch, selectedEventId, activeTab]);

  // Filter handlers
  const updateFilter = (key: keyof NewsFilterParams, value: string | string[] | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
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

  // Toggle status handler
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

  // Delete handler
  const handleDelete = async (item: News) => {
    if (!window.confirm('Are you sure you want to delete this news?')) return;
    try {
      await deleteNews(item.newsId);
      toast.success('News deleted successfully!');
      fetchData();
    } catch {
      toast.error('Cannot delete this news!');
    }
  };

  return (
    <div className="pl-1 pt-3">
      <SpinnerOverlay show={loading} />
      <div className="overflow-x-auto">
        <div className={`p-4 ${getAdminListCardClass()}`}>
          {/* Thanh search và nút create */}
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
                  className={`w-[300px] h-10 rounded-[30px] px-4 py-2 text-sm transition-colors ${getProfileInputClass()}`}
                  placeholder="Search title, description, content..."
                  value={ownNewsSearch}
                  onChange={(e) => {
                    setOwnNewsSearch(e.target.value);
                    setPage(1);
                  }}
                />
                {ownNewsSearch && (
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
                      setOwnNewsSearch('');
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
            {/* Filter and Create buttons (right) */}
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex gap-2 items-center border-2 border-blue-500 bg-blue-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-blue-600 hover:text-white hover:border-blue-500">
                    <FaFilter />
                    Filter
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className={`w-80 ${getAdminListDropdownClass()}`}>
                  {/* Event Filter */}
                  <div className="px-2 py-1 text-sm font-semibold text-gray-900 dark:text-white">
                    Event
                  </div>
                  <DropdownMenuItem
                    onSelect={() => setSelectedEventId('')}
                    className="focus:bg-blue-100 focus:text-blue-900 hover:bg-blue-50 transition rounded-md text-gray-900 dark:text-white dark:focus:bg-blue-900 dark:focus:text-white dark:hover:bg-blue-800"
                  >
                    <input type="checkbox" checked={!selectedEventId} readOnly className="mr-2" />
                    <span>All Events</span>
                  </DropdownMenuItem>
                  {selectedEventId && (
                    <DropdownMenuItem
                      onSelect={() => setSelectedEventId('')}
                      className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
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
                        className="focus:bg-blue-100 focus:text-blue-900 hover:bg-blue-50 transition rounded-md text-gray-900 dark:text-white dark:focus:bg-blue-900 dark:focus:text-white dark:hover:bg-blue-800"
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
                  <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                  {/* Date Range Filters */}
                  <div className="px-2 py-1 text-sm font-semibold text-gray-900 dark:text-white">
                    Created Date Range
                  </div>
                  <DropdownMenuItem
                    className="flex flex-col items-start p-3"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <div className="space-y-2 w-full">
                      <input
                        type="date"
                        placeholder="From..."
                        value={filters.createdFrom || ''}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateFilter('createdFrom', e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${getProfileInputClass()}`}
                      />
                      <input
                        type="date"
                        placeholder="To..."
                        value={filters.createdTo || ''}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateFilter('createdTo', e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${getProfileInputClass()}`}
                      />
                      {(filters.createdFrom || filters.createdTo) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateFilter('createdFrom', undefined);
                            updateFilter('createdTo', undefined);
                          }}
                          className="w-full px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Clear Date Filter
                        </button>
                      )}
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <button
                className="flex gap-2 items-center border-2 border-green-500 bg-green-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-green-600 hover:text-white hover:border-green-500"
                onClick={() => setShowCreateModal(true)}
              >
                Create
              </button>
            </div>
          </div>
          <Table
            className={`min-w-full ${getAdminListTableClass()} ${getAdminListTableBorderClass()}`}
          >
            <TableHeader>
              <TableRow
                className={`bg-blue-200 hover:bg-blue-200 ${getAdminListTableHeaderBorderClass()}`}
              >
                <TableHead className="pl-4 text-center text-gray-900 " style={{ width: '5%' }}>
                  #
                </TableHead>
                <TableHead className="text-gray-900 " style={{ width: '35%' }}>
                  <div
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort('newsTitle')}
                  >
                    Title
                    {getSortIcon('newsTitle')}
                  </div>
                </TableHead>
                <TableHead className="text-center text-gray-900 " style={{ width: '10%' }}>
                  Status
                </TableHead>
                <TableHead className="text-center text-gray-900 " style={{ width: '15%' }}>
                  <div
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort('createdAt')}
                  >
                    Created At
                    {getSortIcon('createdAt')}
                  </div>
                </TableHead>
                <TableHead className="text-center text-gray-900 " style={{ width: '15%' }}>
                  <div
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort('updatedAt')}
                  >
                    Updated At
                    {getSortIcon('updatedAt')}
                  </div>
                </TableHead>
                <TableHead className="text-center text-gray-900 " style={{ width: '20%' }}>
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className={`${getAdminListTableClass()} ${getAdminListTableBorderClass()}`}>
              {news.length === 0 ? (
                <>
                  {/* Show "No news found" message */}
                  <TableRow
                    className={`${getAdminListTableRowClass()} ${getAdminListTableCellBorderClass()}`}
                  >
                    <TableCell
                      colSpan={6}
                      className="text-center py-4 text-gray-500 dark:text-gray-400"
                    >
                      No news found.
                    </TableCell>
                  </TableRow>
                  {/* Add empty rows to maintain table height */}
                  {Array.from(
                    {
                      length: pageSize - 1,
                    },
                    (_, idx) => (
                      <TableRow
                        key={`empty-${idx}`}
                        className={`h-[56.8px] ${getAdminListTableRowClass()} ${getAdminListTableCellBorderClass()}`}
                      >
                        <TableCell colSpan={6} className="border-0"></TableCell>
                      </TableRow>
                    )
                  )}
                </>
              ) : (
                <>
                  {news.map((item, idx) => (
                    <TableRow
                      key={item.newsId}
                      className={`${getAdminListTableRowClass()} ${getAdminListTableCellBorderClass()}`}
                    >
                      <TableCell className="pl-4 text-center text-gray-900 dark:text-white">
                        {(page - 1) * pageSize + idx + 1}
                      </TableCell>
                      <TableCell className="truncate max-w-[320px] overflow-hidden text-ellipsis whitespace-nowrap text-gray-900 dark:text-white">
                        {item.newsTitle}
                      </TableCell>
                      <TableCell className="text-center text-gray-900 dark:text-white">
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
                      <TableCell className="text-center text-gray-900 dark:text-white">
                        {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                      </TableCell>
                      <TableCell className="text-center text-gray-900 dark:text-white">
                        {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : ''}
                      </TableCell>
                      <TableCell className="text-center flex items-center justify-center gap-2">
                        <button
                          className="border-2 border-yellow-400 bg-yellow-400 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white flex items-center justify-center hover:bg-yellow-500 hover:text-white"
                          title="View details"
                          onClick={() => setSelectedNews(item)}
                        >
                          <FaEye className="w-4 h-4" />
                        </button>
                        <button
                          className="border-2 border-[#24b4fb] bg-[#24b4fb] rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-[#0071e2]"
                          title="Edit"
                          onClick={() => setEditNews(item)}
                        >
                          <MdOutlineEdit className="w-4 h-4" />
                        </button>
                        <button
                          className="border-2 border-red-500 bg-red-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-white hover:text-red-500 hover:border-red-500"
                          title="Delete"
                          onClick={() => handleDelete(item)}
                        >
                          <FaRegTrashAlt className="w-4 h-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Add empty rows to maintain table height */}
                  {Array.from(
                    {
                      length: Math.max(0, pageSize - news.length),
                    },
                    (_, idx) => (
                      <TableRow
                        key={`empty-${idx}`}
                        className={`h-[56.8px] ${getAdminListTableRowClass()} ${getAdminListTableCellBorderClass()}`}
                      >
                        <TableCell colSpan={6} className="border-0"></TableCell>
                      </TableRow>
                    )
                  )}
                </>
              )}
            </TableBody>
            <TableFooter
              className={`${getAdminListTableClass()} ${getAdminListTableBorderClass()}`}
            >
              <TableRow
                className={`${getAdminListTableRowClass()} ${getAdminListTableCellBorderClass()} hover:bg-transparent`}
              >
                <TableCell colSpan={6} className="border-0">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 px-2 py-2">
                    <div className="flex-1 flex justify-center pl-[200px]">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => setPage((p) => Math.max(1, p - 1))}
                              aria-disabled={page === 1}
                              className={`${
                                page === 1 ? 'pointer-events-none opacity-50' : ''
                              } ${getAdminListPaginationClass()}`}
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
                                  <span className="px-2 py-1 text-gray-500 dark:text-gray-400">
                                    ...
                                  </span>
                                ) : (
                                  <PaginationLink
                                    isActive={item === page}
                                    onClick={() => setPage(item as number)}
                                    className={`transition-colors rounded border
                                      ${
                                        item === page
                                          ? 'bg-green-500 text-white border-green-500 hover:bg-green-700 hover:text-white'
                                          : 'text-gray-700 dark:text-gray-100 border-none hover:bg-slate-200 dark:hover:bg-gray-600 hover:text-black dark:hover:text-white'
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
                              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                              aria-disabled={page === totalPages}
                              className={`${
                                page === totalPages ? 'pointer-events-none opacity-50' : ''
                              } ${getAdminListPaginationClass()}`}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                    <div className="flex items-center gap-2 justify-end w-full md:w-auto">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {totalItems === 0
                          ? '0-0 of 0'
                          : `${(page - 1) * pageSize + 1}-${Math.min(
                              page * pageSize,
                              totalItems
                            )} of ${totalItems}`}
                      </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Rows per page
                      </span>
                      <select
                        className={`flex items-center gap-1 px-2 py-1 border rounded text-sm transition min-w-[48px] text-left ${getAdminListPageSizeSelectClass()}`}
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
        </div>
      </div>

      {/* Modals */}
      {editNews && (
        <EditNewsModal
          news={editNews}
          onClose={() => setEditNews(null)}
          onUpdated={() => {
            setEditNews(null);
            fetchData(); // Refresh data after editing
          }}
        />
      )}
      {selectedNews && (
        <NewsOwnDetailModal news={selectedNews} onClose={() => setSelectedNews(null)} />
      )}
      {showCreateModal && (
        <CreateNewsModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchData(); // Refresh data after creating
          }}
          authorId=""
        />
      )}
    </div>
  );
};

export default NewsOwnList;
