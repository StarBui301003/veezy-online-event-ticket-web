import { useEffect, useState } from 'react';
import { getAllNews, deleteNews, deleteNewsImage } from '@/services/Admin/news.service';
import { getUserByIdAPI } from '@/services/Admin/user.service';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import NewsDetailModal from '@/pages/Admin/News/NewsDetailModal';
import { Badge } from '@/components/ui/badge';
import type { News } from '@/types/Admin/news';
import { FaEye, FaRegTrashAlt } from 'react-icons/fa';
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

const pageSizeOptions = [5, 10, 20, 50];

export const NewsList = () => {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState<News | null>(null);
  const [authorNames, setAuthorNames] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setLoading(true);
    getAllNews(1, 100)
      .then((res) => {
        setNews(res.data.items || []);
        // Lấy danh sách authorId duy nhất
        const ids = Array.from(
          new Set((res.data.items || []).map((n) => n.authorId).filter(Boolean))
        );
        Promise.all(
          ids.map(async (id) => {
            try {
              const user = await getUserByIdAPI(id);
              return [id, user.fullName || id] as [string, string];
            } catch {
              return [id, id] as [string, string];
            }
          })
        ).then((arr) => {
          const map: Record<string, string> = {};
          arr.forEach(([id, name]) => (map[id] = name));
          setAuthorNames(map);
        });
      })
      .finally(() => {
        setTimeout(() => setLoading(false), 500);
      });
  }, []);

  const reloadList = () => {
    setLoading(true);
    getAllNews(1, 100)
      .then((res) => {
        setNews(res.data.items || []);
        // Lấy danh sách authorId duy nhất
        const ids = Array.from(
          new Set((res.data.items || []).map((n) => n.authorId).filter(Boolean))
        );
        Promise.all(
          ids.map(async (id) => {
            try {
              const user = await getUserByIdAPI(id);
              return [id, user.fullName || id] as [string, string];
            } catch {
              return [id, id] as [string, string];
            }
          })
        ).then((arr) => {
          const map: Record<string, string> = {};
          arr.forEach(([id, name]) => (map[id] = name));
          setAuthorNames(map);
        });
      })
      .finally(() => {
        setTimeout(() => setLoading(false), 500);
      });
  };

  // Delete handler
  const handleDelete = async (item: News) => {
    if (!window.confirm('Are you sure you want to delete this news?')) return;
    try {
      if (item.imageUrl) {
        await deleteNewsImage(item.imageUrl);
      }
      await deleteNews(item.newsId);
      toast.success('News deleted successfully!');
      reloadList();
    } catch {
      toast.error('Cannot delete this news!');
    }
  };

  const pagedNews = news.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(news.length / pageSize));

  return (
    <div className="pl-1 pt-3">
      <SpinnerOverlay show={loading} />
      <div className="overflow-x-auto">
        <div className="p-4 bg-white rounded-xl shadow">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="bg-blue-200 hover:bg-blue-200">
                <TableHead className="pl-4 text-center" style={{ width: '5%' }}>
                  #
                </TableHead>
                <TableHead style={{ width: '30%' }}>Title</TableHead>
                <TableHead style={{ width: '15%' }}>Author</TableHead>
                <TableHead className="text-center" style={{ width: '10%' }}>
                  Status
                </TableHead>
                <TableHead className="text-center" style={{ width: '10%' }}>
                  Created At
                </TableHead>
                <TableHead className="text-center" style={{ width: '10%' }}>
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
                  <TableCell colSpan={7} className="text-center py-4 text-gray-500">
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
                    <TableCell>{authorNames[item.authorId] || item.authorId}</TableCell>
                    <TableCell className="text-center">
                      {item.status ? (
                        <Badge className="border-green-500 bg-green-500 items-center border-2 rounded-[10px] cursor-pointer transition-all text-white hover:bg-green-600 hover:text-white hover:border-green-500">
                          Active
                        </Badge>
                      ) : (
                        <Badge className="border-red-500 bg-red-500 text-white items-center border-2 rounded-[10px] cursor-pointer transition-all hover:bg-red-600 hover:text-white hover:border-red-500">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : ''}
                    </TableCell>
                    <TableCell className="text-center flex justify-center items-center gap-2">
                      <button
                        className="border-2 border-yellow-400 bg-yellow-400 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[15px] font-semibold text-white flex items-center justify-center hover:bg-yellow-500 hover:text-white"
                        title="View details"
                        onClick={() => setSelectedNews(item)}
                      >
                        <FaEye className="w-4 h-4" />
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
        <NewsDetailModal
          news={selectedNews}
          authorName={authorNames[selectedNews.authorId]}
          onClose={() => setSelectedNews(null)}
        />
      )}
    </div>
  );
};

export default NewsList;
