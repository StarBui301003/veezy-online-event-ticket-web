import { useEffect, useState, useRef } from 'react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableFooter,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { getRejectedEvents, getCategoryById } from '@/services/Admin/event.service';
import type { ApprovedEvent, Category } from '@/types/Admin/event';
import { getUsernameByAccountId } from '@/services/auth.service';
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
import { FaEye } from 'react-icons/fa';
import RejectedEventDetailModal from '@/components/Admin/Modal/RejectedEventDetailModal';

const pageSizeOptions = [5, 10, 20, 50];

export const RejectedEventList = () => {
  const [events, setEvents] = useState<ApprovedEvent[]>([]);
  const [categories, setCategories] = useState<Record<string, Category>>({});
  const [usernames, setUsernames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedEvent, setSelectedEvent] = useState<ApprovedEvent | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoading(true);
    getRejectedEvents()
      .then(async (res) => {
        setEvents(res.data.items);

        // Lấy tất cả categoryId duy nhất từ các event
        const allCategoryIds = Array.from(
          new Set(res.data.items.flatMap((event) => event.categoryIds || []))
        );
        const categoryMap: Record<string, Category> = {};
        await Promise.all(
          allCategoryIds.map(async (id) => {
            try {
              const cat = await getCategoryById(id);
              categoryMap[id] = cat;
            } catch {
              categoryMap[id] = {
                categoryId: id,
                categoryName: 'unknown',
                categoryDescription: '',
              };
            }
          })
        );
        setCategories(categoryMap);

        // Lấy tất cả accountId duy nhất từ approvedBy và createdBy
        const allAccountIds = Array.from(
          new Set(
            res.data.items.flatMap((event) => [event.approvedBy, event.createdBy]).filter(Boolean)
          )
        );
        const usernameMap: Record<string, string> = {};
        await Promise.all(
          allAccountIds.map(async (id) => {
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
      .finally(() => setLoading(false));
  }, []);

  // Fetch all categories for filter
  useEffect(() => {
    (async () => {
      const res = await getRejectedEvents();
      const ids = Array.from(
        new Set(res.data.items.flatMap((event: ApprovedEvent) => event.categoryIds || []))
      );
      const cats: Category[] = [];
      await Promise.all(
        ids.map(async (id) => {
          try {
            const cat = await getCategoryById(id);
            cats.push(cat);
          } catch {
            // ignore
          }
        })
      );
      setAllCategories(cats);
    })();
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

  // Pagination logic
  const pagedEvents = filteredEvents.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / pageSize));

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Rejected Events</h2>
      <div className="overflow-x-auto">
        <div className="p-4 bg-white rounded-xl shadow">
          {/* Filter/Search UI */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
            {/* Search input (left) */}
            <div className="flex-1 flex items-center gap-2 relative">
              <input
                ref={searchInputRef}
                className="border px-3 py-2 rounded w-full max-w-xs pr-8"
                placeholder="Search by event name or creator..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
              {search && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 focus:outline-none"
                  onClick={() => {
                    setSearch('');
                    setPage(1);
                    searchInputRef.current?.focus();
                  }}
                  tabIndex={-1}
                  type="button"
                  aria-label="Clear search"
                >
                  &#10005;
                </button>
              )}
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
          {loading ? (
            <div className="flex flex-col gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-2">
                  <Skeleton className="h-6 w-[25px]  rounded-[12px] bg-slate-200" />
                  <Skeleton className="h-6 w-[294px] rounded-[12px] bg-slate-200" />
                  <Skeleton className="h-6 w-[88px]  rounded-[12px] bg-slate-200" />
                  <Skeleton className="h-6 w-[117px]  rounded-[12px] bg-slate-200" />
                  <Skeleton className="h-6 w-[167px]  rounded-[12px] bg-slate-200" />
                  <Skeleton className="h-6 w-[99px]  rounded-[12px] bg-slate-200" />
                  <Skeleton className="h-6 w-[167px]  rounded-[12px] bg-slate-200" />
                  <Skeleton className="h-6 w-[78px]  rounded-[12px] bg-slate-200" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow className="bg-blue-200 hover:bg-blue-200">
                    <TableHead className="text-center">#</TableHead>
                    <TableHead>Event Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Approved By</TableHead>
                    <TableHead>Approved At</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-center">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedEvents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                        No rejected events found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pagedEvents.map((event, idx) => (
                      <TableRow key={event.eventId} className="hover:bg-gray-50">
                        <TableCell className="text-center">
                          {(page - 1) * pageSize + idx + 1}
                        </TableCell>
                        <TableCell>{event.eventName}</TableCell>
                        <TableCell>
                          {event.categoryIds && event.categoryIds.length > 0
                            ? event.categoryIds
                                .map((id) => categories[id]?.categoryName || id)
                                .join(', ')
                            : 'unknown'}
                        </TableCell>
                        <TableCell>
                          {event.approvedBy
                            ? usernames[event.approvedBy] || event.approvedBy
                            : 'unknown'}
                        </TableCell>
                        <TableCell>
                          {event.approvedAt
                            ? new Date(event.approvedAt).toLocaleString()
                            : 'unknown'}
                        </TableCell>
                        <TableCell>
                          {event.createdBy
                            ? usernames[event.createdBy] || event.createdBy
                            : 'unknown'}
                        </TableCell>
                        <TableCell>
                          {event.createdAt ? new Date(event.createdAt).toLocaleString() : 'unknown'}
                        </TableCell>
                        <TableCell className="text-center">
                          <button
                            className="px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 transition mr-2"
                            onClick={() => setSelectedEvent(event)}
                          >
                            <FaEye className="w-4 h-4" />
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
                                          ? 'bg-blue-500 text-white border hover:bg-blue-700 hover:text-white'
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
            </>
          )}
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
