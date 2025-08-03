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
import { Slider } from '@/components/ui/slider';
import { connectOrderHub, onOrder } from '@/services/signalr.service';
import { formatCurrency } from '@/utils/format';

const pageSizeOptions = [5, 10, 20, 50];

const OrderListAdmin = () => {
  const [data, setData] = useState<AdminOrderListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminOrder | null>(null);

  // Search and filter states
  const [orderSearch, setOrderSearch] = useState('');
  const [filters, setFilters] = useState<OrderFilterParams>({
    Page: 1,
    PageSize: 5,
    SortDescending: true,
  });
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortDescending, setSortDescending] = useState(true);

  // Slider states for amount range
  const [amountRange, setAmountRange] = useState<[number, number]>([0, 1000000]);
  const [maxAmount, setMaxAmount] = useState(1000000);

  // Event filter state
  const [selectedEventId, setSelectedEventId] = useState<string>('');

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
    connectOrderHub('http://localhost:5005/orderHub', token);
    const reload = () => {
      fetchData();
    };
    onOrder('OnOrderCreated', reload);
    onOrder('OnOrderStatusChanged', reload);
    onOrder('OnOrderPaid', reload);
    onOrder('OnOrderCancelled', reload);
    onOrder('OnOrderRefunded', reload);
    onOrder('OnOrderExpired', reload);
    onOrder('OnOrderFailed', reload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = useCallback(() => {
    setLoading(true);

    // Separate pagination parameters from filter parameters
    const paginationParams = {
      Page: orderSearch ? 1 : filters.Page,
      PageSize: filters.PageSize,
    };

    const filterParams = {
      SearchTerm: orderSearch,
      MinAmount: amountRange[0] > 0 ? amountRange[0] : undefined,
      MaxAmount: amountRange[1] < maxAmount ? amountRange[1] : undefined,
      EventId: selectedEventId || undefined,
      SortBy: sortBy,
      SortDescending: sortDescending,
    };

    // Debug: Log amount range values
    console.log('🔍 Amount Range Debug:', {
      amountRange,
      maxAmount,
      minAmount: filterParams.MinAmount,
      maxAmountFilter: filterParams.MaxAmount,
    });

    // Debug: Log search parameters
    console.log('🔍 Order Search Parameters:', {
      pagination: paginationParams,
      filters: filterParams,
      orderSearch: orderSearch,
    });

    // Combine pagination and filter parameters
    const params = { ...paginationParams, ...filterParams };

    getOrdersAdmin(params)
      .then(async (res) => {
        if (res && res.success && res.data) {
          setData(res);
          // Calculate max amount from data
          const maxAmountInData =
            res.data.items.length > 0
              ? Math.max(...res.data.items.map((item) => item.totalAmount))
              : 1000000;
          setMaxAmount(maxAmountInData);
          console.log(
            '🔍 Max Amount calculated:',
            maxAmountInData,
            'Items count:',
            res.data.items.length,
            'All amounts:',
            res.data.items.map((item) => item.totalAmount)
          );
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
  }, [orderSearch, filters, amountRange, maxAmount, sortBy, sortDescending, selectedEventId]);

  // Chỉ gọi fetchData khi [filters, sortBy, sortDescending, orderSearch, selectedEventId] đổi
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sortBy, sortDescending, orderSearch, selectedEventId]);

  // Update amountRange when maxAmount changes (but not on initial load)
  useEffect(() => {
    if (maxAmount > 0 && amountRange[1] === 1000000) {
      setAmountRange([0, maxAmount]);
    }
  }, [maxAmount]);

  // Handle amountRange changes separately
  useEffect(() => {
    // Skip initial render
    if (amountRange[0] === 0 && amountRange[1] === 1000000) return;

    // Always fetch when amountRange changes (including when dragged to 0)
    fetchData();
  }, [amountRange]);

  // Handle event filter changes
  useEffect(() => {
    if (selectedEventId !== '') {
      fetchData();
    }
  }, [selectedEventId, fetchData]);

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, Page: newPage }));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setFilters((prev) => ({ ...prev, Page: 1, PageSize: newPageSize }));
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

  const refreshData = () => {
    setOrderSearch(''); // Reset search when refresh
    setFilters((prev) => ({ ...prev, Page: 1 })); // Reset to page 1
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
            <div className="flex items-center gap-2">
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
                    const uniqueEvents = data?.data?.items
                      ? Array.from(
                          new Map(
                            data.data.items.map((item) => [item.eventId, item.eventName])
                          ).entries()
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

                  {/* Amount Range Filters */}
                  <div className="px-2 py-1 text-sm font-semibold">Amount Range</div>
                  <DropdownMenuItem
                    className="flex flex-col items-start p-4"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <div className="space-y-4 w-full">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Min: {formatCurrency(amountRange[0])}</span>
                          <span>Max: {formatCurrency(amountRange[1])}</span>
                        </div>
                        <Slider
                          value={amountRange}
                          onValueChange={(value) => setAmountRange(value as [number, number])}
                          max={maxAmount}
                          min={0}
                          step={10000}
                          className="w-full"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAmountRange([0, maxAmount]);
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
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="bg-green-200 hover:bg-green-200">
                <TableHead className="text-center" style={{ width: '5%' }}>
                  #
                </TableHead>
                <TableHead style={{ width: '15%' }}>
                  <div
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort('orderId')}
                  >
                    Order ID
                    {getSortIcon('orderId')}
                  </div>
                </TableHead>
                <TableHead style={{ width: '15%' }}>
                  <div
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort('customerName')}
                  >
                    Customer Name
                    {getSortIcon('customerName')}
                  </div>
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
                <TableHead style={{ width: '15%' }}>
                  <div
                    className="flex items-center gap-1 cursor-pointer justify-center"
                    onClick={() => handleSort('totalAmount')}
                  >
                    Total Amount
                    {getSortIcon('totalAmount')}
                  </div>
                </TableHead>
                <TableHead style={{ width: '15%' }}>
                  <div
                    className="flex items-center gap-1 cursor-pointer justify-center"
                    onClick={() => handleSort('orderStatus')}
                  >
                    Status
                    {getSortIcon('orderStatus')}
                  </div>
                </TableHead>
                <TableHead style={{ width: '15%' }}>
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
                  {items.map((item, idx) => (
                    <TableRow key={item.orderId} className="hover:bg-green-50">
                      <TableCell className="text-center">
                        {(filters.Page - 1) * filters.PageSize + idx + 1}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{item.orderId}</TableCell>
                      <TableCell className="truncate max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap">
                        {item.customerName}
                      </TableCell>
                      <TableCell className="truncate max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap">
                        {item.eventName}
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {formatCurrency(item.totalAmount)}
                      </TableCell>
                      <TableCell className="text-center flex justify-center">
                        {getStatusBadge(item.orderStatus)}
                      </TableCell>
                      <TableCell className="truncate max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap">
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
                              onClick={() => handlePageChange(Math.max(1, filters.Page - 1))}
                              aria-disabled={filters.Page === 1}
                              className={filters.Page === 1 ? 'pointer-events-none opacity-50' : ''}
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
                                  <span className="px-2 py-1 text-gray-500">...</span>
                                ) : (
                                  <PaginationLink
                                    isActive={item === filters.Page}
                                    onClick={() => handlePageChange(item as number)}
                                    className={`transition-colors rounded 
                                      ${
                                        item === filters.Page
                                          ? 'bg-green-500 text-white border hover:bg-green-700 hover:text-white'
                                          : 'text-gray-700 hover:bg-slate-200 hover:text-black'
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
                              className={
                                filters.Page === totalPages ? 'pointer-events-none opacity-50' : ''
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
                          : `${(filters.Page - 1) * filters.PageSize + 1}-${Math.min(
                              filters.Page * filters.PageSize,
                              totalItems
                            )} of ${totalItems}`}
                      </span>
                      <span className="text-sm text-gray-700">Rows per page</span>
                      <select
                        className="border rounded px-2 py-1 text-sm bg-white"
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
