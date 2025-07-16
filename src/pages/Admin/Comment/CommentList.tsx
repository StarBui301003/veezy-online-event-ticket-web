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
import { getUserByIdAPI } from '@/services/Admin/user.service';
import { getEventById } from '@/services/Admin/event.service';
import type { Comment } from '@/types/Admin/comment';
import { Badge } from '@/components/ui/badge';
import { FaRegTrashAlt } from 'react-icons/fa';
import { FaEye } from 'react-icons/fa';
import { deleteComment } from '@/services/Admin/comment.service';
import { toast } from 'react-toastify';
// Thêm import cho Dialog UI
import CommentDetailModal from './CommentDetailModal';

const pageSizeOptions = [5, 10, 20, 50];

export const CommentList = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
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

  const handleDelete = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      const res = await deleteComment(commentId);
      // Chỉ xóa khỏi state khi res.flag === true (thành công)
      if (res?.flag) {
        setComments((prev) => prev.filter((c) => c.commentId !== commentId));
        toast.success('Comment deleted successfully!');
      } else {
        toast.error(res?.message || 'Cannot delete this comment!');
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err?.message || 'Cannot delete this comment!');
      // Không xóa khỏi state nếu API trả lỗi
    }
  };

  useEffect(() => {
    const fetchUsersAndEvents = async () => {
      const userIds = Array.from(new Set(comments.map((c) => c.userId).filter(Boolean)));
      const eventIds = Array.from(new Set(comments.map((c) => c.eventId).filter(Boolean)));
      const userMap: Record<string, string> = {};
      const eventMap: Record<string, string> = {};

      await Promise.all([
        ...userIds.map(async (id) => {
          try {
            const res = await getUserByIdAPI(id);
            userMap[id] = res.fullName ? res.fullName : 'unknown';
          } catch {
            // Không toast khi user not found, chỉ set 'unknown'
            userMap[id] = 'unknown';
          }
        }),
        ...eventIds.map(async (id) => {
          try {
            const res = await getEventById(id);
            eventMap[id] = res.eventName || id;
          } catch {
            eventMap[id] = id;
          }
        }),
      ]);
      setUserNames(userMap);
      setEventNames(eventMap);
    };
    if (comments.length > 0) fetchUsersAndEvents();
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
          userName={userNames[viewComment.userId]}
          eventName={eventNames[viewComment.eventId]}
          onClose={() => setViewComment(null)}
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
                <TableHead className="text-center" style={{ width: '10%' }}>
                  User Name
                </TableHead>
                <TableHead className="text-left" style={{ width: '15%' }}>
                  Event Name
                </TableHead>
                <TableHead className="text-left" style={{ width: '20%' }}>
                  Content
                </TableHead>
                <TableHead className="text-center" style={{ width: '5%' }}>
                  Created At
                </TableHead>
                <TableHead className="text-center" style={{ width: '5%' }}>
                  Updated At
                </TableHead>
                <TableHead className="text-center" style={{ width: '10%' }}>
                  Status
                </TableHead>
                <TableHead className="text-center" style={{ width: '10%' }}>
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
                      {userNames[comment.userId] || comment.userId || 'unknown'}
                    </TableCell>
                    <TableCell className="text-left">
                      {eventNames[comment.eventId] || comment.eventId || 'unknown'}
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
                    <TableCell className="text-center">
                      {comment.isActive ? (
                        <Badge className="border-green-500 bg-green-500 text-white items-center border-2 rounded-[10px] cursor-pointer transition-all hover:bg-green-600 hover:text-white hover:border-green-500">
                          Active
                        </Badge>
                      ) : (
                        <Badge className="border-red-500 bg-red-500 text-white items-center border-2 rounded-[10px] cursor-pointer transition-all hover:bg-red-600 hover:text-white hover:border-red-500">
                          Inactive
                        </Badge>
                      )}
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
                      {/* Nút xóa */}
                      <button
                        className="border-2 border-red-500 bg-red-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[15px] font-semibold text-white hover:bg-white hover:text-red-500 hover:border-red-500"
                        title="Delete"
                        onClick={() => handleDelete(comment.commentId)}
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
