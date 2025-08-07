import { useEffect, useState, useRef } from 'react';
import type {
  DiscountCodeResponse,
  DiscountCodeUpdateInput,
  DiscountCodeFilterParams,
} from '@/types/Admin/discountCode';
import { connectEventHub, onEvent } from '@/services/signalr.service';
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
import {
  FaPlus,
  FaRegTrashAlt,
  FaEye,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaFilter,
} from 'react-icons/fa';
import { MdOutlineEdit } from 'react-icons/md';
import { toast } from 'react-toastify';
import {
  getDiscountCodesWithFilter,
  deleteDiscountCode,
} from '@/services/Admin/discountCode.service';
import DiscountCodeDetailModal from '@/pages/Admin/DiscountCode/DiscountCodeDetailModal';
import CreateDiscountCodeModal from '@/pages/Admin/DiscountCode/CreateDiscountCodeModal';
import EditDiscountCodeModal from '@/pages/Admin/DiscountCode/EditDiscountCodeModal';
import { formatDiscountValue, formatMinMaxAmount, getDiscountTypeLabel } from '@/utils/format';
import { useThemeClasses } from '@/hooks/useThemeClasses';

const pageSizeOptions = [5, 10, 20, 50];

export const DiscountCodeList = () => {
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
  const [data, setData] = useState<DiscountCodeResponse['data'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editDiscount, setEditDiscount] = useState<
    (DiscountCodeUpdateInput & { discountId: string }) | null
  >(null);
  const [viewDiscount, setViewDiscount] = useState<
    DiscountCodeResponse['data']['items'][number] | null
  >(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<DiscountCodeFilterParams>({
    page: 1,
    pageSize: 5,
    sortBy: 'createdAt',
    sortDescending: true,
  });
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortDescending, setSortDescending] = useState(true);

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
          connectEventHub('https://event.vezzy.site/notificationHub');

    const reload = () => reloadList();
    onEvent('OnDiscountCodeCreated', reload);
    onEvent('OnDiscountCodeUpdated', reload);
    onEvent('OnDiscountCodeDeleted', reload);
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
      const response = await getDiscountCodesWithFilter(params);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching discount codes:', error);
      toast.error('Failed to fetch discount codes');
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
    key: keyof DiscountCodeFilterParams,
    value: string | string[] | boolean | number | undefined
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
    setPage(1);
  };

  const items = data?.items || [];
  const totalItems = data?.totalItems || 0;
  const totalPages = data?.totalPages || 1;

  const handleDelete = async (item: DiscountCodeResponse['data']['items'][number]) => {
    if (!window.confirm('Are you sure you want to delete this discount code?')) return;
    try {
      await deleteDiscountCode(item.discountId);
      toast.success('Discount code deleted successfully!');
      reloadList();
    } catch {
      toast.error('Cannot delete this discount code!');
    }
  };

  return (
    <div className="p-6">
      <SpinnerOverlay show={loading} />

      {/* Modals */}
      {editDiscount && (
        <EditDiscountCodeModal
          discount={editDiscount}
          onClose={() => setEditDiscount(null)}
          onUpdated={reloadList}
        />
      )}
      {viewDiscount && (
        <DiscountCodeDetailModal discount={viewDiscount} onClose={() => setViewDiscount(null)} />
      )}
      <CreateDiscountCodeModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={reloadList}
      />
      <div className="overflow-x-auto">
        <div className={`p-4 ${getAdminListCardClass()}`}>
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

            {/* Filter and Create buttons (right) */}
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
                  className={`w-56 rounded-xl shadow-2xl p-2 z-[9999] ${getAdminListDropdownClass()}`}
                >
                  {/* Discount Type Filter */}
                  <div className="px-2 py-1 text-sm font-semibold text-gray-900 dark:text-white">
                    Discount Type
                  </div>
                  <DropdownMenuItem
                    onSelect={() => updateFilter('discountType', undefined)}
                    className={getAdminListDropdownItemClass()}
                  >
                    <input
                      type="checkbox"
                      checked={filters.discountType === undefined}
                      readOnly
                      className="mr-2"
                    />
                    <span>All</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => updateFilter('discountType', 0)}
                    className={getAdminListDropdownItemClass()}
                  >
                    <input
                      type="checkbox"
                      checked={filters.discountType === 0}
                      readOnly
                      className="mr-2"
                    />
                    <span>Percentage</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => updateFilter('discountType', 1)}
                    className={getAdminListDropdownItemClass()}
                  >
                    <input
                      type="checkbox"
                      checked={filters.discountType === 1}
                      readOnly
                      className="mr-2"
                    />
                    <span>Fixed</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />

                  {/* Expired Status Filter */}
                  <div className="px-2 py-1 text-sm font-semibold text-gray-900 dark:text-white">
                    Expired Status
                  </div>
                  <DropdownMenuItem
                    onSelect={() => updateFilter('isExpired', undefined)}
                    className={getAdminListDropdownItemClass()}
                  >
                    <input
                      type="checkbox"
                      checked={filters.isExpired === undefined}
                      readOnly
                      className="mr-2"
                    />
                    <span>All</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => updateFilter('isExpired', true)}
                    className={getAdminListDropdownItemClass()}
                  >
                    <input
                      type="checkbox"
                      checked={filters.isExpired === true}
                      readOnly
                      className="mr-2"
                    />
                    <span>Expired</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => updateFilter('isExpired', false)}
                    className={getAdminListDropdownItemClass()}
                  >
                    <input
                      type="checkbox"
                      checked={filters.isExpired === false}
                      readOnly
                      className="mr-2"
                    />
                    <span>Active</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />

                  {/* Availability Filter */}
                  <div className="px-2 py-1 text-sm font-semibold text-gray-900 dark:text-white">
                    Availability
                  </div>
                  <DropdownMenuItem
                    onSelect={() => updateFilter('isAvailable', undefined)}
                    className={getAdminListDropdownItemClass()}
                  >
                    <input
                      type="checkbox"
                      checked={filters.isAvailable === undefined}
                      readOnly
                      className="mr-2"
                    />
                    <span>All</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => updateFilter('isAvailable', true)}
                    className={getAdminListDropdownItemClass()}
                  >
                    <input
                      type="checkbox"
                      checked={filters.isAvailable === true}
                      readOnly
                      className="mr-2"
                    />
                    <span>Available</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => updateFilter('isAvailable', false)}
                    className={getAdminListDropdownItemClass()}
                  >
                    <input
                      type="checkbox"
                      checked={filters.isAvailable === false}
                      readOnly
                      className="mr-2"
                    />
                    <span>Unavailable</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Create button */}
              <button
                className="flex gap-2 items-center border-2 border-green-500 bg-green-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-green-600 hover:text-white hover:border-green-500"
                onClick={() => setShowCreateModal(true)}
              >
                <FaPlus />
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
                <TableHead className="text-gray-900 text-center" style={{ width: '5%' }}>
                  #
                </TableHead>
                <TableHead
                  className="text-gray-900"
                  style={{ width: '10%' }}
                  onClick={() => handleSort('code')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Code
                    {getSortIcon('code')}
                  </div>
                </TableHead>
                <TableHead
                  className="text-gray-900"
                  style={{ width: '15%' }}
                  onClick={() => handleSort('eventName')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Event
                    {getSortIcon('eventName')}
                  </div>
                </TableHead>
                <TableHead
                  className="text-gray-900"
                  style={{ width: '10%' }}
                  onClick={() => handleSort('discountType')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Type
                    {getSortIcon('discountType')}
                  </div>
                </TableHead>
                <TableHead
                  className="text-gray-900"
                  style={{ width: '10%' }}
                  onClick={() => handleSort('value')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Value
                    {getSortIcon('value')}
                  </div>
                </TableHead>
                <TableHead
                  className="text-gray-900"
                  style={{ width: '10%' }}
                  onClick={() => handleSort('minimum')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Minimum
                    {getSortIcon('minimum')}
                  </div>
                </TableHead>
                <TableHead
                  className="text-gray-900"
                  style={{ width: '10%' }}
                  onClick={() => handleSort('maximum')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Maximum
                    {getSortIcon('maximum')}
                  </div>
                </TableHead>
                <TableHead
                  className="text-gray-900"
                  style={{ width: '10%' }}
                  onClick={() => handleSort('expiredAt')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Expired At
                    {getSortIcon('expiredAt')}
                  </div>
                </TableHead>

                <TableHead style={{ width: '10%' }} className="text-gray-900 text-center">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody
              className={`min-h-[400px] ${getAdminListTableClass()} ${getAdminListTableBorderClass()}`}
            >
              {items.length === 0 ? (
                <>
                  {/* Show "No discount codes found" message */}
                  <TableRow
                    className={`${getAdminListTableRowClass()} ${getAdminListTableCellBorderClass()}`}
                  >
                    <TableCell
                      colSpan={11}
                      className="text-center py-4 text-gray-500 dark:text-gray-400"
                    >
                      No discount codes found.
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
                        <TableCell colSpan={11} className="border-0"></TableCell>
                      </TableRow>
                    )
                  )}
                </>
              ) : (
                <>
                  {items.map((item, idx) => (
                    <TableRow
                      key={item.discountId}
                      className={`${getAdminListTableRowClass()} ${getAdminListTableCellBorderClass()}`}
                    >
                      <TableCell className={`pl-4 ${getAdminListTableCellClass()}`}>
                        {((filters.page || 1) - 1) * (filters.pageSize || 5) + idx + 1}
                      </TableCell>
                      <TableCell className={`text-center ${getAdminListTableCellClass()}`}>
                        {item.code}
                      </TableCell>
                      <TableCell
                        className={`truncate whitespace-nowrap overflow-hidden text-ellipsis text-center ${getAdminListTableCellClass()}`}
                      >
                        {item.eventName || 'N/A'}
                      </TableCell>
                      <TableCell
                        className={`truncate whitespace-nowrap overflow-hidden text-ellipsis text-center ${getAdminListTableCellClass()}`}
                      >
                        {getDiscountTypeLabel(item.discountType)}
                      </TableCell>
                      <TableCell className={`text-center ${getAdminListTableCellClass()}`}>
                        {formatDiscountValue(item.value, item.discountType)}
                      </TableCell>
                      <TableCell className={`text-center ${getAdminListTableCellClass()}`}>
                        {formatMinMaxAmount(item.minimum)}
                      </TableCell>
                      <TableCell className={`text-center ${getAdminListTableCellClass()}`}>
                        {formatMinMaxAmount(item.maximum)}
                      </TableCell>
                      <TableCell className={`text-center ${getAdminListTableCellClass()}`}>
                        {new Date(item.expiredAt).toLocaleString()}
                      </TableCell>

                      <TableCell className="text-center flex items-center justify-center gap-2">
                        <button
                          className="border-2 border-yellow-400 bg-yellow-400 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white flex items-center justify-center hover:bg-yellow-500 hover:text-white"
                          title="View details"
                          onClick={() => setViewDiscount(item)}
                        >
                          <FaEye className="w-4 h-4" />
                        </button>
                        <button
                          className="border-2 border-[#24b4fb] bg-[#24b4fb] rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-[#0071e2]"
                          title="Edit"
                          onClick={() =>
                            setEditDiscount({
                              discountId: item.discountId,
                              code: item.code,
                              discountType: item.discountType,
                              value: item.value,
                              minimum: item.minimum,
                              maximum: item.maximum,
                              maxUsage: item.maxUsage,
                              expiredAt: item.expiredAt,
                            })
                          }
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
                      length: Math.max(0, filters.pageSize - items.length),
                    },
                    (_, idx) => (
                      <TableRow
                        key={`empty-${idx}`}
                        className={`h-[56.8px] ${getAdminListTableRowClass()} ${getAdminListTableCellBorderClass()}`}
                      >
                        <TableCell colSpan={11} className="border-0"></TableCell>
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
                <TableCell colSpan={11} className="border-0">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 px-2 py-2">
                    <div className="flex-1 flex justify-center">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => handlePageChange(Math.max(1, (filters.page || 1) - 1))}
                              aria-disabled={(filters.page || 1) === 1}
                              className={`${
                                (filters.page || 1) === 1 ? 'pointer-events-none opacity-50' : ''
                              } ${getAdminListPaginationClass()}`}
                            />
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
                                          ? 'bg-purple-500 text-white border-purple-500 hover:bg-purple-700 hover:text-white'
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
                                  ? 'pointer-events-none opacity-50'
                                  : ''
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
                          : `${((filters.page || 1) - 1) * (filters.pageSize || 5) + 1}-${Math.min(
                              (filters.page || 1) * (filters.pageSize || 5),
                              totalItems
                            )} of ${totalItems}`}
                      </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Rows per page
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

export default DiscountCodeList;
