import { useEffect, useState, useRef } from 'react';
import { connectCommentHub, onComment, offComment } from '@/services/signalr.service';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableFooter,
} from '@/components/ui/table';
import SpinnerOverlay from '@/components/SpinnerOverlay';
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
import { getCommentsWithFilter } from '@/services/Admin/comment.service';
import type { Comment, PaginatedCommentResponse, CommentFilterParams } from '@/types/Admin/comment';
import { FaEye, FaSort, FaSortUp, FaSortDown, FaFilter, FaTimes } from 'react-icons/fa';
import CommentDetailModal from './CommentDetailModal';
import { useTranslation } from 'react-i18next';
import AnalyzeCommentModal from './AnalyzeCommentModal';
import { useThemeClasses } from '@/hooks/useThemeClasses';

const pageSizeOptions = [5, 10, 20, 50];

export const CommentList = () => {
  const {
    getProfileInputClass,
    getAdminListCardClass,
    getAdminListTableClass,
    getAdminListTableRowClass,
    getAdminListTableCellClass,
    getAdminListDropdownClass,
    getAdminListPaginationClass,
    getAdminListPageSizeSelectClass,
    getAdminListTableBorderClass,
    getAdminListTableCellBorderClass,
    getAdminListTableHeaderBorderClass,
  } = useThemeClasses();
  const [data, setData] = useState<PaginatedCommentResponse['data'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [viewComment, setViewComment] = useState<Comment | null>(null);
  const [showAnalyzeModal, setShowAnalyzeModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<CommentFilterParams>({
    page: 1,
    pageSize: 5,
    sortBy: 'createdAt',
    sortDescending: true,
    searchTerm: '',
  });
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortDescending, setSortDescending] = useState(true);

  // New state for event filtering - store both eventId and eventName
  const [allEvents, setAllEvents] = useState<Array<{ eventId: string; eventName: string }>>([]);

  const { t } = useTranslation();

  // Refs for SignalR
  const pageRef = useRef(page);
  const pageSizeRef = useRef(pageSize);
  const searchRef = useRef(searchTerm);

  useEffect(() => {
    pageRef.current = page;
    pageSizeRef.current = pageSize;
    searchRef.current = searchTerm;
  }, [page, pageSize, searchTerm]);

  useEffect(() => {
    const COMMENT_HUB_URL =
      (import.meta as { env?: { VITE_COMMENT_HUB_URL?: string } })?.env?.VITE_COMMENT_HUB_URL ||
      (typeof process !== 'undefined'
        ? (process as { env?: { REACT_APP_COMMENT_HUB_URL?: string } })?.env
            ?.REACT_APP_COMMENT_HUB_URL
        : undefined) ||
      '/commentHub';
    connectCommentHub(COMMENT_HUB_URL);

    const reload = () => reloadList();
    onComment('OnCommentCreated', reload);
    onComment('OnCommentUpdated', reload);
    onComment('OnCommentDeleted', reload);
    return () => {
      offComment('OnCommentCreated', reload);
      offComment('OnCommentUpdated', reload);
      offComment('OnCommentDeleted', reload);
    };
  }, []);

  // Khi searchTerm thay đổi, cập nhật filters và đánh dấu là searchOnly
  useEffect(() => {
    setFilters((prev) => ({ ...prev, searchTerm, _searchOnly: true }));
    setPage(1);
  }, [searchTerm]);

  useEffect(() => {
    // Nếu chỉ search thì không loading
    fetchData(filters._searchOnly ? false : true);
  }, [filters, sortBy, sortDescending]);

  // Sync filters.page with page on mount
  useEffect(() => {
    setFilters((prev) => ({ ...prev, page: page || 1 }));
  }, []);

  // Load events from comments data - extract both eventId and eventName
  // Similar to ApprovedEventList.tsx approach: fetch a larger sample to get more events for filter
  useEffect(() => {
    const loadEventsFromComments = async () => {
      try {
        console.log('🔄 Loading events from comments for filter options...');
        // Fetch a larger sample of comments to extract events (similar to ApprovedEventList.tsx pageSize: 100)
        const response = await getCommentsWithFilter({ page: 1, pageSize: 100 });
        if (response?.data?.items) {
          const uniqueEvents = Array.from(
            new Map(
              response.data.items
                .filter(
                  (comment) =>
                    comment.eventId && comment.eventName && comment.eventName !== 'Unknown Event'
                )
                .map((comment) => [comment.eventId, comment.eventName])
            ).entries()
          )
            .map(([eventId, eventName]) => ({ eventId, eventName }))
            .sort((a, b) => a.eventName.localeCompare(b.eventName));
          console.log('📋 Extracted events from comments for filter:', uniqueEvents);
          setAllEvents(uniqueEvents);
        } else {
          console.warn('⚠️ No comments found to extract events:', response);
          setAllEvents([]);
        }
      } catch (error) {
        console.error('❌ Failed to load events from comments:', error);
        setAllEvents([]);
      }
    };

    loadEventsFromComments();
  }, []); // Only run once on mount, not dependent on data?.items

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      // Tách riêng pagination và filter parameters giống ApprovedEventList.tsx
      const paginationParams = {
        page: filters.page,
        pageSize: filters.pageSize,
      };

      // Chuẩn hóa eventId filter - chỉ lấy eventId đầu tiên nếu là mảng
      let eventIdParam: string | undefined = undefined;
      if (Array.isArray(filters.eventId)) {
        if (filters.eventId.length > 0) {
          eventIdParam = filters.eventId[0]; // Chỉ lấy eventId đầu tiên
        }
      } else if (typeof filters.eventId === 'string' && filters.eventId) {
        eventIdParam = filters.eventId;
      }

      const filterParams = {
        searchTerm: filters.searchTerm || undefined,
        eventId: eventIdParam,
        userId: filters.userId,
        createdFrom: filters.createdFrom,
        createdTo: filters.createdTo,
        sortBy: sortBy || filters.sortBy,
        sortDescending: sortDescending,
      };

      // Kết hợp pagination và filter parameters
      const params = { ...paginationParams, ...filterParams };

      // Debug: Log search parameters
      console.log('🔍 Comment Search Parameters:', {
        pagination: paginationParams,
        filters: filterParams,
        searchTerm: filters.searchTerm,
        eventId: filterParams.eventId,
        note: 'eventId filter is now properly passed to API as single string',
      });

      const response = await getCommentsWithFilter(params);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const reloadList = () => {
    fetchData();
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => {
      const next = { ...prev, page: newPage };
      delete next._searchOnly;
      return next;
    });
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setFilters((prev) => {
      const next = { ...prev, pageSize: newPageSize, page: 1 };
      delete next._searchOnly;
      return next;
    });
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleSort = (field: string) => {
    if (field === '') return; // Skip numbering column
    const newSortDescending = sortBy === field ? !sortDescending : true;
    setSortBy(field);
    setSortDescending(newSortDescending);
    setFilters((prev) => {
      const next = { ...prev, page: 1 };
      delete next._searchOnly;
      return next;
    });
    setPage(1);
  };

  const getSortIcon = (field: string) => {
    if (field === '') return null; // No sort icon for numbering column
    if (sortBy !== field) {
      return <FaSort className="w-3 h-3 text-gray-400" />;
    }
    return sortDescending ? (
      <FaSortDown className="w-3 h-3 text-blue-600" />
    ) : (
      <FaSortUp className="w-3 h-3 text-blue-600" />
    );
  };

  const updateFilter = (
    key: keyof CommentFilterParams,
    value: string | string[] | boolean | undefined
  ) => {
    console.log('🔧 Comment Filter update:', { key, value });
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value, page: 1 };
      delete newFilters._searchOnly; // Bỏ _searchOnly flag khi filter thay đổi
      console.log('🔧 New comment filters state:', newFilters);
      return newFilters;
    });
    setPage(1);
  };

  const items = data?.items || [];
  const totalItems = data?.totalItems || 0;
  const totalPages = data?.totalPages || 1;

  return (
    <div className="p-6">
      <SpinnerOverlay show={loading} />
      {viewComment && (
        <CommentDetailModal
          comment={viewComment}
          eventName={viewComment.eventName}
          onClose={() => setViewComment(null)}
          onDelete={reloadList}
        />
      )}

      <AnalyzeCommentModal open={showAnalyzeModal} onClose={() => setShowAnalyzeModal(false)} />

      <div className="overflow-x-auto">
        <div className={`p-4 ${getAdminListCardClass()}`}>
          {/* Search input và nút Analyze cùng hàng */}
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
                  placeholder="Search all columns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
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
                    onClick={() => setSearchTerm('')}
                    tabIndex={-1}
                    type="button"
                    aria-label="Clear search"
                  >
                    &#10005;
                  </button>
                )}
              </div>
            </div>

            {/* Filter and Analyze buttons (right) */}
            <div className="flex items-center gap-2">
              {/* Filter dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex gap-2 items-center border-2 border-blue-500 bg-blue-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-blue-600 hover:text-white hover:border-blue-500">
                    <FaFilter />
                    Filter
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className={`w-64 rounded-xl shadow-2xl p-2 z-[9999] ${getAdminListDropdownClass()}`}
                >
                  {/* Event Filter - RADIO ONLY, NOT MULTIPLE */}
                  {allEvents.length > 0 ? (
                    <>
                      <div className="px-2 py-1 text-sm font-semibold text-gray-900 dark:text-white">
                        Event
                      </div>
                      <div className="max-h-48 overflow-y-auto overflow-x-hidden">
                        <DropdownMenuItem
                          onSelect={() => updateFilter('eventId', undefined)}
                          className={`flex items-center gap-2 ${getAdminListDropdownClass()} dark:text-white`}
                        >
                          <input
                            type="radio"
                            name="eventFilter"
                            checked={!filters.eventId}
                            readOnly
                            className="mr-2 flex-shrink-0"
                            style={{ minWidth: 16 }}
                          />
                          <span>All Events</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {allEvents.map((event) => (
                          <DropdownMenuItem
                            key={event.eventId}
                            onSelect={() => updateFilter('eventId', event.eventId)}
                            className={`flex items-center gap-2 ${getAdminListDropdownClass()} dark:text-white`}
                          >
                            <input
                              type="radio"
                              name="eventFilter"
                              checked={filters.eventId === event.eventId}
                              readOnly
                              className="mr-2 flex-shrink-0"
                              style={{ minWidth: 16 }}
                            />
                            <span className="text-sm truncate max-w-32" title={event.eventName}>
                              {event.eventName}
                            </span>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="px-2 py-1 text-sm font-semibold text-gray-900 dark:text-white">
                        Event
                      </div>
                      <div className="px-2 py-2 text-xs text-gray-500 dark:text-gray-400">
                        Loading events...
                      </div>
                      <DropdownMenuSeparator />
                    </>
                  )}

                  {/* Date Range Filter */}
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
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </DropdownMenuItem>

                  {/* Clear Filter Button */}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => {
                      setFilters({
                        page: 1,
                        pageSize: filters.pageSize,
                        sortDescending: true,
                        sortBy: 'createdAt',
                      });
                      setPage(1);
                    }}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                  >
                    <FaTimes className="w-4 h-4" />
                    <span>Clear All Filters</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Nút Analyze */}
              <button
                className="flex gap-2 items-center border-2 border-green-500 bg-green-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-green-600 hover:text-white hover:border-green-500"
                onClick={() => setShowAnalyzeModal(true)}
              >
                Analyze Comment
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
                <TableHead className="text-gray-900 text-center" style={{ width: '5%' }}>
                  #
                </TableHead>
                <TableHead
                  className="text-gray-900"
                  style={{ width: '22%' }}
                  onClick={() => handleSort('fullName')}
                >
                  <div className="flex items-center justify-center gap-1">
                    {t('userName')}
                    {getSortIcon('fullName')}
                  </div>
                </TableHead>
                <TableHead
                  className="text-gray-900"
                  style={{ width: '15%' }}
                  onClick={() => handleSort('eventName')}
                >
                  <div className="flex items-center gap-1">
                    {t('eventName')}
                    {getSortIcon('eventName')}
                  </div>
                </TableHead>
                <TableHead
                  className="text-gray-900"
                  style={{ width: '25%' }}
                  onClick={() => handleSort('content')}
                >
                  <div className="flex items-center gap-1">
                    {t('content')}
                    {getSortIcon('content')}
                  </div>
                </TableHead>
                <TableHead
                  className="text-gray-900"
                  style={{ width: '10%' }}
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center justify-center gap-1">
                    {t('createdAt')}
                    {getSortIcon('createdAt')}
                  </div>
                </TableHead>
                <TableHead
                  className="text-gray-900"
                  style={{ width: '10%' }}
                  onClick={() => handleSort('updatedAt')}
                >
                  <div className="flex items-center justify-center gap-1">
                    {t('updatedAt')}
                    {getSortIcon('updatedAt')}
                  </div>
                </TableHead>
                <TableHead style={{ width: '5%' }} className="text-gray-900 text-center">
                  {t('actions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody
              className={`min-h-[400px] ${getAdminListTableClass()} ${getAdminListTableBorderClass()}`}
            >
              {items.length === 0 ? (
                <>
                  {/* Show "No comments found" message */}
                  <TableRow
                    className={`${getAdminListTableRowClass()} ${getAdminListTableCellBorderClass()}`}
                  >
                    <TableCell
                      colSpan={8}
                      className="text-center py-4 text-gray-500 dark:text-gray-400"
                    >
                      No comments found.
                    </TableCell>
                  </TableRow>
                  {/* Add empty rows to maintain table height */}
                  {Array.from(
                    {
                      length: filters.pageSize - 1,
                    },
                    (_, idx) => (
                      <TableRow
                        key={`empty-${idx}`}
                        className={`h-[56.8px] ${getAdminListTableRowClass()} ${getAdminListTableCellBorderClass()}`}
                      >
                        <TableCell colSpan={8} className="border-0"></TableCell>
                      </TableRow>
                    )
                  )}
                </>
              ) : (
                <>
                  {items.map((comment, idx) => (
                    <TableRow
                      key={comment.commentId}
                      className={`${getAdminListTableRowClass()} ${getAdminListTableCellBorderClass()}`}
                    >
                      <TableCell
                        className={`text-center ${getAdminListTableCellClass()} truncate max-w-[60px]`}
                      >
                        {((filters.page || 1) - 1) * (filters.pageSize || 5) + idx + 1}
                      </TableCell>
                      <TableCell
                        className={`text-center ${getAdminListTableCellClass()} truncate max-w-[120px]`}
                        title={comment.fullName || 'Unknown User'}
                      >
                        {comment.fullName || 'Unknown User'}
                      </TableCell>
                      <TableCell
                        className={`text-left ${getAdminListTableCellClass()} truncate max-w-[140px]`}
                        title={comment.eventName || 'Unknown Event'}
                      >
                        {comment.eventName || 'Unknown Event'}
                      </TableCell>
                      <TableCell
                        className={`text-left ${getAdminListTableCellClass()} truncate max-w-[220px]`}
                        title={comment.content}
                      >
                        {comment.content}
                      </TableCell>
                      <TableCell
                        className={`text-center ${getAdminListTableCellClass()} truncate max-w-[120px]`}
                        title={
                          comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ''
                        }
                      >
                        {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ''}
                      </TableCell>
                      <TableCell
                        className={`text-center ${getAdminListTableCellClass()} truncate max-w-[120px]`}
                        title={
                          comment.updatedAt ? new Date(comment.updatedAt).toLocaleString() : ''
                        }
                      >
                        {comment.updatedAt ? new Date(comment.updatedAt).toLocaleString() : ''}
                      </TableCell>
                      <TableCell className="text-center flex items-center justify-center gap-2">
                        {/* Nút xem chi tiết */}
                        <button
                          className="border-2 border-yellow-400 bg-yellow-400 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[15px] font-semibold text-white flex items-center justify-center hover:bg-yellow-500 hover:text-white"
                          title={t('view')}
                          onClick={() => setViewComment(comment)}
                        >
                          <FaEye className="w-4 h-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Add empty rows to maintain table height */}
                  {Array.from(
                    {
                      length: Math.max(0, filters.pageSize - items.length),
                    },
                    (_, idx) => (
                      <TableRow
                        key={`empty-${idx}`}
                        className={`h-[56.8px] ${getAdminListTableRowClass()} ${getAdminListTableCellBorderClass()}`}
                      >
                        <TableCell colSpan={8} className="border-0"></TableCell>
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
                <TableCell colSpan={8} className="border-0">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 px-2 py-2">
                    <div className="flex-1 flex justify-center pl-[200px]">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => handlePageChange(Math.max(1, (filters.page || 1) - 1))}
                              aria-disabled={(filters.page || 1) === 1}
                              className={`${
                                (filters.page || 1) === 1
                                  ? 'pointer-events-none opacity-50 cursor-not-allowed'
                                  : 'cursor-pointer'
                              } ${getAdminListPaginationClass()}`}
                            >
                              {t('previous')}
                            </PaginationPrevious>
                          </PaginationItem>
                          {(() => {
                            const pages = [];
                            const maxVisiblePages = 7;

                            if (totalPages <= maxVisiblePages) {
                              for (let i = 1; i <= totalPages; i++) {
                                pages.push(i);
                              }
                            } else {
                              if ((filters.page || 1) <= 4) {
                                for (let i = 1; i <= 5; i++) {
                                  pages.push(i);
                                }
                                pages.push('...');
                                pages.push(totalPages);
                              } else if ((filters.page || 1) >= totalPages - 3) {
                                pages.push(1);
                                pages.push('...');
                                for (let i = totalPages - 4; i <= totalPages; i++) {
                                  pages.push(i);
                                }
                              } else {
                                pages.push(1);
                                pages.push('...');
                                for (
                                  let i = (filters.page || 1) - 1;
                                  i <= (filters.page || 1) + 1;
                                  i++
                                ) {
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
                                    isActive={item === (filters.page || 1)}
                                    onClick={() => handlePageChange(item as number)}
                                    className={`transition-colors rounded border
                                      ${
                                        item === (filters.page || 1)
                                          ? 'bg-green-500 text-white border-green-500 hover:bg-green-700 hover:text-white'
                                          : 'text-gray-700 dark:text-gray-100 border-none hover:bg-slate-200 dark:hover:bg-gray-600 hover:text-black dark:hover:text-white'
                                      }
                                      px-2 py-1 mx-0.5`}
                                    style={{
                                      minWidth: 32,
                                      textAlign: 'center',
                                      fontWeight: item === (filters.page || 1) ? 700 : 400,
                                      cursor: item === (filters.page || 1) ? 'default' : 'pointer',
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
                              onClick={() =>
                                handlePageChange(Math.min(totalPages, (filters.page || 1) + 1))
                              }
                              aria-disabled={(filters.page || 1) === totalPages}
                              className={`${
                                (filters.page || 1) === totalPages
                                  ? 'pointer-events-none opacity-50 cursor-not-allowed'
                                  : 'cursor-pointer'
                              } ${getAdminListPaginationClass()}`}
                            >
                              {t('next')}
                            </PaginationNext>
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                    <div className="flex items-center gap-2 justify-end w-full md:w-auto">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {totalItems === 0
                          ? '0-0 of 0'
                          : `${((filters.page || 1) - 1) * (filters.pageSize || 5) + 1}-${Math.min(
                              (filters.page || 1) * (filters.pageSize || 5),
                              totalItems
                            )} of ${totalItems}`}
                      </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {t('rowsPerPage')}
                      </span>
                      <select
                        className={`border rounded px-2 py-1 text-sm ${getAdminListPageSizeSelectClass()}`}
                        value={filters.pageSize || 5}
                        onChange={(e) => handlePageSizeChange(Number(e.target.value))}
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
    </div>
  );
};

export default CommentList;
