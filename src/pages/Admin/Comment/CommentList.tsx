import { useEffect, useState, useRef } from 'react';
import { connectCommentHub, onComment } from '@/services/signalr.service';
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
import { FaEye, FaSort, FaSortUp, FaSortDown, FaFilter } from 'react-icons/fa';
import CommentDetailModal from './CommentDetailModal';
import { useTranslation } from 'react-i18next';
import AnalyzeCommentModal from './AnalyzeCommentModal';

const pageSizeOptions = [5, 10, 20, 50];

export const CommentList = () => {
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
  });
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortDescending, setSortDescending] = useState(true);
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
    connectCommentHub('http://localhost:5004/commentHub');

    const reload = () => reloadList();
    onComment('OnCommentCreated', reload);
    onComment('OnCommentUpdated', reload);
    onComment('OnCommentDeleted', reload);
  }, []);

  useEffect(() => {
    fetchData();
  }, [filters, sortBy, sortDescending, searchTerm]);

  // Sync filters.page with page on mount
  useEffect(() => {
    setFilters((prev) => ({ ...prev, page: page || 1 }));
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        sortBy,
        sortDescending,
        searchTerm: searchTerm || undefined,
      };
      const response = await getCommentsWithFilter(params);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const reloadList = () => {
    fetchData();
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setFilters((prev) => ({ ...prev, pageSize: newPageSize, page: 1 }));
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleSort = (field: string) => {
    if (field === '') return; // Skip numbering column
    const newSortDescending = sortBy === field ? !sortDescending : true;
    setSortBy(field);
    setSortDescending(newSortDescending);
    setFilters((prev) => ({ ...prev, page: 1 }));
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
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
    setPage(1);
  };

  const items = data?.items || [];
  const totalItems = data?.totalItems || 0;
  const totalPages = data?.totalPages || 1;

  return (
    <div className="p-6">
      {viewComment && (
        <CommentDetailModal
          comment={viewComment}
          eventName={viewComment.eventName}
          onClose={() => setViewComment(null)}
          onDelete={reloadList}
        />
      )}

      <AnalyzeCommentModal open={showAnalyzeModal} onClose={() => setShowAnalyzeModal(false)} />
      <SpinnerOverlay show={loading} />
      <div className="overflow-x-auto">
        <div className="p-4 bg-white rounded-xl shadow">
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
                <DropdownMenuContent align="end" className="w-56">
                  {/* Event Filter */}
                  <div className="px-2 py-1 text-sm font-semibold">Event</div>
                  <DropdownMenuItem
                    onSelect={() => updateFilter('eventId', undefined)}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      checked={filters.eventId === undefined}
                      readOnly
                      className="mr-2"
                    />
                    <span>All Events</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />

                  {/* User Filter */}
                  <div className="px-2 py-1 text-sm font-semibold">User</div>
                  <DropdownMenuItem
                    onSelect={() => updateFilter('userId', undefined)}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      checked={filters.userId === undefined}
                      readOnly
                      className="mr-2"
                    />
                    <span>All Users</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />

                  {/* Date Range Filter */}
                  <div className="px-2 py-1 text-sm font-semibold">Created Date Range</div>
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
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="bg-blue-200 hover:bg-blue-200">
                <TableHead className="text-center" style={{ width: '5%' }}>
                  #
                </TableHead>
                <TableHead
                  className="text-center cursor-pointer"
                  style={{ width: '22%' }}
                  onClick={() => handleSort('fullName')}
                >
                  <div className="flex items-center justify-center gap-1">
                    {t('userName')}
                    {getSortIcon('fullName')}
                  </div>
                </TableHead>
                <TableHead
                  className="text-left cursor-pointer"
                  style={{ width: '15%' }}
                  onClick={() => handleSort('eventName')}
                >
                  <div className="flex items-center gap-1">
                    {t('eventName')}
                    {getSortIcon('eventName')}
                  </div>
                </TableHead>
                <TableHead
                  className="text-left cursor-pointer"
                  style={{ width: '25%' }}
                  onClick={() => handleSort('content')}
                >
                  <div className="flex items-center gap-1">
                    {t('content')}
                    {getSortIcon('content')}
                  </div>
                </TableHead>
                <TableHead
                  className="text-center cursor-pointer"
                  style={{ width: '10%' }}
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center justify-center gap-1">
                    {t('createdAt')}
                    {getSortIcon('createdAt')}
                  </div>
                </TableHead>
                <TableHead
                  className="text-center cursor-pointer"
                  style={{ width: '10%' }}
                  onClick={() => handleSort('updatedAt')}
                >
                  <div className="flex items-center justify-center gap-1">
                    {t('updatedAt')}
                    {getSortIcon('updatedAt')}
                  </div>
                </TableHead>
                <TableHead className="text-center" style={{ width: '5%' }}>
                  {t('actions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="min-h-[400px]">
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                    {t('noCommentsFound')}
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {items.map((comment, idx) => (
                    <TableRow key={comment.commentId} className="hover:bg-blue-50">
                      <TableCell className="text-center">
                        {((filters.page || 1) - 1) * (filters.pageSize || 5) + idx + 1}
                      </TableCell>
                      <TableCell className="text-center">
                        {comment.fullName || 'Unknown User'}
                      </TableCell>
                      <TableCell className="text-left max-w-[200px]">
                        <div className="truncate" title={comment.eventName || 'Unknown Event'}>
                          {comment.eventName || 'Unknown Event'}
                        </div>
                      </TableCell>
                      <TableCell
                        className="text-left max-w-[200px] truncate"
                        title={comment.content}
                      >
                        {comment.content.length > 50
                          ? comment.content.slice(0, 50) + '...'
                          : comment.content}
                      </TableCell>
                      <TableCell className="text-center">
                        {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ''}
                      </TableCell>
                      <TableCell className="text-center">
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
                  {Array.from({ length: Math.max(0, 5 - items.length) }, (_, idx) => (
                    <TableRow key={`empty-${idx}`} className="h-[56.8px]">
                      <TableCell colSpan={8} className="border-0"></TableCell>
                    </TableRow>
                  ))}
                </>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={8}>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 px-2 py-2">
                    <div className="flex-1 flex justify-center pl-[200px]">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => handlePageChange(Math.max(1, (filters.page || 1) - 1))}
                              aria-disabled={(filters.page || 1) === 1}
                              className={
                                (filters.page || 1) === 1 ? 'pointer-events-none opacity-50' : ''
                              }
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
                                  <span className="px-2 py-1 text-gray-500">...</span>
                                ) : (
                                  <PaginationLink
                                    isActive={item === (filters.page || 1)}
                                    onClick={() => handlePageChange(item as number)}
                                    className={`transition-colors rounded 
                                      ${
                                        item === (filters.page || 1)
                                          ? 'bg-blue-500 text-white border hover:bg-blue-700 hover:text-white'
                                          : 'text-gray-700 hover:bg-slate-200 hover:text-black'
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
                              className={
                                (filters.page || 1) === totalPages
                                  ? 'pointer-events-none opacity-50'
                                  : ''
                              }
                            >
                              {t('next')}
                            </PaginationNext>
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                    <div className="flex items-center gap-2 justify-end w-full md:w-auto">
                      <span className="text-sm text-gray-700">
                        {totalItems === 0
                          ? '0-0 of 0'
                          : `${((filters.page || 1) - 1) * (filters.pageSize || 5) + 1}-${Math.min(
                              (filters.page || 1) * (filters.pageSize || 5),
                              totalItems
                            )} of ${totalItems}`}
                      </span>
                      <span className="text-sm text-gray-700">{t('rowsPerPage')}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex items-center gap-1 px-2 py-1 border rounded text-sm bg-white hover:bg-gray-100 transition min-w-[48px] text-left">
                            {filters.pageSize || 5}
                            <svg
                              className="w-4 h-4 ml-1"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {pageSizeOptions.map((size) => (
                            <DropdownMenuItem
                              key={size}
                              onClick={() => handlePageSizeChange(size)}
                              className={
                                size === (filters.pageSize || 5) ? 'font-bold bg-primary/10' : ''
                              }
                            >
                              {size}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
