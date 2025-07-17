import { useEffect, useState } from 'react';
import type { DiscountCodeResponse, DiscountCodeUpdateInput } from '@/types/Admin/discountCode';
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
} from '@/components/ui/dropdown-menu';
import { FaPlus, FaRegTrashAlt, FaEye } from 'react-icons/fa';
import { MdOutlineEdit } from 'react-icons/md';
import { toast } from 'react-toastify';
import { getDiscountCodes, deleteDiscountCode } from '@/services/Admin/discountCode.service';
import DiscountCodeDetailModal from '@/pages/Admin/DiscountCode/DiscountCodeDetailModal';
import CreateDiscountCodeModal from '@/pages/Admin/DiscountCode/CreateDiscountCodeModal';
import EditDiscountCodeModal from '@/pages/Admin/DiscountCode/EditDiscountCodeModal';

const pageSizeOptions = [5, 10, 20, 50];

export const DiscountCodeList = () => {
  const [discountData, setDiscountData] = useState<DiscountCodeResponse['data'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editDiscount, setEditDiscount] = useState<
    (DiscountCodeUpdateInput & { discountId: string }) | null
  >(null);
  const [viewDiscount, setViewDiscount] = useState<
    DiscountCodeResponse['data']['items'][number] | null
  >(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    connectEventHub('http://localhost:5004/notificationHub');
    reloadList();

    // Lắng nghe realtime SignalR cho discount code
    const reload = () => reloadList();
    onEvent('OnDiscountCodeCreated', reload);
    onEvent('OnDiscountCodeUpdated', reload);
    onEvent('OnDiscountCodeDeleted', reload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reloadList = () => {
    setLoading(true);
    getDiscountCodes()
      .then((res) => setDiscountData(res.data))
      .finally(() => {
        setTimeout(() => setLoading(false), 500);
      });
  };

  const items = discountData?.items || [];
  const pagedItems = items.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDelete = async (item: any) => {
    if (!window.confirm('Are you sure you want to delete this discount code?')) return;
    try {
      await deleteDiscountCode(item.discountId);
      toast.success('Discount code deleted successfully!');
      reloadList();
    } catch {
      toast.error('Cannot delete this discount code!');
    }
  };

  const discountTypeMap: Record<number, string> = {
    0: 'Percentage',
    1: 'Fixed',
    3: 'Other',
  };

  // Khi mở modal chi tiết, không nên set loading cho list
  // Khi chỉ fetch chi tiết event trong DiscountCodeDetailModal, không ảnh hưởng spinner của list

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
                  placeholder="Search by code..."
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
                Create
              </button>
            </div>
          </div>
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="bg-blue-200 hover:bg-blue-200">
                <TableHead className="pl-4" style={{ width: '5%' }}>
                  #
                </TableHead>
                <TableHead className="text-center" style={{ width: '10%' }}>
                  Code
                </TableHead>
                <TableHead className="text-center" style={{ width: '10%' }}>
                  Discount Type
                </TableHead>
                <TableHead className="text-center" style={{ width: '10%' }}>
                  Value
                </TableHead>
                <TableHead className="text-center" style={{ width: '10%' }}>
                  Minimum
                </TableHead>
                <TableHead className="text-center" style={{ width: '10%' }}>
                  Maximum
                </TableHead>

                <TableHead className="text-center" style={{ width: '10%' }}>
                  Expired At
                </TableHead>
                <TableHead className="text-center" style={{ width: '10%' }}>
                  Created At
                </TableHead>
                <TableHead style={{ width: '10%' }} className="text-center">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedItems.filter(
                (item) => !search || item.code.toLowerCase().includes(search.trim().toLowerCase())
              ).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-4 text-gray-500">
                    No discount codes found.
                  </TableCell>
                </TableRow>
              ) : (
                pagedItems
                  .filter(
                    (item) =>
                      !search || item.code.toLowerCase().includes(search.trim().toLowerCase())
                  )
                  .map((item, idx) => (
                    <TableRow key={item.discountId} className="hover:bg-blue-50">
                      <TableCell className="pl-4">{(page - 1) * pageSize + idx + 1}</TableCell>
                      <TableCell className="text-center">{item.code}</TableCell>
                      <TableCell className="truncate whitespace-nowrap overflow-hidden text-ellipsis text-center">
                        {discountTypeMap[item.discountType] ?? item.discountType}
                      </TableCell>
                      <TableCell className="text-center">{item.value}</TableCell>
                      <TableCell className="text-center">{item.minimum}</TableCell>
                      <TableCell className="text-center">{item.maximum}</TableCell>

                      <TableCell className="text-center">
                        {new Date(item.expiredAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        {new Date(item.createdAt).toLocaleString()}
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
                  ))
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={11}>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 px-2 py-2">
                    <div className="flex-1 flex justify-center">
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
                        {items.length === 0
                          ? '0-0 of 0'
                          : `${(page - 1) * pageSize + 1}-${Math.min(
                              page * pageSize,
                              items.length
                            )} of ${items.length}`}
                      </span>
                      <span className="text-sm text-gray-700">Rows per page</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex items-center gap-1 px-2 py-1 border rounded text-sm bg-white hover:bg-gray-100 transition min-w-[48px] text-left">
                            {pageSize}
                            <svg
                              className="w-4 h-4 ml-1"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {pageSizeOptions.map((size) => (
                            <DropdownMenuItem
                              key={size}
                              onClick={() => {
                                setPageSize(size);
                                setPage(1);
                              }}
                              className={size === pageSize ? 'font-bold bg-primary/10' : ''}
                            >
                              {size}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
