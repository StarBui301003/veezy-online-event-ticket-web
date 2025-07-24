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
import { getCommentsByPaginate } from '@/services/Admin/comment.service';
import { getEventById } from '@/services/Admin/event.service';
import type { Comment, PaginatedCommentResponse } from '@/types/Admin/comment';
import { FaEye } from 'react-icons/fa';
import CommentDetailModal from './CommentDetailModal';
import { useTranslation } from 'react-i18next';
import AnalyzeCommentModal from './AnalyzeCommentModal';

const pageSizeOptions = [5, 10, 20, 50];

export const CommentList = () => {
  const [data, setData] = useState<PaginatedCommentResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [eventNames, setEventNames] = useState<Record<string, string>>({});
  const [viewComment, setViewComment] = useState<Comment | null>(null);
  const [showAnalyzeModal, setShowAnalyzeModal] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    connectCommentHub('http://localhost:5004/commentHub');
    setLoading(true);
    getCommentsByPaginate(page, pageSize)
      .then((res: PaginatedCommentResponse) => {
        if (res && res.data) {
          setData(res.data);
        } else {
          setData(null);
        }
      })
      .finally(() => setTimeout(() => setLoading(false), 500));
    // Lắng nghe realtime SignalR cho comment
    const reload = () => {
      setLoading(true);
      getCommentsByPaginate(page, pageSize)
        .then((res: PaginatedCommentResponse) => {
          if (res && res.data) {
            setData(res.data);
          } else {
            setData(null);
          }
        })
        .finally(() => setTimeout(() => setLoading(false), 500));
    };
    onComment('OnCommentCreated', reload);
    onComment('OnCommentUpdated', reload);
    onComment('OnCommentDeleted', reload);
  }, [page, pageSize]);

  // Function to refresh comments after deletion
  const refreshComments = () => {
    setLoading(true);
    getCommentsByPaginate(page, pageSize)
      .then((res: PaginatedCommentResponse) => {
        if (res && res.data) {
          setData(res.data);
        } else {
          setData(null);
        }
      })
      .finally(() => setTimeout(() => setLoading(false), 500));
  };

  useEffect(() => {
    const fetchEvents = async () => {
      const eventIds = Array.from(
        new Set((data?.items || []).map((c) => c.eventId).filter(Boolean))
      );
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
    if ((data?.items || []).length > 0) fetchEvents();
  }, [data]);

  const pagedComments = data?.items || [];
  const totalItems = data?.totalItems || 0;
  const totalPages = data?.totalPages || 1;

  return (
    <div className="p-6">
      {viewComment && (
        <CommentDetailModal
          comment={viewComment}
          eventName={eventNames[viewComment.eventId]}
          onClose={() => setViewComment(null)}
          onDelete={refreshComments}
        />
      )}

      <AnalyzeCommentModal open={showAnalyzeModal} onClose={() => setShowAnalyzeModal(false)} />
      <SpinnerOverlay show={loading} />
      <div className="overflow-x-auto">
        <div className="p-4 bg-white rounded-xl shadow">
          <div className="flex justify-end mb-4">
            <button
              className="flex gap-2 items-center border-2 border-green-500 bg-green-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-green-600 hover:text-white hover:border-green-500"
              onClick={() => setShowAnalyzeModal(true)}
            >
              Analyze Comment
            </button>
          </div>
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="bg-blue-200 hover:bg-blue-200">
                <TableHead className="text-center" style={{ width: '5%' }}>
                  #
                </TableHead>

                <TableHead className="text-center" style={{ width: '22%' }}>
                  {t('userName')}
                </TableHead>
                <TableHead className="text-left" style={{ width: '15%' }}>
                  {t('eventName')}
                </TableHead>
                <TableHead className="text-left" style={{ width: '25%' }}>
                  {t('content')}
                </TableHead>
                <TableHead className="text-center" style={{ width: '10%' }}>
                  {t('createdAt')}
                </TableHead>
                <TableHead className="text-center" style={{ width: '10%' }}>
                  {t('updatedAt')}
                </TableHead>
                <TableHead className="text-center" style={{ width: '5%' }}>
                  {t('actions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedComments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                    {t('noCommentsFound')}
                  </TableCell>
                </TableRow>
              ) : (
                pagedComments.map((comment, idx) => (
                  <TableRow key={comment.commentId} className="hover:bg-blue-50">
                    <TableCell className="text-center">{(page - 1) * pageSize + idx + 1}</TableCell>

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
                        title={t('view')}
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
                            >
                              {t('previous')}
                            </PaginationPrevious>
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
                            >
                              {t('next')}
                            </PaginationNext>
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
                      <span className="text-sm text-gray-700">{t('rowsPerPage')}</span>
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
