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
import {
  getApprovedEvents,
  getCategoryById,
  hideEvent,
  showEvent,
  deleteEvent,
} from '@/services/Admin/event.service';
import type { ApprovedEvent } from '@/types/Admin/event';
import { getUsernameByAccountId } from '@/services/Admin/user.service';
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
import ApprovedEventDetailModal from '@/pages/Admin/Event/ApprovedEventDetailModal';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import { Category } from '@/types/Admin/category';
import { Switch } from '@/components/ui/switch';
import { toast } from 'react-toastify'; // Thêm dòng này

const pageSizeOptions = [5, 10, 20, 50];

export const ApprovedEventList = () => {
  const [events, setEvents] = useState<ApprovedEvent[]>([]);
  const [categories, setCategories] = useState<Record<string, Category>>({});
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [usernames, setUsernames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedEvent, setSelectedEvent] = useState<ApprovedEvent | null>(null);

  // Filter state
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  // Fetch all categories for filter
  useEffect(() => {
    (async () => {
      // Lấy tất cả categoryId duy nhất từ các event pending
      const res = await getApprovedEvents();
      // Chỉ lấy các id là UUID (36 ký tự, có dấu '-')
      const isValidCategoryId = (id: string) => !!id && /^[0-9a-fA-F-]{36}$/.test(id);

      const ids = Array.from(
        new Set(
          res.data.items.flatMap((event) => event.categoryIds || []).filter(isValidCategoryId)
        )
      );
      const cats: Category[] = [];
      await Promise.all(
        ids.map(async (id) => {
          try {
            const cat = await getCategoryById(id);
            cats.push(cat);
          } catch {
            // Nếu lỗi vẫn push object tạm để filter không bị thiếu
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
  useEffect(() => {
    setLoading(true);
    getApprovedEvents()
      .then(async (res) => {
        setEvents(res.data.items);

        const allCategoryIds = Array.from(
          new Set(res.data.items.flatMap((event) => event.categoryIds || []))
        );
        const categoryMap: Record<string, Category> = { ...categories };
        const idsToFetch = allCategoryIds.filter((id) => !categoryMap[id]);
        await Promise.all(
          idsToFetch.map(async (id) => {
            try {
              const cat = await getCategoryById(id);
              categoryMap[id] = cat;
            } catch {
              categoryMap[id] = {
                categoryId: id,
                categoryName: 'Unknown',
                categoryDescription: '',
              };
            }
          })
        );
        setCategories(categoryMap);

        const allAccountIds = Array.from(
          new Set(
            res.data.items.flatMap((event) => [event.approvedBy, event.createdBy]).filter(Boolean)
          )
        );
        const usernameMap: Record<string, string> = { ...usernames };
        const idsToFetchUser = allAccountIds.filter((id) => !usernameMap[id]);
        await Promise.all(
          idsToFetchUser.map(async (id) => {
            try {
              const username = await getUsernameByAccountId(id);
              usernameMap[id] = username;
            } catch {
              usernameMap[id] = id;
            }
          })
        );
        setUsernames(usernameMap);
      })
      .catch(() => setEvents([]))
      .finally(() => {
        setTimeout(() => setLoading(false), 500);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter logic
  const filteredEvents = events.filter((event) => {
    // Filter by category
    if (
      selectedCategoryIds.length > 0 &&
      !event.categoryIds.some((id) => selectedCategoryIds.includes(id))
    ) {
      return false;
    }
    // Filter by search (event name, created by)
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      const createdByName = usernames[event.createdBy]?.toLowerCase() || '';
      if (!(event.eventName?.toLowerCase().includes(s) || createdByName.includes(s))) {
        return false;
      }
    }
    return true;
  });

  const pagedEvents = filteredEvents.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / pageSize));

  // Toggle status handler
  const handleToggleStatus = async (event: ApprovedEvent) => {
    try {
      if (event.isActive) {
        await hideEvent(event.eventId);
      } else {
        await showEvent(event.eventId);
      }
      // Reload list after toggle
      setLoading(true);
      getApprovedEvents()
        .then(async (res) => {
          setEvents(res.data.items);

          const allCategoryIds = Array.from(
            new Set(res.data.items.flatMap((event) => event.categoryIds || []))
          );
          const categoryMap: Record<string, Category> = { ...categories };
          const idsToFetch = allCategoryIds.filter((id) => !categoryMap[id]);
          await Promise.all(
            idsToFetch.map(async (id) => {
              try {
                const cat = await getCategoryById(id);
                categoryMap[id] = cat;
              } catch {
                categoryMap[id] = {
                  categoryId: id,
                  categoryName: 'Unknown',
                  categoryDescription: '',
                };
              }
            })
          );
          setCategories(categoryMap);

          const allAccountIds = Array.from(
            new Set(
              res.data.items.flatMap((event) => [event.approvedBy, event.createdBy]).filter(Boolean)
            )
          );
          const usernameMap: Record<string, string> = { ...usernames };
          const idsToFetchUser = allAccountIds.filter((id) => !usernameMap[id]);
          await Promise.all(
            idsToFetchUser.map(async (id) => {
              try {
                const username = await getUsernameByAccountId(id);
                usernameMap[id] = username;
              } catch {
                usernameMap[id] = id;
              }
            })
          );
          setUsernames(usernameMap);
        })
        .catch(() => setEvents([]))
        .finally(() => {
          setTimeout(() => setLoading(false), 500);
        });
    } catch {
      // Optionally show error toast
    }
  };

  // Delete handler
  const handleDelete = async (event: ApprovedEvent) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await deleteEvent(event.eventId);
      setEvents((prev) => prev.filter((e) => e.eventId !== event.eventId));
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
              <TableRow className="bg-green-200 hover:bg-green-200">
                <TableHead className="text-center" style={{ width: '5%' }}>
                  #
                </TableHead>
                <TableHead style={{ width: '20%' }}>Event Name</TableHead>
                <TableHead style={{ width: '10%' }}>Category</TableHead>
                <TableHead style={{ width: '10%' }} className="text-center">
                  Status
                </TableHead>
                <TableHead style={{ width: '15%' }} className="text-center">
                  Approved By
                </TableHead>
                <TableHead style={{ width: '20%' }}>Approved At</TableHead>
                <TableHead style={{ width: '15%' }}>Created By</TableHead>
                <TableHead style={{ width: '20%' }}>Created At</TableHead>
                <TableHead className="text-center">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedEvents.filter(
                (event) =>
                  !search ||
                  event.eventName?.toLowerCase().includes(search.trim().toLowerCase()) ||
                  (usernames[event.createdBy]?.toLowerCase() || '').includes(
                    search.trim().toLowerCase()
                  )
              ).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-4 text-gray-500">
                    No approved events found.
                  </TableCell>
                </TableRow>
              ) : (
                pagedEvents
                  .filter(
                    (event) =>
                      !search ||
                      event.eventName?.toLowerCase().includes(search.trim().toLowerCase()) ||
                      (usernames[event.createdBy]?.toLowerCase() || '').includes(
                        search.trim().toLowerCase()
                      )
                  )
                  .map((event, idx) => (
                    <TableRow key={event.eventId} className="hover:bg-green-50">
                      <TableCell className="text-center">
                        {(page - 1) * pageSize + idx + 1}
                      </TableCell>
                      <TableCell>{event.eventName}</TableCell>
                      <TableCell>
                        {event.categoryIds && event.categoryIds.length > 0
                          ? event.categoryIds
                              .map((id) => categories[id]?.categoryName || id)
                              .join(', ')
                          : 'Unknown'}
                      </TableCell>
                      <TableCell className="text-center">
                        {/* Status switch giống NewsOwnList */}
                        <Switch
                          checked={event.isActive}
                          onCheckedChange={() => handleToggleStatus(event)}
                          disabled={loading}
                          className={
                            event.isActive
                              ? '!bg-green-500 !border-green-500'
                              : '!bg-red-400 !border-red-400'
                          }
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        {event.approvedBy
                          ? usernames[event.approvedBy] || event.approvedBy
                          : 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {event.approvedAt ? new Date(event.approvedAt).toLocaleString() : 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {event.createdBy
                          ? usernames[event.createdBy] || event.createdBy
                          : 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {event.createdAt ? new Date(event.createdAt).toLocaleString() : 'Unknown'}
                      </TableCell>
                      <TableCell className="text-center justify-center flex items-center">
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
                <TableCell colSpan={9}>
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
                                      ? 'bg-green-500 text-white border hover:bg-green-600 hover:text-white'
                                      : 'text-gray-700 hover:bg-slate-200 hover:text-black'
                                  }
                                  px-2 py-1 mx-0.5`}
                                style={{
                                  minWidth: 32,
                                  textAlign: 'center',
                                  fontWeight: i === page ? 700 : 400,
                                  cursor: i === page ? 'default' : 'pointer',
                                }}
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
                        {filteredEvents.length === 0
                          ? '0-0 of 0'
                          : `${(page - 1) * pageSize + 1}-${Math.min(
                              page * pageSize,
                              filteredEvents.length
                            )} of ${filteredEvents.length}`}
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
          {selectedEvent && (
            <ApprovedEventDetailModal
              event={selectedEvent}
              onClose={() => setSelectedEvent(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
};
