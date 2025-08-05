import { useEffect, useState, useRef } from 'react';
import { connectFeedbackHub, onFeedback } from '@/services/signalr.service';
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
import { getPendingReportsWithFilter } from '@/services/Admin/report.service';
import type { Report, PaginatedReportResponse, ReportFilterParams } from '@/types/Admin/report';
import { FaEye, FaSort, FaSortUp, FaSortDown, FaFilter } from 'react-icons/fa';
import ReportDetailModal from './ReportDetailModal';
import { useThemeClasses } from '@/hooks/useThemeClasses';

const pageSizeOptions = [5, 10, 20, 50];

const targetTypeMap: Record<number, string> = {
  0: 'News',
  1: 'Event',
  2: 'EventManager',
  3: 'Comment',
  4: 'Other',
};

export const PendingReportList = ({
  onChangePending,
  page,
  pageSize,
  setPage,
  setPageSize,
}: {
  onChangePending?: (totalItems: number) => void;
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
}) => {
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
  const [data, setData] = useState<PaginatedReportResponse['data'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewReport, setViewReport] = useState<Report | null>(null);
  const [filters, setFilters] = useState<ReportFilterParams>({
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
    connectFeedbackHub('http://localhost:5004/feedbackHub');

    const reload = () => fetchData();
    onFeedback('OnReportCreated', reload);
    onFeedback('OnReportStatusChanged', reload);
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
      const response = await getPendingReportsWithFilter(params);
      setData(response.data);
      if (onChangePending) onChangePending(response.data.totalItems);
    } catch (error) {
      console.error('Error fetching pending reports:', error);
    } finally {
      setLoading(false);
    }
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
      <FaSortDown className="w-3 h-3 text-yellow-600" />
    ) : (
      <FaSortUp className="w-3 h-3 text-yellow-600" />
    );
  };

  const updateFilter = (
    key: keyof ReportFilterParams,
    value: string | string[] | boolean | number | undefined
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
    setPage(1);
  };

  const items = data?.items || [];
  const totalItems = data?.totalItems || 0;
  const totalPages = data?.totalPages || 1;

  return (
    <div className="p-6">
      <SpinnerOverlay show={loading} />
      {viewReport && <ReportDetailModal report={viewReport} onClose={() => setViewReport(null)} />}
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
                  placeholder="Search by target name, reason"
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

            {/* Filter button (right) */}
            <div className="flex items-center gap-2">
              {/* Filter dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex gap-2 items-center border-2 border-blue-500 bg-blue-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-blue-600 hover:text-white hover:border-blue-500">
                    <FaFilter />
                    Filter
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className={`w-56 ${getAdminListDropdownClass()}`}>
                  {/* Target Type Filter */}
                  <div className="px-2 py-1 text-sm font-semibold text-gray-900 dark:text-white">
                    Target Type
                  </div>
                  <DropdownMenuItem
                    onSelect={() => updateFilter('targetType', undefined)}
                    className={`flex items-center gap-2 ${getAdminListDropdownItemClass()}`}
                  >
                    <input
                      type="checkbox"
                      checked={filters.targetType === undefined}
                      readOnly
                      className="mr-2"
                    />
                    <span className="text-gray-900 dark:text-white">All Types</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => updateFilter('targetType', 0)}
                    className={`flex items-center gap-2 ${getAdminListDropdownItemClass()}`}
                  >
                    <input
                      type="checkbox"
                      checked={filters.targetType === 0}
                      readOnly
                      className="mr-2"
                    />
                    <span className="text-gray-900 dark:text-white">News</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => updateFilter('targetType', 1)}
                    className={`flex items-center gap-2 ${getAdminListDropdownItemClass()}`}
                  >
                    <input
                      type="checkbox"
                      checked={filters.targetType === 1}
                      readOnly
                      className="mr-2"
                    />
                    <span className="text-gray-900 dark:text-white">Event</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => updateFilter('targetType', 2)}
                    className={`flex items-center gap-2 ${getAdminListDropdownItemClass()}`}
                  >
                    <input
                      type="checkbox"
                      checked={filters.targetType === 2}
                      readOnly
                      className="mr-2"
                    />
                    <span className="text-gray-900 dark:text-white">Event Manager</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => updateFilter('targetType', 3)}
                    className={`flex items-center gap-2 ${getAdminListDropdownItemClass()}`}
                  >
                    <input
                      type="checkbox"
                      checked={filters.targetType === 3}
                      readOnly
                      className="mr-2"
                    />
                    <span className="text-gray-900 dark:text-white">Comment</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <Table
            className={`min-w-full ${getAdminListTableClass()} ${getAdminListTableBorderClass()}`}
          >
            <TableHeader>
              <TableRow
                className={`bg-yellow-200 hover:bg-yellow-200 ${getAdminListTableHeaderBorderClass()}`}
              >
                <TableHead className="text-gray-900 text-center" style={{ width: '5%' }}>
                  #
                </TableHead>
                <TableHead
                  className="text-gray-900"
                  style={{ width: '15%' }}
                  onClick={() => handleSort('targetName')}
                >
                  <div className="flex items-center gap-1">
                    Target Name
                    {getSortIcon('targetName')}
                  </div>
                </TableHead>
                <TableHead
                  className="text-gray-900"
                  style={{ width: '10%' }}
                  onClick={() => handleSort('targetType')}
                >
                  <div className="flex items-center gap-1">
                    Target Type
                    {getSortIcon('targetType')}
                  </div>
                </TableHead>
                <TableHead
                  className="text-gray-900"
                  style={{ width: '15%' }}
                  onClick={() => handleSort('reporterName')}
                >
                  <div className="flex items-center gap-1">
                    Reporter
                    {getSortIcon('reporterName')}
                  </div>
                </TableHead>
                <TableHead
                  className="text-gray-900"
                  style={{ width: '20%' }}
                  onClick={() => handleSort('reason')}
                >
                  <div className="flex items-center gap-1">
                    Reason
                    {getSortIcon('reason')}
                  </div>
                </TableHead>

                <TableHead
                  className="text-gray-900"
                  style={{ width: '15%' }}
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center gap-1">
                    Created At
                    {getSortIcon('createdAt')}
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
                  {/* Show "No pending reports found" message */}
                  <TableRow
                    className={`${getAdminListTableRowClass()} ${getAdminListTableCellBorderClass()}`}
                  >
                    <TableCell
                      colSpan={7}
                      className="text-center py-4 text-gray-500 dark:text-gray-400"
                    >
                      No pending reports found.
                    </TableCell>
                  </TableRow>
                  {/* Add empty rows to maintain table height */}
                  {Array.from(
                    {
                      length: Math.max(0, 4 - items.length),
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
                  {items.map((report, idx) => (
                    <TableRow
                      key={report.reportId}
                      className={`${getAdminListTableRowClass()} ${getAdminListTableCellBorderClass()}`}
                    >
                      <TableCell className={`pl-4 ${getAdminListTableCellClass()}`}>
                        {((filters.page || 1) - 1) * (filters.pageSize || 5) + idx + 1}
                      </TableCell>
                      <TableCell className={getAdminListTableCellClass()}>
                        {report.targetName}
                      </TableCell>
                      <TableCell className={getAdminListTableCellClass()}>
                        {targetTypeMap[report.targetType] || 'Unknown'}
                      </TableCell>
                      <TableCell className={getAdminListTableCellClass()}>
                        {report.reporterName}
                      </TableCell>
                      <TableCell
                        className={`truncate max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap ${getAdminListTableCellClass()}`}
                      >
                        {report.reason}
                      </TableCell>
                      <TableCell className={getAdminListTableCellClass()}>
                        {new Date(report.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell
                        className="text-center"
                        style={{
                          textAlign: 'center',
                          display: 'flex',
                          justifyContent: 'center',
                        }}
                      >
                        <button
                          className="border-2 border-yellow-400 bg-yellow-400 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white flex items-center justify-center hover:bg-yellow-500 hover:text-white"
                          title="View Details"
                          onClick={() => setViewReport(report)}
                        >
                          <FaEye className="w-4 h-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Add empty rows to maintain table height */}
                  {Array.from({ length: Math.max(0, 5 - items.length) }, (_, idx) => (
                    <TableRow
                      key={`empty-${idx}`}
                      className={`h-[56.8px] ${getAdminListTableRowClass()} ${getAdminListTableCellBorderClass()}`}
                    >
                      <TableCell colSpan={7} className="border-0"></TableCell>
                    </TableRow>
                  ))}
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
                                          ? 'bg-yellow-500 text-white border-yellow-500 hover:bg-yellow-700 hover:text-white'
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
                          ? 'No items'
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
