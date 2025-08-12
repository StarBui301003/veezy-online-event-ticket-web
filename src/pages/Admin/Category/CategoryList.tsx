import { useEffect, useState, useRef } from 'react';
import { getCategoriesWithFilter, deleteCategoryById } from '@/services/Admin/event.service';
import type { Category } from '@/types/event';
import type { PaginatedCategoryResponse, CategoryFilterParams } from '@/types/Admin/category';
import SpinnerOverlay from '@/components/SpinnerOverlay';
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
} from '@/components/ui/pagination';
import { MdOutlineEdit } from 'react-icons/md';
import { FaEye, FaPlus, FaRegTrashAlt, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { toast } from 'react-toastify';
import CreateCategoryModal from '@/pages/Admin/Category/CreateCategoryModal';
import CategoryDetailModal from '@/pages/Admin/Category/CategoryDetailModal';
import EditCategoryModal from '@/pages/Admin/Category/EditCategoryModal';
import { useTranslation } from 'react-i18next';
import { useThemeClasses } from '@/hooks/useThemeClasses';

const pageSizeOptions = [5, 10, 20, 50];

export const CategoryList = () => {
  const {
    getProfileInputClass,
    getAdminListCardClass,
    getAdminListTableClass,
    getAdminListTableRowClass,
    getAdminListTableCellClass,
    getAdminListPaginationClass,
    getAdminListPageSizeSelectClass,
    getAdminListTableBorderClass,
    getAdminListTableCellBorderClass,
    getAdminListTableHeaderBorderClass,
  } = useThemeClasses();
  const { t } = useTranslation();
  const [data, setData] = useState<PaginatedCategoryResponse['data'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<CategoryFilterParams>({
    page: 1,
    pageSize: 5,
    sortBy: 'createdAt',
    sortDescending: true,
    searchTerm: '',
  });
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortDescending, setSortDescending] = useState(true);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [viewCate, setViewCategory] = useState<Category | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

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
    onEvent('OnCategoryCreated', reload);
    onEvent('OnCategoryUpdated', reload);
    onEvent('OnCategoryDeleted', reload);
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

  // Sync filters.page với page khi mount
  useEffect(() => {
    setFilters((prev) => ({ ...prev, page: page || 1 }));
  }, []);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const params = {
        ...filters,
        sortBy,
        sortDescending,
        searchTerm: filters.searchTerm || undefined,
      };
      const response = await getCategoriesWithFilter(params);
      setData(response.data);
      // Không cập nhật filters ở đây nữa để tránh vòng lặp vô hạn
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to fetch categories');
    } finally {
      if (showLoading) setLoading(false);
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

  const items = data?.items || [];
  const totalItems = data?.totalItems || 0;
  const totalPages = data?.totalPages || 1;

  const handleDelete = async (cat: Category) => {
    if (!window.confirm(t('confirmDeleteCategory'))) return;
    try {
      const response = await deleteCategoryById(cat.categoryId);
      if (response.flag) {
        toast.success(t('categoryDeletedSuccessfully'));
        reloadList();
      } else {
        toast.error(response.message || t('cannotDeleteCategory'));
      }
    } catch (error: unknown) {
      // Handle network errors or other exceptions
      const errorMessage = error instanceof Error ? error.message : t('cannotDeleteCategory');
      toast.error(errorMessage);
    }
  };

  return (
    <div className="p-6">
      <div className="overflow-x-auto ">
        <SpinnerOverlay show={loading} />
        {/* Modal tạo category */}
        {editCategory && (
          <EditCategoryModal
            category={editCategory}
            onClose={() => setEditCategory(null)}
            onUpdated={reloadList}
          />
        )}
        {viewCate && <CategoryDetailModal cate={viewCate} onClose={() => setViewCategory(null)} />}
        <CreateCategoryModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={reloadList}
        />
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
                  placeholder="Search category name..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    // Reset to page 1 when searching
                    setFilters((prev) => ({ ...prev, page: 1 }));
                    setPage(1);
                  }}
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

            {/* Create button (right) */}
            <div className="flex items-center gap-2">
              <button
                className="flex gap-2 items-center border-2 border-green-500 bg-green-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-green-600 hover:text-white hover:border-green-500"
                onClick={() => setShowCreateModal(true)}
              >
                <FaPlus />
                {t('create')}
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
                  style={{ width: '25%' }}
                  onClick={() => handleSort('categoryName')}
                >
                  <div className="flex items-center gap-1">
                    {t('categoryName')}
                    {getSortIcon('categoryName')}
                  </div>
                </TableHead>
                <TableHead className="text-gray-900" style={{ width: '50%' }}>
                  {t('description')}
                </TableHead>
                <TableHead style={{ width: '20%' }} className="text-gray-900 text-center">
                  {t('action')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody
              className={`min-h-[400px] ${getAdminListTableClass()} ${getAdminListTableBorderClass()}`}
            >
              {items.length === 0 ? (
                <>
                  {/* Show "No categories found" message */}
                  <TableRow
                    className={`${getAdminListTableRowClass()} ${getAdminListTableCellBorderClass()}`}
                  >
                    <TableCell
                      colSpan={4}
                      className="text-center py-4 text-gray-500 dark:text-gray-400"
                    >
                      {t('noCategoriesFound')}
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
                        <TableCell colSpan={4} className="border-0"></TableCell>
                      </TableRow>
                    )
                  )}
                </>
              ) : (
                <>
                  {items.map((cat, idx) => (
                    <TableRow
                      key={cat.categoryId}
                      className={`${getAdminListTableRowClass()} ${getAdminListTableCellBorderClass()}`}
                    >
                      <TableCell className={`text-center ${getAdminListTableCellClass()}`}>
                        {((filters.page || 1) - 1) * (filters.pageSize || 5) + idx + 1}
                      </TableCell>
                      <TableCell className={`${getAdminListTableCellClass()}`}>
                        {cat.categoryName}
                      </TableCell>
                      <TableCell
                        className={`truncate max-w-[400px] overflow-hidden text-ellipsis whitespace-nowrap ${getAdminListTableCellClass()}`}
                      >
                        {cat.categoryDescription}
                      </TableCell>
                      <TableCell className="text-center flex items-center justify-center gap-2">
                        <button
                          className="border-2 border-yellow-400 bg-yellow-400 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white flex items-center justify-center hover:bg-yellow-500 hover:text-white"
                          title={t('viewDetails')}
                          onClick={() => setViewCategory(cat)}
                        >
                          <FaEye className="w-4 h-4" />
                        </button>
                        <button
                          className="border-2 border-[#24b4fb] bg-[#24b4fb] rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-[#0071e2]"
                          title={t('edit')}
                          onClick={() => setEditCategory(cat)}
                        >
                          <MdOutlineEdit className="w-4 h-4" />
                        </button>
                        <button
                          className="border-2 border-red-500 bg-red-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-white hover:text-red-500 hover:border-red-500"
                          title={t('delete')}
                          onClick={() => handleDelete(cat)}
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
                        <TableCell colSpan={4} className="border-0"></TableCell>
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
                <TableCell colSpan={4} className="border-0">
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
                                          ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-700 hover:text-white'
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

export default CategoryList;
