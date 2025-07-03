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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
} from '@/components/ui/pagination';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import { getApprovedNews } from '@/services/Admin/news.service';
import { getUserByIdAPI } from '@/services/Admin/user.service';
import { hideNews, showNews } from '@/services/Admin/news.service';
import type { News } from '@/types/Admin/news';
import { FaEye } from 'react-icons/fa';
import ApprovedNewsDetailModal from './ApprovedNewsDetailModal';
import { Switch } from '@/components/ui/switch';
import { toast } from 'react-toastify';

const pageSizeOptions = [5, 10, 20, 50];

export const ApprovedNewsList = ({ activeTab }: { activeTab: string }) => {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [selectedNews, setSelectedNews] = useState<News | null>(null);
  const [authorNames, setAuthorNames] = useState<Record<string, string>>({});

  const fetchData = () => {
    setLoading(true);
    getApprovedNews(1, 100)
      .then((res) => {
        setNews(res.data.items || []);
      })
      .finally(() => setTimeout(() => setLoading(false), 500));
  };

  useEffect(() => {
    if (activeTab !== 'approved') return;
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    const fetchAuthors = async () => {
      const ids = Array.from(new Set(news.map((n) => n.authorId).filter(Boolean)));
      const names: Record<string, string> = {};
      await Promise.all(
        ids.map(async (id) => {
          try {
            const res = await getUserByIdAPI(id);
            names[id] = res.fullName || id;
          } catch {
            names[id] = id;
          }
        })
      );
      setAuthorNames(names);
    };
    if (news.length > 0) fetchAuthors();
  }, [news]);

  const filteredNews = news.filter(
    (item) => !search || item.newsTitle.toLowerCase().includes(search.trim().toLowerCase())
  );
  const pagedNews = filteredNews.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filteredNews.length / pageSize));

  // Toggle status handler (giống NewsOwnList)
  const handleToggleStatus = async (item: News) => {
    try {
      if (item.status) {
        await hideNews(item.newsId);
        toast.success('News hidden successfully!');
      } else {
        await showNews(item.newsId);
        toast.success('News shown successfully!');
      }
      fetchData();
    } catch {
      toast.error('Failed to update status!');
    }
  };

  return (
    <div className="p-3">
      <SpinnerOverlay show={loading} />
      <div className="overflow-x-auto">
        <div className="p-4 bg-white rounded-xl shadow">
          {/* Search */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
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
                  placeholder="Search by news title..."
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
          </div>
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="bg-green-200 hover:bg-green-200">
                <TableHead className="text-center" style={{ width: '5%' }}>
                  #
                </TableHead>
                <TableHead style={{ width: '25%' }}>Title</TableHead>
                <TableHead style={{ width: '15%' }}>Author Name</TableHead>
                <TableHead className="text-center" style={{ width: '10%' }}>
                  Status
                </TableHead>
                <TableHead className="text-center" style={{ width: '15%' }}>
                  Created At
                </TableHead>
                <TableHead className="text-center" style={{ width: '15%' }}>
                  Updated At
                </TableHead>
                <TableHead className="text-center" style={{ width: '15%' }}>
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedNews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                    No approved news found.
                  </TableCell>
                </TableRow>
              ) : (
                pagedNews.map((item, idx) => (
                  <TableRow key={item.newsId} className="hover:bg-green-50">
                    <TableCell className="text-center">{(page - 1) * pageSize + idx + 1}</TableCell>
                    <TableCell className="truncate max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap">
                      {item.newsTitle}
                    </TableCell>
                    <TableCell className="truncate max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap">
                      {authorNames[item.authorId] || item.authorId || 'unknown'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={item.status}
                        onCheckedChange={() => handleToggleStatus(item)}
                        disabled={loading}
                        className={
                          item.status
                            ? '!bg-green-500 !border-green-500'
                            : '!bg-red-400 !border-red-400'
                        }
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : ''}
                    </TableCell>
                    <TableCell className="text-center flex items-center justify-center gap-2">
                      <button
                        className="border-2 border-green-400 bg-green-400 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[15px] font-semibold text-white flex items-center justify-center hover:bg-green-500 hover:text-white"
                        title="View details"
                        onClick={() => setSelectedNews(item)}
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
                <TableCell colSpan={7}>
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
                        {filteredNews.length === 0
                          ? '0-0 of 0'
                          : `${(page - 1) * pageSize + 1}-${Math.min(
                              page * pageSize,
                              filteredNews.length
                            )} of ${filteredNews.length}`}
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
          {selectedNews && (
            <ApprovedNewsDetailModal news={selectedNews} onClose={() => setSelectedNews(null)} />
          )}
        </div>
      </div>
    </div>
  );
};
