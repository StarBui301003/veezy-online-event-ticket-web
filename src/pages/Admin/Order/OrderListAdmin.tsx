import { useEffect, useState, useRef, useCallback } from 'react';
import { getOrdersAdmin, OrderFilterParams } from '@/services/Admin/order.service';
import type { AdminOrder, AdminOrderListResponse } from '@/types/Admin/order';
import SpinnerOverlay from '@/components/SpinnerOverlay';
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
import OrderDetailModal from './OrderDetailModal';
import { FaEye, FaFilter, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { Badge } from '@/components/ui/badge';
import { DualRangeSlider } from '@/components/ui/dual-range-slider';
import { connectTicketHub, onTicket } from '@/services/signalr.service';
import { formatCurrency } from '@/utils/format';
import { useThemeClasses } from '@/hooks/useThemeClasses';

const pageSizeOptions = [5, 10, 20, 50];

const OrderListAdmin = () => {
  const {
    getProfileInputClass,
    getAdminListCardClass,
    getAdminListTableClass,
    getAdminListTableRowClass,
    getAdminListTableCellClass,
    getAdminListDropdownClass,
    getAdminListDropdownItemClass,
    getAdminListPaginationClass,
    getAdminListPageSizeSelectClass,
    getAdminListTableBorderClass,
    getAdminListTableCellBorderClass,
    getAdminListTableHeaderBorderClass,
  } = useThemeClasses();
  const [data, setData] = useState<AdminOrderListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminOrder | null>(null);

  // Search and filter states
  const [orderSearch, setOrderSearch] = useState('');
  const [filters, setFilters] = useState<OrderFilterParams>({
    Page: 1,
    PageSize: 5,
    SortDescending: true,
    EventId: undefined, // Initialize EventId in filters
    SearchTerm: '',
  });
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortDescending, setSortDescending] = useState(true);

  // Slider states for amount range
  const [amountRange, setAmountRange] = useState<[number, number]>([0, 1000000]);
  const [maxAmount, setMaxAmount] = useState(1000000);
  const [globalMaxAmount, setGlobalMaxAmount] = useState(1000000);

  // Store all unique events from complete order list for filter options
  const [allEvents, setAllEvents] = useState<Array<[string, string]>>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  // Remove the separate selectedEventId state since it's now in filters

  const pageRef = useRef(filters.Page);
  const pageSizeRef = useRef(filters.PageSize);
  const searchRef = useRef(orderSearch);

  useEffect(() => {
    pageRef.current = filters.Page;
  }, [filters.Page]);
  useEffect(() => {
    pageSizeRef.current = filters.PageSize;
  }, [filters.PageSize]);
  useEffect(() => {
    searchRef.current = orderSearch;
  }, [orderSearch]);

  // Connect hub chỉ 1 lần khi mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    // TicketService emits order-related events on its NotificationHub (/notificationHub)
    connectTicketHub('https://ticket.vezzy.site/notificationHub', token);
    const reload = () => {
      fetchData();
      // Also refresh events list to include any new events from new orders
      fetchAllEvents();
    };
    onTicket('OnOrderCreated', reload);
    onTicket('OnOrderStatusChanged', reload);
    onTicket('OnOrderPaid', reload);
    onTicket('OnOrderCancelled', reload);
    onTicket('OnOrderRefunded', reload);
    onTicket('OnOrderExpired', reload);
    onTicket('OnOrderFailed', reload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Function to fetch all events for filter options
  const fetchAllEvents = async () => {
    setEventsLoading(true);
    try {
      // Fetch all orders without any filters to get complete event list
      // Using large page size to get most events in one request
      const allOrdersResponse = await getOrdersAdmin({
        Page: 1,
        PageSize: 100, // Large page size to get most events
        SortDescending: false,
      });

      if (allOrdersResponse && allOrdersResponse.success && allOrdersResponse.data) {
        const allUniqueEvents = Array.from(
          new Map(
            allOrdersResponse.data.items.map((item) => [item.eventId, item.eventName])
          ).entries()
        );
        setAllEvents(allUniqueEvents);
      } else {
        console.warn('Failed to get events for filter options:', allOrdersResponse?.message);
      }
    } catch (error) {
      console.error('Failed to fetch all events for filter options:', error);
      setAllEvents([]); // Reset to empty array on error
    } finally {
      setEventsLoading(false);
    }
  };

  // Fetch all events for filter options on component mount
  useEffect(() => {
    fetchAllEvents();
  }, []);

  const fetchData = useCallback(
    (showLoading = true) => {
      if (showLoading && !filters._searchOnly) setLoading(true);

      // Separate pagination parameters from filter parameters
      const paginationParams = {
        Page: orderSearch ? 1 : filters.Page,
        PageSize: filters.PageSize,
      };

      const filterParams = {
        SearchTerm: orderSearch,
        MinAmount: amountRange[0],
        MaxAmount: amountRange[1],
        EventId: filters.EventId || undefined,
        SortBy: sortBy,
        SortDescending: sortDescending,
      };

      // Combine pagination and filter parameters
      const params = { ...paginationParams, ...filterParams };

      getOrdersAdmin(params)
        .then(async (res) => {
          if (res && res.success && res.data) {
            setData(res);

            // Calculate max amount from current filtered data
            const maxAmountInData =
              res.data.items.length > 0
                ? Math.max(...res.data.items.map((item) => item.totalAmount))
                : 1000000;
            setMaxAmount(maxAmountInData);

            // Update global max amount if we get data without filters
            if (!orderSearch && amountRange[0] === 0 && amountRange[1] === 1000000) {
              setGlobalMaxAmount(maxAmountInData);
            }
          } else {
            setData(null);
          }
        })
        .catch(() => {
          setData(null);
        })
        .finally(() => {
          setTimeout(() => setLoading(false), 500);
        });
    },
    [orderSearch, filters, amountRange, maxAmount, sortBy, sortDescending]
  );

  // Khi orderSearch thay đổi, cập nhật filters và đánh dấu là searchOnly
  useEffect(() => {
    setFilters((prev) => ({ ...prev, SearchTerm: orderSearch, _searchOnly: true }));
    setFilters((prev) => ({ ...prev, Page: 1 }));
  }, [orderSearch]);

  // Khi filter/sort thay đổi
  useEffect(() => {
    // Nếu chỉ search thì không loading
    fetchData(filters._searchOnly ? false : true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sortBy, sortDescending]);

  // Filter handlers
  const updateFilter = (
    key: keyof OrderFilterParams,
    value: string | number | boolean | undefined
  ) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value, Page: 1 };
      delete next._searchOnly; // Bỏ _searchOnly flag khi filter thay đổi
      return next;
    });
  };

  // Chỉ gọi fetchData khi [filters, sortBy, sortDescending, orderSearch] đổi
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sortBy, sortDescending, orderSearch]);

  // Update amountRange when maxAmount changes (but not on initial load)
  useEffect(() => {
    if (maxAmount > 0 && amountRange[1] === 1000000) {
      setAmountRange([0, maxAmount]);
    }
  }, [maxAmount, amountRange]);

  // Update amountRange when globalMaxAmount changes (for initial load)
  useEffect(() => {
    if (globalMaxAmount > 0 && globalMaxAmount !== 1000000) {
      setAmountRange([0, globalMaxAmount]);
      setMaxAmount(globalMaxAmount);
    }
  }, [globalMaxAmount]);

  // Handle amountRange changes separately with debouncing
  useEffect(() => {
    // Skip initial render
    if (amountRange[0] === 0 && amountRange[1] === 1000000) return;

    // Debounce the fetchData call to avoid excessive API calls
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [amountRange]);

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setFilters((prev) => {
      const next = { ...prev, Page: newPage };
      delete next._searchOnly;
      return next;
    });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setFilters((prev) => {
      const next = { ...prev, Page: 1, PageSize: newPageSize };
      delete next._searchOnly;
      return next;
    });
  };

  // Sort handlers
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDescending(!sortDescending);
    } else {
      setSortBy(field);
      setSortDescending(true);
    }
    // Bỏ _searchOnly flag khi sort
    setFilters((prev) => {
      const next = { ...prev };
      delete next._searchOnly;
      return next;
    });
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

  const refreshData = () => {
    setOrderSearch(''); // Reset search when refresh
    setFilters((prev) => ({ ...prev, Page: 1 })); // Reset to page 1
    // Also refresh events list to ensure it's up-to-date
    fetchAllEvents();
  };

  // Items and pagination
  const items = data?.data?.items || [];
  const totalItems = data?.data?.totalItems || 0;
  const totalPages = data?.data?.totalPages || 1;

  const getStatusBadge = (status: string | number) => {
    const statusStr = status.toString();
    switch (statusStr) {
      case '0':
        return (
          <Badge className="border-yellow-500 bg-yellow-500 text-white items-center border-2 rounded-[10px] cursor-pointer transition-all hover:bg-yellow-600 hover:text-white">
            Pending
          </Badge>
        );
      case '1':
        return (
          <Badge className="border-green-500 bg-green-500 text-white items-center border-2 rounded-[10px] cursor-pointer transition-all hover:bg-green-600 hover:text-white">
            Paid
          </Badge>
        );
      case '2':
        return (
          <Badge className="border-red-500 bg-red-500 text-white items-center border-2 rounded-[10px] cursor-pointer transition-all hover:bg-red-600 hover:text-white">
            Cancelled
          </Badge>
        );
      case '3':
        return (
          <Badge className="border-blue-500 bg-blue-500 text-white items-center border-2 rounded-[10px] cursor-pointer transition-all hover:bg-blue-600 hover:text-white">
            Refunded
          </Badge>
        );
      case '4':
        return (
          <Badge className="border-gray-500 bg-gray-500 text-white items-center border-2 rounded-[10px] cursor-pointer transition-all hover:bg-gray-600 hover:text-white">
            Expired
          </Badge>
        );
      case '5':
        return (
          <Badge className="border-gray-500 bg-gray-500 text-white items-center border-2 rounded-[10px] cursor-pointer transition-all hover:bg-gray-600 hover:text-white">
            Other
          </Badge>
        );
      case '6':
        return (
          <Badge className="border-orange-500 bg-orange-500 text-white items-center border-2 rounded-[10px] cursor-pointer transition-all hover:bg-orange-600 hover:text-white">
            Payment Success But Ticket Failed
          </Badge>
        );
      case '7':
        return (
          <Badge className="border-red-500 bg-red-500 text-white items-center border-2 rounded-[10px] cursor-pointer transition-all hover:bg-red-600 hover:text-white">
            Failed
          </Badge>
        );
      default:
        return (
          <Badge className="border-black/70 bg-black/70 text-white items-center border-2 rounded-[10px] cursor-pointer transition-all hover:bg-black/100 hover:text-white">
            Unknown
          </Badge>
        );
    }
  };

  return (
    <div className="p-3">
      <SpinnerOverlay show={loading} />

      <div className="overflow-x-auto">
        <div className={`p-4 ${getAdminListCardClass()}`}>
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
                  className={`w-[300px] h-10 rounded-[30px] px-4 py-2 text-sm transition-colors ${getProfileInputClass()}`}
                  placeholder="Search all columns..."
                  value={orderSearch}
                  onChange={(e) => {
                    setOrderSearch(e.target.value);
                    // Reset to page 1 when searching
                    setFilters((prev) => ({ ...prev, Page: 1 }));
                  }}
                />
                {orderSearch && (
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
                      setOrderSearch('');
                      setFilters((prev) => ({ ...prev, Page: 1 }));
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
            <div className="flex items-center gap-2 ">
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
                  {/* Event Filter */}
                  <div className="px-2 py-1 text-sm font-semibold text-gray-900 dark:text-white">
                    Event
                  </div>
                  <DropdownMenuItem
                    onSelect={() => updateFilter('EventId', undefined)}
                    className={getAdminListDropdownItemClass()}
                  >
                    <input
                      type="radio"
                      name="orderEventFilter"
                      checked={filters.EventId === undefined}
                      readOnly
                      className="mr-2 flex-shrink-0"
                      style={{ minWidth: 16 }}
                    />
                    <span>All Events</span>
                  </DropdownMenuItem>
                  {filters.EventId !== undefined && (
                    <DropdownMenuItem
                      onSelect={() => updateFilter('EventId', undefined)}
                      className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      Clear Filter
                    </DropdownMenuItem>
                  )}
                  {eventsLoading ? (
                    <DropdownMenuItem className="text-xs text-gray-500 dark:text-gray-400">
                      Loading events...
                    </DropdownMenuItem>
                  ) : allEvents.length === 0 ? (
                    <DropdownMenuItem className="text-xs text-gray-500 dark:text-gray-400">
                      No events found.
                    </DropdownMenuItem>
                  ) : (
                    allEvents.map(([eventId, eventName]) => (
                      <DropdownMenuItem
                        key={eventId}
                        onSelect={() => updateFilter('EventId', eventId)}
                        className={getAdminListDropdownItemClass()}
                      >
                        <input
                          type="radio"
                          name="orderEventFilter"
                          checked={filters.EventId === eventId}
                          readOnly
                          className="mr-2 flex-shrink-0"
                          style={{ minWidth: 16 }}
                        />
                        <span className="truncate max-w-40" title={eventName}>
                          {eventName}
                        </span>
                      </DropdownMenuItem>
                    ))
                  )}
                  <DropdownMenuSeparator />

                  {/* Amount Range Filters */}
                  <div className="px-2 py-1 text-sm font-semibold text-gray-900 dark:text-white">
                    Amount Range
                  </div>
                  <DropdownMenuItem
                    className="flex flex-col items-start p-4"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <div className="space-y-4 w-full">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span className="dark:text-white">
                            Min: {formatCurrency(amountRange[0])}
                          </span>
                          <span className="dark:text-white">
                            Max: {formatCurrency(amountRange[1])}
                          </span>
                        </div>
                        <DualRangeSlider
                          value={amountRange}
                          onValueChange={(value) => setAmountRange(value as [number, number])}
                          max={globalMaxAmount}
                          min={0}
                          step={10000}
                          label={(value) => formatCurrency(value)}
                          className="w-full"
                          debounceMs={200}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAmountRange([0, globalMaxAmount]);
                            // Force fetchData after reset
                            setTimeout(() => {
                              fetchData();
                            }, 0);
                          }}
                          className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Table */}
          <Table
            className={`min-w-full ${getAdminListTableClass()} ${getAdminListTableBorderClass()}`}
          >
            <TableHeader>
              <TableRow
                className={`bg-blue-200 hover:bg-blue-200 ${getAdminListTableHeaderBorderClass()}`}
              >
                <TableHead className="text-center text-gray-900" style={{ width: '5%' }}>
                  #
                </TableHead>
                <TableHead className="text-gray-900" style={{ width: '15%' }}>
                  <div
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort('orderId')}
                  >
                    Order ID
                    {getSortIcon('orderId')}
                  </div>
                </TableHead>
                <TableHead className="text-gray-900" style={{ width: '15%' }}>
                  <div
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort('customerName')}
                  >
                    Customer Name
                    {getSortIcon('customerName')}
                  </div>
                </TableHead>
                <TableHead className="text-gray-900" style={{ width: '20%' }}>
                  <div
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort('eventName')}
                  >
                    Event Name
                    {getSortIcon('eventName')}
                  </div>
                </TableHead>
                <TableHead className="text-center text-gray-900" style={{ width: '15%' }}>
                  <div
                    className="flex items-center gap-1 cursor-pointer justify-center"
                    onClick={() => handleSort('totalAmount')}
                  >
                    Total Amount
                    {getSortIcon('totalAmount')}
                  </div>
                </TableHead>
                <TableHead className="text-center text-gray-900" style={{ width: '15%' }}>
                  <div
                    className="flex items-center gap-1 cursor-pointer justify-center"
                    onClick={() => handleSort('orderStatus')}
                  >
                    Status
                    {getSortIcon('orderStatus')}
                  </div>
                </TableHead>
                <TableHead className="text-gray-900" style={{ width: '15%' }}>
                  <div
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort('createdAt')}
                  >
                    Created At
                    {getSortIcon('createdAt')}
                  </div>
                </TableHead>
                <TableHead className="text-center text-gray-900">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody
              className={`min-h-[400px] ${getAdminListTableClass()} ${getAdminListTableBorderClass()}`}
            >
              {items.length === 0 ? (
                <>
                  {/* Show "No orders found" message */}
                  <TableRow
                    className={`${getAdminListTableRowClass()} ${getAdminListTableCellBorderClass()}`}
                  >
                    <TableCell
                      colSpan={8}
                      className="text-center py-4 text-gray-500 dark:text-gray-400"
                    >
                      No orders found.
                    </TableCell>
                  </TableRow>
                  {/* Add empty rows to maintain table height */}
                  {Array.from(
                    {
                      length: filters.PageSize - 1,
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
                  {items.map((item, idx) => (
                    <TableRow
                      key={item.orderId}
                      className={`${getAdminListTableRowClass()} ${getAdminListTableCellBorderClass()}`}
                    >
                      <TableCell className={`text-center ${getAdminListTableCellClass()}`}>
                        {(filters.Page - 1) * filters.PageSize + idx + 1}
                      </TableCell>
                      <TableCell className={`font-mono text-sm ${getAdminListTableCellClass()}`}>
                        {item.orderId}
                      </TableCell>
                      <TableCell
                        className={`truncate max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap ${getAdminListTableCellClass()}`}
                      >
                        {item.customerName}
                      </TableCell>
                      <TableCell
                        className={`truncate max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap ${getAdminListTableCellClass()}`}
                      >
                        {item.eventName}
                      </TableCell>
                      <TableCell
                        className={`text-center font-semibold ${getAdminListTableCellClass()}`}
                      >
                        {formatCurrency(item.totalAmount)}
                      </TableCell>
                      <TableCell
                        className={`text-center flex justify-center ${getAdminListTableCellClass()}`}
                      >
                        {getStatusBadge(item.orderStatus)}
                      </TableCell>
                      <TableCell
                        className={`truncate max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap ${getAdminListTableCellClass()}`}
                      >
                        {new Date(item.createdAt).toLocaleString('vi-VN')}
                      </TableCell>
                      <TableCell className="text-center flex gap-2 justify-center">
                        <button
                          className="border-2 border-yellow-400 bg-yellow-400 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white flex items-center justify-center hover:bg-yellow-500 hover:text-white"
                          onClick={() => setSelected(item)}
                        >
                          <FaEye className="w-4 h-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Add empty rows to maintain table height */}
                  {Array.from(
                    {
                      length: Math.max(0, filters.PageSize - items.length),
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
                              onClick={() => handlePageChange(Math.max(1, filters.Page - 1))}
                              aria-disabled={filters.Page === 1}
                              className={`${
                                filters.Page === 1 ? 'pointer-events-none opacity-50' : ''
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
                              if (filters.Page <= 4) {
                                // Trang hiện tại ở đầu
                                for (let i = 1; i <= 5; i++) {
                                  pages.push(i);
                                }
                                pages.push('...');
                                pages.push(totalPages);
                              } else if (filters.Page >= totalPages - 3) {
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
                                for (let i = filters.Page - 1; i <= filters.Page + 1; i++) {
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
                                    isActive={item === filters.Page}
                                    onClick={() => handlePageChange(item as number)}
                                    className={`transition-colors rounded border
                                      ${
                                        item === filters.Page
                                          ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-700 hover:text-white'
                                          : 'text-gray-700 dark:text-gray-100 border-none hover:bg-slate-200 dark:hover:bg-gray-600 hover:text-black dark:hover:text-white'
                                      }
                                      px-2 py-1 mx-0.5`}
                                    style={{
                                      minWidth: 32,
                                      textAlign: 'center',
                                      fontWeight: item === filters.Page ? 700 : 400,
                                      cursor: item === filters.Page ? 'default' : 'pointer',
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
                                handlePageChange(Math.min(totalPages, filters.Page + 1))
                              }
                              aria-disabled={filters.Page === totalPages}
                              className={`${
                                filters.Page === totalPages ? 'pointer-events-none opacity-50' : ''
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
                          : `${(filters.Page - 1) * filters.PageSize + 1}-${Math.min(
                              filters.Page * filters.PageSize,
                              totalItems
                            )} of ${totalItems}`}
                      </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Rows per page
                      </span>
                      <select
                        className={`border rounded px-2 py-1 text-sm ${getAdminListPageSizeSelectClass()}`}
                        value={filters.PageSize}
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

      {/* Detail Modal */}
      {selected && (
        <OrderDetailModal
          order={selected}
          onClose={() => setSelected(null)}
          onRefresh={refreshData}
        />
      )}
    </div>
  );
};

export default OrderListAdmin;
