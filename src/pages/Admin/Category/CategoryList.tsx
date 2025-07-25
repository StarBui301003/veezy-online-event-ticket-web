import { useEffect, useState } from 'react';
import { getAllCategory, deleteCategoryById } from '@/services/Admin/event.service';
import type { Category } from '@/types/event';
import type { PaginatedCategoryResponse } from '@/types/Admin/category';
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
import { FaEye, FaPlus, FaRegTrashAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import CreateCategoryModal from '@/pages/Admin/Category/CreateCategoryModal';
import CategoryDetailModal from '@/pages/Admin/Category/CategoryDetailModal';
import EditCategoryModal from '@/pages/Admin/Category/EditCategoryModal';
import { useTranslation } from 'react-i18next';

const pageSizeOptions = [5, 10, 20, 50];

export const CategoryList = () => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewCate, setViewCategory] = useState<Category | null>(null);
  const [editCategory, setEditCategory] = useState<Category | null>(null);

  useEffect(() => {
    connectEventHub('http://localhost:5004/notificationHub');
    reloadList(page, pageSize);

    // Lắng nghe realtime SignalR cho category
    const reload = () => reloadList(page, pageSize);
    onEvent('OnCategoryCreated', reload);
    onEvent('OnCategoryUpdated', reload);
    onEvent('OnCategoryDeleted', reload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    reloadList(page, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  const reloadList = (pageArg: number, pageSizeArg: number) => {
    setLoading(true);
    getAllCategory(pageArg, pageSizeArg)
      .then((res: PaginatedCategoryResponse) => {
        if (res && res.data && Array.isArray(res.data.items)) {
          setCategories(res.data.items);
          setTotalItems(res.data.totalItems);
          setTotalPages(res.data.totalPages);
          setHasNextPage(res.data.hasNextPage);
          setHasPreviousPage(res.data.hasPreviousPage);
        } else {
          setCategories([]);
          setTotalItems(0);
          setTotalPages(1);
          setHasNextPage(false);
          setHasPreviousPage(false);
        }
      })
      .finally(() => {
        setTimeout(() => setLoading(false), 500);
      });
  };

  const pagedCategories = categories;

  const handleDelete = async (cat: Category) => {
    if (!window.confirm(t('confirmDeleteCategory'))) return;
    try {
      await deleteCategoryById(cat.categoryId);
      toast.success(t('categoryDeletedSuccessfully'));
      reloadList(page, pageSize);
    } catch {
      toast.error(t('cannotDeleteCategory'));
    }
  };

  return (
    <div className="p-6">
      <SpinnerOverlay show={loading} />
      {/* Modal tạo category */}
      {editCategory && (
        <EditCategoryModal
          category={editCategory}
          onClose={() => setEditCategory(null)}
          onUpdated={() => reloadList(page, pageSize)}
        />
      )}
      {viewCate && <CategoryDetailModal cate={viewCate} onClose={() => setViewCategory(null)} />}
      <CreateCategoryModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => reloadList(page, pageSize)}
      />
      <div className="overflow-x-auto">
        <div className="p-4 bg-white rounded-xl shadow">
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
                  placeholder={t('searchByCategoryName')}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
                {search && (
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
                      setSearch('');
                      setPage(1);
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
            {/* Create button (right) */}
            <div className="flex justify-end">
              <button
                className="flex gap-2 items-center border-2 border-green-500 bg-green-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-green-600 hover:text-white hover:border-green-500"
                onClick={() => setShowCreateModal(true)}
              >
                <FaPlus />
                {t('create')}
              </button>
            </div>
          </div>
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="bg-blue-200 hover:bg-blue-200">
                <TableHead className="pl-4" style={{ width: '5%' }}>
                  #
                </TableHead>
                <TableHead style={{ width: '15%' }}>{t('categoryName')}</TableHead>
                <TableHead>{t('description')}</TableHead>
                <TableHead style={{ width: '20%' }} className="text-center">
                  {t('action')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedCategories.filter(
                (cat) =>
                  !search || cat.categoryName.toLowerCase().includes(search.trim().toLowerCase())
              ).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                    {t('noCategoriesFound')}
                  </TableCell>
                </TableRow>
              ) : (
                pagedCategories
                  .filter(
                    (cat) =>
                      !search ||
                      cat.categoryName.toLowerCase().includes(search.trim().toLowerCase())
                  )
                  .map((cat, idx) => (
                    <TableRow key={cat.categoryId} className="hover:bg-blue-50">
                      <TableCell className="pl-4">{(page - 1) * pageSize + idx + 1}</TableCell>
                      <TableCell>{cat.categoryName}</TableCell>
                      <TableCell className="truncate max-w-[400px] overflow-hidden text-ellipsis whitespace-nowrap">
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
                  ))
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4}>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 px-2 py-2">
                    <div className="flex-1 flex justify-center pl-[200px]">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => setPage((p) => Math.max(1, p - 1))}
                              aria-disabled={!hasPreviousPage}
                              className={!hasPreviousPage ? 'pointer-events-none opacity-50' : ''}
                            />
                          </PaginationItem>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((i) => (
                            <PaginationItem key={i}>
                              <PaginationLink
                                isActive={i === page}
                                onClick={() => setPage(i)}
                                className={`transition-colors rounded 
                                  ${
                                    i === page
                                      ? 'bg-blue-500 text-white border hover:bg-blue-700 hover:text-white'
                                      : 'text-gray-700 hover:bg-slate-200 hover:text-black'
                                  }
                                  px-2 py-1 mx-0.5`}
                              >
                                {i}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          <PaginationItem>
                            <PaginationNext
                              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                              aria-disabled={!hasNextPage}
                              className={!hasNextPage ? 'pointer-events-none opacity-50' : ''}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                    <div className="flex items-center gap-2 justify-end w-full md:w-auto">
                      <span className="text-sm text-gray-700">
                        {totalItems === 0
                          ? t('paginationEmpty')
                          : `${(page - 1) * pageSize + 1}-${Math.min(
                              page * pageSize,
                              totalItems
                            )} ${t('of')} ${totalItems}`}
                      </span>
                      <span className="text-sm text-gray-700">{t('rowsPerPage')}</span>
                      <select
                        className="flex items-center gap-1 px-2 py-1 border rounded text-sm bg-white hover:bg-gray-100 transition min-w-[48px] text-left"
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setPage(1);
                        }}
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
