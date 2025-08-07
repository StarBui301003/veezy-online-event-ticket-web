import { useEffect, useState, useRef, useCallback } from 'react';
import { getPaymentsAdmin, PaymentFilterParams } from '@/services/Admin/order.service';
import type { AdminPayment, AdminPaymentListResponse } from '@/types/Admin/order';
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
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
} from '@/components/ui/pagination';
import PaymentDetailModal from './PaymentDetailModal';
import GenerateTicketModal from './GenerateTicketModal';
import { FaEye, FaFilter, FaSort, FaSortUp, FaSortDown, FaTicketAlt } from 'react-icons/fa';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { connectNotificationHub, onNotification } from '@/services/signalr.service';
import { formatCurrency } from '@/utils/format';
import { useThemeClasses } from '@/hooks/useThemeClasses';

const pageSizeOptions = [5, 10, 20, 50];

const PaymentListAdmin = () => {
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
  const [data, setData] = useState<AdminPaymentListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminPayment | null>(null);
  const [showGenerateTicketModal, setShowGenerateTicketModal] = useState(false);

  // Search and filter states
  const [paymentSearch, setPaymentSearch] = useState('');
  const [filters, setFilters] = useState<PaymentFilterParams>({
    Page: 1,
    PageSize: 5,
    SortDescending: true,
  });
  const [sortBy, setSortBy] = useState<string>('paidAt');
  const [sortDescending, setSortDescending] = useState(true);

  // Slider states for amount range
  const [amountRange, setAmountRange] = useState<[number, number]>([0, 1000000]);
  const [maxAmount, setMaxAmount] = useState(1000000);

  const pageRef = useRef(filters.Page);
  const pageSizeRef = useRef(filters.PageSize);
  const searchRef = useRef(paymentSearch);

  useEffect(() => {
    pageRef.current = filters.Page;
  }, [filters.Page]);
  useEffect(() => {
    pageSizeRef.current = filters.PageSize;
  }, [filters.PageSize]);
  useEffect(() => {
    searchRef.current = paymentSearch;
  }, [paymentSearch]);

  // Connect hub chỉ 1 lần khi mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    // Payment events are sent via NotificationHub from TicketService
    connectNotificationHub('https://ticket.vezzy.site/notificationHub', token);
    const reload = () => {
      fetchData();
    };
    onNotification('OnPaymentCreated', reload);
    onNotification('OnPaymentVerified', reload);
    onNotification('OnPaymentListFetched', reload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = useCallback(() => {
    setLoading(true);

    // Separate pagination parameters from filter parameters
    const paginationParams = {
      Page: paymentSearch ? 1 : filters.Page,
      PageSize: filters.PageSize,
    };

    const filterParams = {
      SearchTerm: paymentSearch,
      MinAmount: amountRange[0] > 0 ? amountRange[0] : undefined,
      MaxAmount: amountRange[1] < maxAmount ? amountRange[1] : undefined,
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
    console.log('🔍 Payment Search Parameters:', {
      pagination: paginationParams,
      filters: filterParams,
      paymentSearch: paymentSearch,
    });

    // Combine pagination and filter parameters
    const params = { ...paginationParams, ...filterParams };

    getPaymentsAdmin(params)
      .then(async (res) => {
        if (res && res.success && res.data) {
          setData(res);
          // Calculate max amount from data
          const maxAmountInData =
            res.data.items.length > 0
              ? Math.max(...res.data.items.map((item) => parseFloat(item.amount || '0')))
              : 1000000;
          setMaxAmount(maxAmountInData);
          console.log(
            '🔍 Max Amount calculated:',
            maxAmountInData,
            'Items count:',
            res.data.items.length,
            'All amounts:',
            res.data.items.map((item) => item.amount)
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
  }, [paymentSearch, filters, amountRange, maxAmount, sortBy, sortDescending]);

  // Chỉ gọi fetchData khi [filters, sortBy, sortDescending, paymentSearch] đổi
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sortBy, sortDescending, paymentSearch]);

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

  // Filter handlers
  const refreshData = () => {
    setPaymentSearch(''); // Reset search when refresh
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
          <Badge className="border-green-500 bg-green-500 text-white items-center border-2 rounded-[10px] cursor-pointer transition-all hover:bg-green-600 hover:text-white">
            Success
          </Badge>
        );
      case '1':
        return (
          <Badge className="border-red-500 bg-red-500 text-white items-center border-2 rounded-[10px] cursor-pointer transition-all hover:bg-red-600 hover:text-white">
            Failed
          </Badge>
        );
      case '2':
        return (
          <Badge className="border-yellow-500 bg-yellow-500 text-white items-center border-2 rounded-[10px] cursor-pointer transition-all hover:bg-yellow-600 hover:text-white">
            Pending
          </Badge>
        );
      case '3':
        return (
          <Badge className="border-blue-500 bg-blue-500 text-white items-center border-2 rounded-[10px] cursor-pointer transition-all hover:bg-blue-600 hover:text-white">
            Processing
          </Badge>
        );
      case '4':
        return (
          <Badge className="border-green-500 bg-green-500 text-white items-center border-2 rounded-[10px] cursor-pointer transition-all hover:bg-green-600 hover:text-white">
            Paid
          </Badge>
        );
      case '5':
        return (
          <Badge className="border-red-500 bg-red-500 text-white items-center border-2 rounded-[10px] cursor-pointer transition-all hover:bg-red-600 hover:text-white">
            Rejected
          </Badge>
        );
      case '6':
        return (
          <Badge className="border-gray-500 bg-gray-500 text-white items-center border-2 rounded-[10px] cursor-pointer transition-all hover:bg-gray-600 hover:text-white">
            Other
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

  const getMethodBadge = (method: string | number) => {
    const methodStr = method.toString();
    switch (methodStr) {
      case '0':
        return (
          <Badge className="border-blue-500 bg-blue-500 text-white items-center border-2 rounded-[10px] cursor-pointer transition-all hover:bg-blue-600 hover:text-white">
            VietQR
          </Badge>
        );
      case '1':
        return (
          <Badge className="border-purple-500 bg-purple-500 text-white items-center border-2 rounded-[10px] cursor-pointer transition-all hover:bg-purple-600 hover:text-white">
            Momo
          </Badge>
        );
      case '2':
        return (
          <Badge className="border-blue-500 bg-blue-500 text-white items-center border-2 rounded-[10px] cursor-pointer transition-all hover:bg-blue-600 hover:text-white">
            VnPay
          </Badge>
        );
      case '3':
        return (
          <Badge className="border-gray-500 bg-gray-500 text-white items-center border-2 rounded-[10px] cursor-pointer transition-all hover:bg-gray-600 hover:text-white">
            Other
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
                  value={paymentSearch}
                  onChange={(e) => {
                    setPaymentSearch(e.target.value);
                    // Reset to page 1 when searching
                    setFilters((prev) => ({ ...prev, Page: 1 }));
                  }}
                />
                {paymentSearch && (
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
                      setPaymentSearch('');
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
              <button
                className="flex gap-2 items-center border-2 border-purple-500 bg-purple-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-purple-600 hover:text-white hover:border-purple-500"
                onClick={() => setShowGenerateTicketModal(true)}
              >
                <FaTicketAlt />
                Generate Ticket
              </button>
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

                <TableHead className="text-gray-900" style={{ width: '15%' }}>
                  <div
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort('orderId')}
                  >
                    Order ID
                    {getSortIcon('orderId')}
                  </div>
                </TableHead>
                <TableHead className="text-center text-gray-900" style={{ width: '15%' }}>
                  <div
                    className="flex items-center gap-1 cursor-pointer justify-center"
                    onClick={() => handleSort('amount')}
                  >
                    Amount
                    {getSortIcon('amount')}
                  </div>
                </TableHead>
                <TableHead className="text-center text-gray-900" style={{ width: '15%' }}>
                  <div
                    className="flex items-center gap-1 cursor-pointer justify-center"
                    onClick={() => handleSort('paymentMethod')}
                  >
                    Payment Method
                    {getSortIcon('paymentMethod')}
                  </div>
                </TableHead>
                <TableHead className="text-center text-gray-900" style={{ width: '15%' }}>
                  <div
                    className="flex items-center gap-1 cursor-pointer justify-center"
                    onClick={() => handleSort('paymentStatus')}
                  >
                    Status
                    {getSortIcon('paymentStatus')}
                  </div>
                </TableHead>
                <TableHead className="text-gray-900" style={{ width: '15%' }}>
                  <div
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort('paidAt')}
                  >
                    Paid At
                    {getSortIcon('paidAt')}
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
                  {/* Show "No payments found" message */}
                  <TableRow
                    className={`${getAdminListTableRowClass()} ${getAdminListTableCellBorderClass()}`}
                  >
                    <TableCell
                      colSpan={7}
                      className="text-center py-4 text-gray-500 dark:text-gray-400"
                    >
                      No payments found.
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
                        <TableCell colSpan={7} className="border-0"></TableCell>
                      </TableRow>
                    )
                  )}
                </>
              ) : (
                <>
                  {items.map((item, idx) => (
                    <TableRow
                      key={item.paymentId || idx}
                      className={`${getAdminListTableRowClass()} ${getAdminListTableCellBorderClass()}`}
                    >
                      <TableCell className={`text-center ${getAdminListTableCellClass()}`}>
                        {(filters.Page - 1) * filters.PageSize + idx + 1}
                      </TableCell>

                      <TableCell className={`font-mono text-sm ${getAdminListTableCellClass()}`}>
                        {item.orderId || 'N/A'}
                      </TableCell>
                      <TableCell
                        className={`text-center font-semibold ${getAdminListTableCellClass()}`}
                      >
                        {item.amount ? formatCurrency(parseFloat(item.amount)) : 'N/A'}
                      </TableCell>
                      <TableCell className={`text-center ${getAdminListTableCellClass()}`}>
                        <div className="flex justify-center">
                          {item.paymentMethod !== null ? (
                            getMethodBadge(item.paymentMethod)
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">N/A</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className={`text-center ${getAdminListTableCellClass()}`}>
                        <div className="flex justify-center">
                          {item.paymentStatus !== null ? (
                            getStatusBadge(item.paymentStatus)
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">N/A</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell
                        className={`truncate max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap ${getAdminListTableCellClass()}`}
                      >
                        {item.paidAt ? new Date(item.paidAt).toLocaleString('vi-VN') : 'N/A'}
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
                        <TableCell colSpan={7} className="border-0"></TableCell>
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
                <TableCell colSpan={7} className="border-0">
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
        <PaymentDetailModal
          payment={selected}
          onClose={() => setSelected(null)}
          onRefresh={refreshData}
        />
      )}

      {/* Generate Ticket Modal */}
      <GenerateTicketModal
        open={showGenerateTicketModal}
        onClose={() => setShowGenerateTicketModal(false)}
      />
    </div>
  );
};

export default PaymentListAdmin;
