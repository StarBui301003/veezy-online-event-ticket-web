import { useEffect, useState } from 'react';
import { connectCommentHub, onComment } from '@/services/signalr.service';
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
import { getAllComment } from '@/services/Admin/comment.service';
import { getEventById } from '@/services/Admin/event.service';
import type { Comment } from '@/types/Admin/comment';
import { FaEye } from 'react-icons/fa';
import CommentDetailModal from './CommentDetailModal';

const pageSizeOptions = [5, 10, 20, 50];

export const CommentList = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [eventNames, setEventNames] = useState<Record<string, string>>({});
  const [viewComment, setViewComment] = useState<Comment | null>(null);

  useEffect(() => {
    connectCommentHub('http://localhost:5004/commentHub');
    setLoading(true);
    getAllComment()
      .then((res) => {
        // Chuẩn hóa lấy mảng comment từ API trả về: res.data là mảng comment
        if (res && Array.isArray(res.data)) {
          setComments(res.data);
        } else {
          setComments([]);
        }
      })
      .finally(() => setTimeout(() => setLoading(false), 500));

    // Lắng nghe realtime SignalR cho comment
    const reload = () => {
      setLoading(true);
      getAllComment()
        .then((res) => {
          if (res && Array.isArray(res.data)) {
            setComments(res.data);
          } else {
            setComments([]);
          }
        })
        .finally(() => setTimeout(() => setLoading(false), 500));
    };
    onComment('OnCommentCreated', reload);
    onComment('OnCommentUpdated', reload);
    onComment('OnCommentDeleted', reload);
  }, []);

  // Function to refresh comments after deletion
  const refreshComments = () => {
    setLoading(true);
    getAllComment()
      .then((res) => {
        if (res && Array.isArray(res.data)) {
          setComments(res.data);
        } else {
          setComments([]);
        }
      })
      .finally(() => setTimeout(() => setLoading(false), 500));
  };

  useEffect(() => {
    const fetchEvents = async () => {
      const eventIds = Array.from(new Set(comments.map((c) => c.eventId).filter(Boolean)));
      const eventMap: Record<string, string> = {};

      await Promise.all([
        ...eventIds.map(async (id) => {
          try {
            const res = await getEventById(id);
            eventMap[id] = res.eventName || id;
          } catch {
            eventMap[id] = id;
          }
        }),
      ]);
      setEventNames(eventMap);
    };
    if (comments.length > 0) fetchEvents();
  }, [comments]);

  const filteredComments = comments; // add filter/search if needed
  const totalItems = filteredComments.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const pagedComments = filteredComments.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="p-6">
      {/* Modal xem chi tiết comment */}
      {viewComment && (
        <CommentDetailModal
          comment={viewComment}
          eventName={eventNames[viewComment.eventId]}
          onClose={() => setViewComment(null)}
          onDelete={refreshComments}
        />
      )}
      <SpinnerOverlay show={loading} />
      <div className="overflow-x-auto">
        <div className="p-4 bg-white rounded-xl shadow">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="bg-blue-200 hover:bg-blue-200">
                <TableHead className="text-center" style={{ width: '5%' }}>
                  #
                </TableHead>
                <TableHead className="text-center" style={{ width: '8%' }}>
                  Avatar
                </TableHead>
                <TableHead className="text-center" style={{ width: '12%' }}>
                  User Name
                </TableHead>
                <TableHead className="text-left" style={{ width: '15%' }}>
                  Event Name
                </TableHead>
                <TableHead className="text-left" style={{ width: '25%' }}>
                  Content
                </TableHead>
                <TableHead className="text-center" style={{ width: '15%' }}>
                  Created At
                </TableHead>
                <TableHead className="text-center" style={{ width: '15%' }}>
                  Updated At
                </TableHead>
                <TableHead className="text-center" style={{ width: '5%' }}>
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedComments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                    No comments found.
                  </TableCell>
                </TableRow>
              ) : (
                pagedComments.map((comment, idx) => (
                  <TableRow key={comment.commentId} className="hover:bg-blue-50">
                    <TableCell className="text-center">{(page - 1) * pageSize + idx + 1}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <img
                          src={comment.avatarUrl || '/src/assets/img/avatar_default.png'}
                          alt="Avatar"
                          className="w-8 h-8 rounded-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/src/assets/img/avatar_default.png';
                          }}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {comment.fullName || 'Unknown User'}
                    </TableCell>
                    <TableCell className="text-left">
                      {eventNames[comment.eventId] || comment.eventId || 'Unknown Event'}
                    </TableCell>
                    <TableCell className="text-left max-w-[200px] truncate" title={comment.content}>
                      {comment.content.length > 50
                        ? comment.content.slice(0, 50) + '...'
                        : comment.content}
                    </TableCell>
                    <TableCell className="text-center">
                      {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ''}
                    </TableCell>
                    <TableCell className="text-center">
                      {comment.updatedAt ? new Date(comment.updatedAt).toLocaleString() : ''}
                    </TableCell>
                    <TableCell className="text-center flex items-center justify-center gap-2">
                      {/* Nút xem chi tiết */}
                      <button
                        className="border-2 border-yellow-400 bg-yellow-400 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[15px] font-semibold text-white flex items-center justify-center hover:bg-yellow-500 hover:text-white"
                        title="View details"
                        onClick={() => setViewComment(comment)}
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
                        {totalItems === 0
                          ? '0-0 of 0'
                          : `${(page - 1) * pageSize + 1}-${Math.min(
                              page * pageSize,
                              totalItems
                            )} of ${totalItems}`}
                      </span>
                      <span className="text-sm text-gray-700">Rows per page</span>
                      <select
                        className="border rounded px-2 py-1 text-sm bg-white"
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
