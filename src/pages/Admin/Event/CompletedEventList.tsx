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
  getCompletedEventsWithFilter,
  EventFilterParams,
  deleteEvent,
} from '@/services/Admin/event.service';

import type { ApprovedEvent, PaginatedEventResponse } from '@/types/Admin/event';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
} from '@/components/ui/pagination';
import { FaEye, FaRegTrashAlt, FaFilter, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import CompletedEventDetailModal from '@/pages/Admin/Event/CompletedEventDetailModal';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import { Category } from '@/types/Admin/category';
import { toast } from 'react-toastify';
import { onEvent, connectEventHub } from '@/services/signalr.service';

const pageSizeOptions = [5, 10, 20, 50];

export const CompletedEventList = ({
  page,
  pageSize,
  setPage,
  setPageSize,
  onTotalChange,
}: {
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  onTotalChange?: (total: number) => void;
}) => {
  const [data, setData] = useState<PaginatedEventResponse['data'] | null>(null);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<ApprovedEvent | null>(null);

  // Search and filter states
  const [completedEventSearch, setCompletedEventSearch] = useState('');
  const [filters, setFilters] = useState<EventFilterParams>({
    page: 1,
    pageSize: 5, // Set default to 5 like AdminList
    sortDescending: true,
  });
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortDescending, setSortDescending] = useState(true);

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
    if (pageSize !== 5 && setPageSize) {
      setPageSize(5);
    }
  }, []); // Only run once on mount

  // Fetch all categories for filter
  useEffect(() => {
    (async () => {
      const res = await getCompletedEventsWithFilter({ page: 1, pageSize: 100 });
      const categoryNames = Array.from(
        new Set(res.data.items.flatMap((event) => event.categoryName || []))
      );
      setAllCategories(categoryNames);
    })();
  }, []);

  const pageRef = useRef(page);
  const pageSizeRef = useRef(pageSize);
  const searchRef = useRef(completedEventSearch);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);
  useEffect(() => {
    pageSizeRef.current = pageSize;
  }, [pageSize]);
  useEffect(() => {
    searchRef.current = completedEventSearch;
  }, [completedEventSearch]);

  // Chỉ gọi fetchData khi [filters, sortBy, sortDescending, completedEventSearch] đổi
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sortBy, sortDescending, completedEventSearch]);

  useEffect(() => {
    connectEventHub('http://localhost:5004/notificationHub');
    const reload = () => {
      fetchData();
    };
    onEvent('OnEventCreated', reload);
    onEvent('OnEventUpdated', reload);
    onEvent('OnEventDeleted', reload);
  }, []);

  const fetchData = (p = page, ps = pageSize) => {
    setLoading(true);

    // Separate pagination parameters from filter parameters
    const paginationParams = {
      page: completedEventSearch ? 1 : filters.page,
      pageSize: filters.pageSize,
    };

    const filterParams = {
      searchTerm: completedEventSearch,
      createdByFullName: filters.createdByFullName,
      categoryIds: filters.categoryIds,
      location: filters.location,
      startFrom: filters.startFrom,
      startTo: filters.startTo,
      endFrom: filters.endFrom,
      endTo: filters.endTo,
      createdBy: filters.createdBy,
      sortBy: filters.sortBy,
      sortDescending: filters.sortDescending,
    };

    // Combine pagination and filter parameters
    const params = { ...paginationParams, ...filterParams };

    getCompletedEventsWithFilter(params)
      .then((res) => {
        if (res && res.data) {
          setData({
            ...res.data,
            pageSize: filters.pageSize,
          });
          if (onTotalChange) {
            onTotalChange(res.data.totalItems);
          }
        } else {
          setData(null);
          if (onTotalChange) {
            onTotalChange(0);
          }
        }
      })
      .catch(() => {
        setData(null);
        if (onTotalChange) {
          onTotalChange(0);
        }
      })
      .finally(() => {
        setTimeout(() => setLoading(false), 500);
      });
  };

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
    const newSortDescending = sortBy === field ? !sortDescending : true;
    setSortBy(field);
    setSortDescending(newSortDescending);
    setFilters((prev) => ({ ...prev, sortBy: field, sortDescending: newSortDescending }));
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <FaSort className="w-3 h-3 text-gray-400" />;
    }
    return sortDescending ? (
      <FaSortDown className="w-3 h-3 text-blue-600" />
    ) : (
      <FaSortUp className="w-3 h-3 text-blue-600" />
    );
  };

  // Filter handlers
  const updateFilter = (
    key: keyof EventFilterParams,
    value: string | string[] | boolean | undefined
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
    setPage(1);
  };

  // Items and pagination
  const items = data?.items || [];
  const totalItems = data?.totalItems || 0;
  const totalPages = data?.totalPages || 1;

  const handleDelete = async (event: ApprovedEvent) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteEvent(event.eventId);
        toast.success('Event deleted successfully');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete event');
      }
    }
  };

  return (
    <div className="p-3">
      <SpinnerOverlay show={loading} />
      <div className="overflow-x-auto">
        <div className="p-4 bg-white rounded-xl shadow">
          {/* Filter/Search UI */}
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
                  placeholder="Search by event name or creator..."
                  value={completedEventSearch}
                  onChange={(e) => {
                    setCompletedEventSearch(e.target.value);
                    // Reset to page 1 when searching
                    setFilters((prev) => ({ ...prev, page: 1 }));
                    setPage(1);
                  }}
                />
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
                <DropdownMenuContent align="end" className="w-56">
                  {/* Category Filter - only show if categories exist */}
                  {allCategories.length > 0 && (
                    <>
                      <div className="px-2 py-1 text-sm font-semibold">Category</div>
                      <DropdownMenuItem
                        onSelect={() => updateFilter('categoryIds', undefined)}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="checkbox"
                          checked={!filters.categoryIds || filters.categoryIds.length === 0}
                          readOnly
                          className="mr-2"
                        />
                        <span>All</span>
                      </DropdownMenuItem>
                      {allCategories.map((category) => (
                        <DropdownMenuItem
                          key={category}
                          onSelect={() => {
                            const currentIds = filters.categoryIds || [];
                            const newIds = currentIds.includes(category)
                              ? currentIds.filter((id) => id !== category)
                              : [...currentIds, category];
                            updateFilter('categoryIds', newIds);
                          }}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="checkbox"
                            checked={filters.categoryIds?.includes(category) || false}
                            readOnly
                            className="mr-2"
                          />
                          <span>{category}</span>
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                    </>
                  )}

                  {/* Date Range Filters */}
                  <div className="px-2 py-1 text-sm font-semibold">Start Date Range</div>
                  <DropdownMenuItem
                    className="flex flex-col items-start p-3"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <div className="space-y-2 w-full">
                      <input
                        type="date"
                        placeholder="From..."
                        value={filters.startFrom || ''}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateFilter('startFrom', e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        type="date"
                        placeholder="To..."
                        value={filters.startTo || ''}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateFilter('startTo', e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Table */}
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="bg-blue-200 hover:bg-blue-200">
                <TableHead className="text-center" style={{ width: '5%' }}>
                  #
                </TableHead>
                <TableHead style={{ width: '20%' }}>
                  <div
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort('eventName')}
                  >
                    Event Name
                    {getSortIcon('eventName')}
                  </div>
                </TableHead>
                <TableHead style={{ width: '10%' }}>
                  <div
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort('categoryName')}
                  >
                    Category
                    {getSortIcon('categoryName')}
                  </div>
                </TableHead>
                <TableHead style={{ width: '10%' }}>
                  <div
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort('startAt')}
                  >
                    Start Date
                    {getSortIcon('startAt')}
                  </div>
                </TableHead>
                <TableHead style={{ width: '10%' }}>
                  <div
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort('endAt')}
                  >
                    End Date
                    {getSortIcon('endAt')}
                  </div>
                </TableHead>
                <TableHead style={{ width: '15%' }}>
                  <div
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort('approvedByName')}
                  >
                    Approved By
                    {getSortIcon('approvedByName')}
                  </div>
                </TableHead>
                <TableHead style={{ width: '15%' }}>
                  <div
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort('createByName')}
                  >
                    Created By
                    {getSortIcon('createByName')}
                  </div>
                </TableHead>
                <TableHead style={{ width: '10%' }}>
                  <div
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort('createdAt')}
                  >
                    Created At
                    {getSortIcon('createdAt')}
                  </div>
                </TableHead>
                <TableHead className="text-center">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="min-h-[400px]">
              {items.length === 0 ? (
                <>
                  {/* Show 5 empty rows when no data */}
                  {Array.from({ length: 5 }, (_, idx) => (
                    <TableRow key={`empty-${idx}`} className="h-[56.8px]">
                      <TableCell colSpan={8} className="border-0"></TableCell>
                    </TableRow>
                  ))}
                </>
              ) : (
                <>
                  {items.map((event, idx) => (
                    <TableRow key={event.eventId} className="hover:bg-blue-50">
                      <TableCell className="text-center">
                        {((page || 1) - 1) * (pageSize || 5) + idx + 1}
                      </TableCell>
                      <TableCell className="truncate max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap">
                        {event.eventName}
                      </TableCell>
                      <TableCell className="truncate max-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap">
                        {event.categoryName && event.categoryName.length > 0
                          ? event.categoryName.join(', ')
                          : 'Unknown'}
                      </TableCell>
                      <TableCell className="truncate max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap">
                        {event.startAt ? new Date(event.startAt).toLocaleDateString() : 'Unknown'}
                      </TableCell>
                      <TableCell className="truncate max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap">
                        {event.endAt ? new Date(event.endAt).toLocaleDateString() : 'Unknown'}
                      </TableCell>
                      <TableCell className="truncate max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap">
                        {event.approvedByName || 'Unknown'}
                      </TableCell>
                      <TableCell className="truncate max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap">
                        {event.createByName || 'Unknown'}
                      </TableCell>
                      <TableCell className="truncate max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap">
                        {event.createdAt ? new Date(event.createdAt).toLocaleString() : 'Unknown'}
                      </TableCell>
                      <TableCell className="text-center flex gap-2 justify-center">
                        <button
                          className="border-2 border-yellow-400 bg-yellow-400 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white flex items-center justify-center hover:bg-yellow-500 hover:text-white"
                          onClick={() => setSelectedEvent(event)}
                        >
                          <FaEye className="w-4 h-4" />
                        </button>
                        <button
                          className="border-2 border-red-500 bg-red-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-white hover:text-red-500 hover:border-red-500"
                          title="Delete"
                          onClick={() => handleDelete(event)}
                        >
                          <FaRegTrashAlt className="w-4 h-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Add empty rows to maintain table height */}
                  {Array.from(
                    {
                      length: Math.max(0, 5 - items.length),
                    },
                    (_, idx) => (
                      <TableRow key={`empty-${idx}`} className="h-[56.8px]">
                        <TableCell colSpan={8} className="border-0"></TableCell>
                      </TableRow>
                    )
                  )}
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
                              if (filters.page <= 4) {
                                // Trang hiện tại ở đầu
                                for (let i = 1; i <= 5; i++) {
                                  pages.push(i);
                                }
                                pages.push('...');
                                pages.push(totalPages);
                              } else if (filters.page >= totalPages - 3) {
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
                                for (let i = filters.page - 1; i <= filters.page + 1; i++) {
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
                                    isActive={item === filters.page}
                                    onClick={() => handlePageChange(item as number)}
                                    className={`transition-colors rounded 
                                       ${
                                         item === filters.page
                                           ? 'bg-blue-500 text-white border hover:bg-blue-700 hover:text-white'
                                           : 'text-gray-700 hover:bg-slate-200 hover:text-black'
                                       }
                                       px-2 py-1 mx-0.5`}
                                    style={{
                                      minWidth: 32,
                                      textAlign: 'center',
                                      fontWeight: item === filters.page ? 700 : 400,
                                      cursor: item === filters.page ? 'default' : 'pointer',
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
                          : `${((page || 1) - 1) * (pageSize || 5) + 1}-${Math.min(
                              (page || 1) * (pageSize || 5),
                              totalItems
                            )} of ${totalItems}`}
                      </span>
                      <span className="text-sm text-gray-700">Rows per page</span>
                      <select
                        className="border rounded px-2 py-1 text-sm bg-white"
                        value={pageSize}
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
          {selectedEvent && (
            <CompletedEventDetailModal
              event={selectedEvent}
              onClose={() => setSelectedEvent(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
};
