import { useEffect, useState } from 'react';
import { getAllCategory, deleteCategoryById } from '@/services/Admin/event.service';
import type { Category } from '@/types/event';
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
import CreateCategoryModal from '@/components/Admin/Modal/CreateCategoryModal';
import CategoryDetailModal from '@/components/Admin/Modal/CategoryDetailModal';
import EditCategoryModal from '@/components/Admin/Modal/EditCategoryModal';

const pageSizeOptions = [5, 10, 20, 50];

export const CategoryList = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewCate, setViewCategory] = useState<Category | null>(null);
  const [editCategory, setEditCategory] = useState<Category | null>(null);

  useEffect(() => {
    reloadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reloadList = () => {
    setLoading(true);
    getAllCategory()
      .then((data) => setCategories(data))
      .finally(() => setLoading(false));
  };

  const pagedCategories = categories.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(categories.length / pageSize));

  const handleDelete = async (cat: Category) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await deleteCategoryById(cat.categoryId);
      toast.success('Category deleted successfully!');
      setCategories((prev) => prev.filter((c) => c.categoryId !== cat.categoryId));
    } catch {
      toast.error('Cannot delete this category!');
    }
  };

  return (
    <div className="p-6">
      <SpinnerOverlay show={loading} />
      <h2 className="text-2xl font-bold mb-4">Category List</h2>
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
      <div className="overflow-x-auto">
        <div className="p-4 bg-white rounded-xl shadow">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
            {/* Search input (left) */}
            <div className="flex-1 flex items-center gap-2">
              <input
                className="border px-3 py-2 rounded w-full max-w-xs pr-8"
                placeholder="Search by category name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
              {search && (
                <button
                  className="ml-[-32px] text-gray-400 hover:text-gray-700 focus:outline-none"
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
            {/* Create button (right) */}
            <div className="flex justify-end">
              <button
                className="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600 font-semibold flex items-center gap-2 transition"
                onClick={() => setShowCreateModal(true)}
              >
                <FaPlus />
                Create
              </button>
            </div>
          </div>
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="bg-blue-200 hover:bg-blue-200">
                <TableHead className="pl-4">#</TableHead>
                <TableHead>Category Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedCategories.filter(
                (cat) =>
                  !search || cat.categoryName.toLowerCase().includes(search.trim().toLowerCase())
              ).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                    No categories found.
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
                    <TableRow key={cat.categoryId}>
                      <TableCell className="pl-4">{(page - 1) * pageSize + idx + 1}</TableCell>
                      <TableCell>{cat.categoryName}</TableCell>
                      <TableCell className="truncate max-w-[400px] overflow-hidden text-ellipsis whitespace-nowrap">
                        {cat.categoryDescription}
                      </TableCell>
                      <TableCell className="text-center flex items-center justify-center gap-2">
                        <button
                          className="px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 transition flex items-center justify-center "
                          title="View details"
                          onClick={() => setViewCategory(cat)}
                        >
                          <FaEye className="w-4 h-4" />
                        </button>
                        <button
                          className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition flex items-center justify-center"
                          title="Edit"
                          onClick={() => setEditCategory(cat)}
                        >
                          <MdOutlineEdit className="w-4 h-4" />
                        </button>
                        <button
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition flex items-center justify-center"
                          title="Delete"
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
                              aria-disabled={page === 1}
                              className={page === 1 ? 'pointer-events-none opacity-50' : ''}
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
                        {categories.length === 0
                          ? '0-0 of 0'
                          : `${(page - 1) * pageSize + 1}-${Math.min(
                              page * pageSize,
                              categories.length
                            )} of ${categories.length}`}
                      </span>
                      <span className="text-sm text-gray-700">Rows per page</span>
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
