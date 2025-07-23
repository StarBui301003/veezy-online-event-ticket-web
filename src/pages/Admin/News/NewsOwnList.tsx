import { useEffect, useState } from 'react';
import {
  getOwnNews,
  deleteNews,
  hideNews,
  showNews,
  deleteNewsImage,
} from '@/services/Admin/news.service';
import { connectNewsHub, onNews } from '@/services/signalr.service';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import NewsOwnDetailModal from '@/pages/Admin/News/NewsOwnDetailModal';
import CreateNewsModal from './CreateNewsModal';
import type { News } from '@/types/Admin/news';
import type { NewsListResponse } from '@/types/Admin/news';
import { FaEye, FaRegTrashAlt, FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
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
import EditNewsModal from './EditNewsModal';
import { MdOutlineEdit } from 'react-icons/md';
import { Switch } from '@/components/ui/switch';

const pageSizeOptions = [5, 10, 20, 50];

export const NewsOwnList = ({ activeTab }: { activeTab: string }) => {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState<News | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState(''); // Thêm state search
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editNews, setEditNews] = useState<News | null>(null);

  const fetchData = () => {
    setLoading(true);
    getOwnNews(page, pageSize)
      .then((res: NewsListResponse) => {
        if (res && res.data && Array.isArray(res.data.items)) {
          setNews(res.data.items);
          setTotalPages(res.data.totalPages);
        } else {
          setNews([]);
          setTotalPages(1);
        }
      })
      .finally(() => setTimeout(() => setLoading(false), 500));
  };

  useEffect(() => {
    if (activeTab !== 'own') return;
    connectNewsHub('http://localhost:5004/newsHub');
    fetchData();
    // Lắng nghe realtime SignalR cho news
    const reload = () => fetchData();
    onNews('OnNewsCreated', reload);
    onNews('OnNewsUpdated', reload);
    onNews('OnNewsDeleted', reload);
    onNews('OnNewsHidden', reload);
    onNews('OnNewsUnhidden', reload);
  }, [activeTab, page, pageSize]);

  // Lọc theo search
  const filteredNews = news.filter(
    (item) => !search || item.newsTitle.toLowerCase().includes(search.trim().toLowerCase())
  );
  const pagedNews = filteredNews;

  // Delete handler
  const handleDelete = async (item: News) => {
    if (!window.confirm('Are you sure you want to delete this news?')) return;
    try {
      // Nếu imageUrl là blob (tức là ảnh vừa upload, chưa lưu lên server), bỏ qua xóa ảnh
      if (item.imageUrl && !item.imageUrl.startsWith('blob:')) {
        await deleteNewsImage(item.imageUrl);
      }
      await deleteNews(item.newsId);
      toast.success('News deleted successfully!');
      fetchData();
    } catch {
      toast.error('Cannot delete this news!');
    }
  };

  // Toggle status handler
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

  // Lấy authorId từ localStorage (có thể đặt ngoài useEffect để dùng cho CreateNewsModal)
  const accStr = localStorage.getItem('account');
  let authorId = '';
  if (accStr) {
    try {
      const acc = JSON.parse(accStr);
      authorId = acc.userId;
    } catch {
      authorId = '';
    }
  }

  return (
    <div className="pl-1 pt-3">
      <SpinnerOverlay show={loading} />
      <div className="overflow-x-auto">
        <div className="p-4 bg-white rounded-xl shadow">
          {/* Thanh search và nút create */}
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
                <TableHead className="pl-4 text-center" style={{ width: '5%' }}>
                  #
                </TableHead>
                <TableHead style={{ width: '35%' }}>Title</TableHead>
                <TableHead className="text-center" style={{ width: '10%' }}>
                  Status
                </TableHead>
                <TableHead className="text-center" style={{ width: '15%' }}>
                  Created At
                </TableHead>
                <TableHead className="text-center" style={{ width: '15%' }}>
                  Updated At
                </TableHead>
                <TableHead className="text-center" style={{ width: '20%' }}>
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedNews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                    No news found.
                  </TableCell>
                </TableRow>
              ) : (
                pagedNews.map((item, idx) => (
                  <TableRow key={item.newsId} className="hover:bg-blue-50">
                    <TableCell className="pl-4 text-center">
                      {(page - 1) * pageSize + idx + 1}
                    </TableCell>
                    <TableCell className="truncate max-w-[320px] overflow-hidden text-ellipsis whitespace-nowrap">
                      {item.newsTitle}
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
                        className="border-2 border-yellow-400 bg-yellow-400 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[15px] font-semibold text-white flex items-center justify-center hover:bg-yellow-500 hover:text-white"
                        title="View details"
                        onClick={() => setSelectedNews(item)}
                      >
                        <FaEye className="w-4 h-4" />
                      </button>
                      <button
                        className="border-2 border-[#24b4fb] bg-[#24b4fb] rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[15px] font-semibold text-white hover:bg-[#0071e2]"
                        title="Edit"
                        onClick={() => setEditNews(item)}
                      >
                        <MdOutlineEdit className="w-4 h-4" />
                      </button>
                      <button
                        className="border-2 border-red-500 bg-red-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[15px] font-semibold text-white hover:bg-white hover:text-red-500 hover:border-red-500"
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
                <TableCell colSpan={6}>
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
                        {news.length === 0
                          ? '0-0 of 0'
                          : `${(page - 1) * pageSize + 1}-${Math.min(
                              page * pageSize,
                              news.length
                            )} of ${news.length}`}
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
      {selectedNews && (
        <NewsOwnDetailModal news={selectedNews} onClose={() => setSelectedNews(null)} />
      )}
      <CreateNewsModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={fetchData}
        authorId={authorId}
      />
      {editNews && (
        <EditNewsModal news={editNews} onClose={() => setEditNews(null)} onUpdated={fetchData} />
      )}
    </div>
  );
};

export default NewsOwnList;
