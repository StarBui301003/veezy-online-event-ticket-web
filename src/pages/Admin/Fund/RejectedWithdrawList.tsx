import { useEffect, useState, useRef } from 'react';
import { getRejectedWithdrawals, FundFilterParams } from '@/services/Admin/fund.service';
import type { WithdrawalRequestDto, PaginatedResponseDto } from '@/types/Admin/fund';
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
import FundDetailModal from './FundDetailModal';
import { FaEye, FaFilter, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { Badge } from '@/components/ui/badge';
import { DualRangeSlider } from '@/components/ui/dual-range-slider';
import { connectFundHub, onFund } from '@/services/signalr.service';
import { formatCurrency } from '@/utils/format';
import { useThemeClasses } from '@/hooks/useThemeClasses';

const pageSizeOptions = [5, 10, 20, 50];

const RejectedWithdrawList = ({ onRejectedChanged }: { onRejectedChanged?: () => void }) => {
  const {
    getProfileInputClass,
    getAdminListCardClass,
    getAdminListTableClass,
    getAdminListTableRowClass,
    getAdminListTableCellClass,
    getAdminListDropdownClass,
    getAdminListPageSizeSelectClass,
    getAdminListTableBorderClass,
    getAdminListTableCellBorderClass,
    getAdminListTableHeaderBorderClass,
  } = useThemeClasses();
  const [data, setData] = useState<PaginatedResponseDto<WithdrawalRequestDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<WithdrawalRequestDto | null>(null);

  // Search and filter states
  const [rejectedSearch, setRejectedSearch] = useState('');
  const [filters, setFilters] = useState<FundFilterParams>({
    Page: 1,
    PageSize: 5,
    SortDescending: true,
  });
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortDescending, setSortDescending] = useState(true);

  // Slider states for amount range
  const [amountRange, setAmountRange] = useState<[number, number]>([0, 1000000]);
  const [maxAmount, setMaxAmount] = useState(1000000);
  const [globalMaxAmount, setGlobalMaxAmount] = useState(1000000);

  const pageRef = useRef(filters.Page);
  const pageSizeRef = useRef(filters.PageSize);
  const searchRef = useRef(rejectedSearch);

  useEffect(() => {
    pageRef.current = filters.Page;
  }, [filters.Page]);
  useEffect(() => {
    pageSizeRef.current = filters.PageSize;
  }, [filters.PageSize]);
  useEffect(() => {
    searchRef.current = rejectedSearch;
  }, [rejectedSearch]);

  // Connect hub chỉ 1 lần khi mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    connectFundHub('https://ticket.vezzy.site/fundHub', token);
    const reload = () => {
      fetchData();
    };
    onFund('OnWithdrawalRequested', reload);
    onFund('OnWithdrawalStatusChanged', reload);
    onFund('OnWithdrawalApproved', reload);
    onFund('OnWithdrawalRejected', reload);
    onFund('OnPaymentConfirmed', reload);
    onFund('OnFundCreated', reload);
    onFund('OnBalanceUpdated', reload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = () => {
    setLoading(true);

    // Separate pagination parameters from filter parameters
    const paginationParams = {
      Page: rejectedSearch ? 1 : filters.Page,
      PageSize: filters.PageSize,
    };

    const filterParams = {
      SearchTerm: rejectedSearch,
      MinAmount: amountRange[0] > 0 ? amountRange[0] : undefined,
      MaxAmount: amountRange[1] < maxAmount ? amountRange[1] : undefined,
      TransactionStatus: filters.TransactionStatus,
      SortBy: sortBy || filters.SortBy,
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
    console.log('🔍 Rejected Fund Search Parameters:', {
      pagination: paginationParams,
      filters: filterParams,
      rejectedSearch: rejectedSearch,
    });

    // Combine pagination and filter parameters
    const params = { ...paginationParams, ...filterParams };

    getRejectedWithdrawals(params)
      .then(async (res) => {
        if (res && res.data && res.data.data) {
          setData(res.data.data);
          // Calculate max amount from current filtered data
          const maxAmountInData =
            res.data.data.items.length > 0
              ? Math.max(...res.data.data.items.map((item) => item.amount))
              : 1000000;
          setMaxAmount(maxAmountInData);

          // Update global max amount if we get data without filters
          if (!rejectedSearch && amountRange[0] === 0 && amountRange[1] === 1000000) {
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
  };

  // Chỉ gọi fetchData khi [filters, sortBy, sortDescending, rejectedSearch] đổi
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sortBy, sortDescending, rejectedSearch]);

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
    setRejectedSearch(''); // Reset search when refresh
    setFilters((prev) => ({ ...prev, Page: 1 })); // Reset to page 1
    onRejectedChanged?.(); // Call callback to update badge
  };

  // Items and pagination
  const items = data?.items || [];
  const totalItems = data?.totalItems || 0;
  const totalPages = data?.totalPages || 1;

  const getStatusBadge = (status: string | number) => {
    const statusStr = status.toString();
    switch (statusStr) {
      case '0':
      case 'Success':
        return (
          <Badge className="border-green-500 bg-green-500 items-center border-2 rounded-[10px] cursor-pointer transition-all text-white hover:bg-green-600 hover:text-white hover:border-green-500">
            Success
          </Badge>
        );
      case '1':
      case 'Failed':
        return (
          <Badge className="border-red-500 bg-red-500 text-white items-center border-2 rounded-[10px] cursor-pointer transition-all hover:bg-red-600 hover:text-white hover:border-red-500">
            Failed
          </Badge>
        );
      case '2':
      case 'Pending':
        return (
          <Badge className="border-yellow-500 bg-yellow-500 text-white items-center border-2 rounded-[10px] cursor-pointer transition-all hover:bg-yellow-600 hover:text-white">
            Pending
          </Badge>
        );
      case '3':
      case 'Processing':
        return (
          <Badge className="border-blue-500 bg-blue-500 text-white items-center border-2 rounded-[10px] cursor-pointer transition-all hover:bg-blue-600 hover:text-white">
            Processing
          </Badge>
        );
      case '4':
      case 'Paid':
        return (
          <Badge className="border-green-500 bg-green-500 text-white items-center border-2 rounded-[10px] cursor-pointer transition-all hover:bg-green-600 hover:text-white">
            Paid
          </Badge>
        );
      case '5':
      case 'Rejected':
        return (
          <Badge className="border-red-500 bg-red-500 text-white items-center border-2 rounded-[10px] cursor-pointer transition-all hover:bg-red-600 hover:text-white">
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="border-black/70 bg-black/70 text-white items-center border-2 rounded-[10px] cursor-pointer transition-all hover:bg-black/100 hover:text-white">
            Other
          </Badge>
        );
    }
  };

  return (
    <div className="p-3">
      <SpinnerOverlay show={loading} />

      <div className="overflow-x-auto">
        <div className={`p-4 rounded-xl shadow ${getAdminListCardClass()}`}>
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
                  value={rejectedSearch}
                  onChange={(e) => {
                    setRejectedSearch(e.target.value);
                    // Reset to page 1 when searching
                    setFilters((prev) => ({ ...prev, Page: 1 }));
                  }}
                />
                {rejectedSearch && (
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
                      setRejectedSearch('');
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
                <DropdownMenuContent align="end" className={`w-56 ${getAdminListDropdownClass()}`}>
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
                        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300">
                          <span>Min: {formatCurrency(amountRange[0])}</span>
                          <span>Max: {formatCurrency(amountRange[1])}</span>
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
                          className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors text-gray-700 dark:text-gray-300"
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
                className={`bg-red-200 hover:bg-red-200 ${getAdminListTableHeaderBorderClass()}`}
              >
                <TableHead className="text-center text-gray-900" style={{ width: '5%' }}>
                  #
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
                <TableHead className="text-gray-900" style={{ width: '15%' }}>
                  <div
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort('amount')}
                    style={{ textAlign: 'center', display: 'flex', justifyContent: 'center' }}
                  >
                    Amount
                    {getSortIcon('amount')}
                  </div>
                </TableHead>
                <TableHead className="text-gray-900" style={{ width: '15%' }}>
                  <div
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort('transactionStatus')}
                    style={{ textAlign: 'center', display: 'flex', justifyContent: 'center' }}
                  >
                    Status
                    {getSortIcon('transactionStatus')}
                  </div>
                </TableHead>
                <TableHead className="text-gray-900" style={{ width: '15%' }}>
                  <div
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort('initiatedByName')}
                  >
                    Requested By
                    {getSortIcon('initiatedByName')}
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
                  {/* Show "No rejected withdraw requests found" message */}
                  <TableRow
                    className={`${getAdminListTableRowClass()} ${getAdminListTableCellBorderClass()}`}
                  >
                    <TableCell
                      colSpan={7}
                      className="text-center py-4 text-gray-500 dark:text-gray-400"
                    >
                      No rejected withdraw requests found.
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
                      key={item.transactionId}
                      className={`${getAdminListTableRowClass()} ${getAdminListTableCellBorderClass()}`}
                    >
                      <TableCell className={`text-center ${getAdminListTableCellClass()}`}>
                        {(filters.Page - 1) * filters.PageSize + idx + 1}
                      </TableCell>
                      <TableCell
                        className={`truncate max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap ${getAdminListTableCellClass()}`}
                        title={item.eventName}
                      >
                        {item.eventName}
                      </TableCell>
                      <TableCell
                        className={`text-center ${getAdminListTableCellClass()}`}
                        style={{ textAlign: 'center' }}
                      >
                        {formatCurrency(item.amount)}
                      </TableCell>
                      <TableCell
                        className="text-center"
                        style={{ textAlign: 'center', display: 'flex', justifyContent: 'center' }}
                      >
                        {getStatusBadge(item.transactionStatus)}
                      </TableCell>
                      <TableCell
                        className={`truncate max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap ${getAdminListTableCellClass()}`}
                      >
                        {item.initiatedByName || 'Unknown'}
                      </TableCell>
                      <TableCell
                        className={`truncate max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap ${getAdminListTableCellClass()}`}
                      >
                        {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Unknown'}
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
                              } text-gray-700 dark:text-white`}
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
                                          ? 'bg-red-500 text-white border-red-500 hover:bg-red-700 hover:text-white'
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
                              } text-gray-700 dark:text-white`}
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
        <FundDetailModal
          withdrawal={selected}
          onClose={() => setSelected(null)}
          showActionButtons={false}
          onSuccess={refreshData}
        />
      )}
    </div>
  );
};

export { RejectedWithdrawList };
