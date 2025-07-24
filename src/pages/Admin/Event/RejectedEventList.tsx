import { useEffect, useState } from 'react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableFooter,
} from '@/components/ui/table';
import { getRejectedEvents, getCategoryById, deleteEvent } from '@/services/Admin/event.service';
import type { ApprovedEvent, PaginatedEventResponse } from '@/types/Admin/event';
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
import { FaEye, FaRegTrashAlt } from 'react-icons/fa';
import RejectedEventDetailModal from '@/pages/Admin/Event/RejectedEventDetailModal';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import { Category } from '@/types/Admin/category';
import { toast } from 'react-toastify';
import { onEvent, connectEventHub } from '@/services/signalr.service';

const pageSizeOptions = [5, 10, 20, 50];

export const RejectedEventList = () => {
  const [data, setData] = useState<PaginatedEventResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedEvent, setSelectedEvent] = useState<ApprovedEvent | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  // Fetch all categories for filter (once)
  useEffect(() => {
    (async () => {
      const res = await getRejectedEvents({ page: 1, pageSize: 1000 });
      const isValidCategoryId = (id: string) => !!id && /^[0-9a-fA-F-]{36}$/.test(id);
      const ids = Array.from(
        new Set(
          res.data.items
            .flatMap((event: ApprovedEvent) => event.categoryIds || [])
            .filter(isValidCategoryId)
        )
      );
      const cats: Category[] = [];
      await Promise.all(
        ids.map(async (id) => {
          try {
            const cat = await getCategoryById(id);
            cats.push(cat);
          } catch {
            cats.push({
              categoryId: id,
              categoryName: 'unknown',
              categoryDescription: '',
            });
          }
        })
      );
      setAllCategories(cats);
    })();
  }, []);

  // Fetch paginated events from BE
  useEffect(() => {
    connectEventHub('http://localhost:5004/notificationHub');
    setLoading(true);
    getRejectedEvents({ page, pageSize })
      .then((res) => {
        if (res && res.data) {
          setData({
            items: res.data.items,
            totalItems: res.data.totalItems,
            totalPages: res.data.totalPages,
            currentPage: page,
            pageSize: pageSize,
            hasNextPage: res.data.hasNextPage,
            hasPreviousPage: res.data.hasPreviousPage,
          });
        } else {
          setData(null);
        }
      })
      .finally(() => setTimeout(() => setLoading(false), 500));
    // Lắng nghe realtime SignalR
    const reload = () =>
      getRejectedEvents({ page, pageSize }).then((res) => {
        if (res && res.data) {
          setData({
            items: res.data.items,
            totalItems: res.data.totalItems,
            totalPages: res.data.totalPages,
            currentPage: page,
            pageSize: pageSize,
            hasNextPage: res.data.hasNextPage,
            hasPreviousPage: res.data.hasPreviousPage,
          });
        } else {
          setData(null);
        }
      });
    onEvent('OnEventCreated', reload);
    onEvent('OnEventUpdated', reload);
    onEvent('OnEventDeleted', reload);
    onEvent('OnEventCancelled', reload);
    onEvent('OnEventApproved', reload);
  }, [page, pageSize]);

  // Filter logic (giống user và pending: filter toàn bộ rồi phân trang)
  const items = data?.items || [];
  const totalItems = data?.totalItems || 0;
  const totalPages = data?.totalPages || 1;
  // currentPage không cần dùng, chỉ dùng page FE

  // Khi đổi pageSize, reset về trang 1 (giống user và pending)
  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  // Khi filter/search thay đổi, nếu page vượt quá tổng số trang mới thì setPage về trang cuối cùng
  useEffect(() => {
    const newTotalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    if (page > newTotalPages) {
      setPage(newTotalPages);
    }
  }, [totalItems, pageSize]);

  // Thêm hàm xử lý xóa
  const handleDelete = async (event: ApprovedEvent) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await deleteEvent(event.eventId);
      setData((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.filter((e) => e.eventId !== event.eventId),
              totalItems: prev.totalItems - 1,
              totalPages: Math.ceil((prev.totalItems - 1) / pageSize),
              currentPage: prev.currentPage,
              pageSize: pageSize,
              hasNextPage: prev.hasNextPage,
              hasPreviousPage: prev.hasPreviousPage,
            }
          : null
      );
      toast.success('Event deleted successfully!');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Cannot delete this event!');
    }
  };

  return (
    <div className="p-3">
      <SpinnerOverlay show={loading} />
      <div className="overflow-x-auto">
        <div className="p-4 bg-white rounded-xl shadow">
          {/* Filter/Search UI */}
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
                  placeholder="Search by event name or creator..."
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

            {/* Category filter (right) */}
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="border px-3 py-2 rounded bg-white hover:bg-gray-100 flex items-center gap-2">
                    Filter Category
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto min-w-[220px]">
                  <div className="px-2 py-1 text-sm font-semibold">Categories</div>
                  {allCategories.length === 0 && (
                    <div className="px-2 py-1 text-gray-500">No categories</div>
                  )}
                  {allCategories.map((cat) => (
                    <DropdownMenuItem
                      key={cat.categoryId}
                      onSelect={() => {
                        setSelectedCategoryIds((prev) =>
                          prev.includes(cat.categoryId)
                            ? prev.filter((id) => id !== cat.categoryId)
                            : [...prev, cat.categoryId]
                        );
                        setPage(1);
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategoryIds.includes(cat.categoryId)}
                        readOnly
                        className="mr-2"
                      />
                      <span>{cat.categoryName}</span>
                    </DropdownMenuItem>
                  ))}
                  <div className="flex gap-2 px-2 py-2">
                    <button
                      className="text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
                      onClick={() => setSelectedCategoryIds([])}
                      type="button"
                    >
                      Clear
                    </button>
                    <button
                      className="text-xs px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
                      onClick={() => setSelectedCategoryIds([...selectedCategoryIds])}
                      type="button"
                    >
                      Apply
                    </button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="bg-red-200 hover:bg-red-200">
                <TableHead className="text-center" style={{ width: '5%' }}>
                  #
                </TableHead>
                <TableHead style={{ width: '20%' }}>Event Name</TableHead>
                <TableHead style={{ width: '10%' }}>Category</TableHead>
                <TableHead style={{ width: '15%' }}>Rejected By</TableHead>
                <TableHead style={{ width: '20%' }}>Rejected At</TableHead>
                <TableHead style={{ width: '15%' }}>Created By</TableHead>
                <TableHead style={{ width: '20%' }}>Created At</TableHead>
                <TableHead className="text-center">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.filter(
                (event) =>
                  !search ||
                  event.eventName?.toLowerCase().includes(search.trim().toLowerCase()) ||
                  (event.createdBy?.toLowerCase() || '').includes(search.trim().toLowerCase())
              ).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                    No approved events found.
                  </TableCell>
                </TableRow>
              ) : (
                items
                  .filter(
                    (event) =>
                      !search ||
                      event.eventName?.toLowerCase().includes(search.trim().toLowerCase()) ||
                      (event.createdBy?.toLowerCase() || '').includes(search.trim().toLowerCase())
                  )
                  .map((event, idx) => (
                    <TableRow key={event.eventId} className="hover:bg-red-100/60">
                      <TableCell className="text-center">
                        {(page - 1) * pageSize + idx + 1}
                      </TableCell>
                      <TableCell
                        style={{
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {event.eventName}
                      </TableCell>
                      <TableCell
                        style={{
                          maxWidth: 100,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {event.categoryIds && event.categoryIds.length > 0
                          ? event.categoryIds
                              .map(
                                (id) =>
                                  allCategories.find((cat) => cat.categoryId === id)
                                    ?.categoryName || id
                              )
                              .join(', ')
                          : 'Unknown'}
                      </TableCell>
                      <TableCell
                        style={{
                          maxWidth: 100,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {event.approvedBy ? event.approvedBy : 'Unknown'}
                      </TableCell>
                      <TableCell
                        style={{
                          maxWidth: 180,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {event.approvedAt ? new Date(event.approvedAt).toLocaleString() : 'Unknown'}
                      </TableCell>
                      <TableCell
                        style={{
                          maxWidth: 120,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {event.createdBy ? event.createdBy : 'Unknown'}
                      </TableCell>
                      <TableCell
                        style={{
                          maxWidth: 180,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {event.createdAt ? new Date(event.createdAt).toLocaleString() : 'Unknown'}
                      </TableCell>
                      <TableCell className="text-center  justify-center flex items-center">
                        <button
                          className="border-2 border-yellow-400 bg-yellow-400 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white flex items-center justify-center hover:bg-yellow-500 hover:text-white"
                          onClick={() => setSelectedEvent(event)}
                        >
                          <FaEye className="w-4 h-4" />
                        </button>
                        <button
                          className="border-2 border-red-500 bg-red-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-white hover:text-red-500 hover:border-red-500 ml-2"
                          title="Delete"
                          onClick={() => handleDelete(event)}
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
                <TableCell colSpan={8}>
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
                                      ? 'bg-red-500 text-white border hover:bg-red-700 hover:text-white'
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
                            )} of ${totalItems}`}
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
                                setPage(1); // reset về trang 1 khi đổi pageSize
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
          {selectedEvent && (
            <RejectedEventDetailModal
              event={selectedEvent}
              onClose={() => setSelectedEvent(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
};
