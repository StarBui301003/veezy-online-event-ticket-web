/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { Report } from '@/types/Admin/report';
import type { ApprovedEvent } from '@/types/Admin/event';
import type { News } from '@/types/Admin/news';
import { useEffect, useState } from 'react';
import { resolveReport, rejectReport } from '@/services/Admin/report.service'; // sửa import
import { getEventById, hideEvent, showEvent } from '@/services/Admin/event.service';
import { getNewsById, hideNews, showNews } from '@/services/Admin/news.service';
import {
  getUserByIdAPI,
  getAccountDetailsAPI,
  deactivateUserAPI,
} from '@/services/Admin/user.service';
import { getCommentById, deleteComment } from '@/services/Admin/comment.service';
import { toast } from 'react-toastify';
import { onFeedback } from '@/services/signalr.service';
import { useTranslation } from 'react-i18next';
import { FaRegTrashAlt } from 'react-icons/fa';

import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';

interface Props {
  report: Report;
  reporterName?: string;
  onClose: () => void;
  targetTypeMap?: Record<number, string>;
  showNote?: boolean;
  onActionDone?: () => void; // callback reload
}

const ReportDetailModal = ({
  report,
  reporterName,
  onClose,
  targetTypeMap,
  showNote = false,
  onActionDone,
}: Props) => {
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [eventData, setEventData] = useState<ApprovedEvent | null>(null);
  const [newsData, setNewsData] = useState<News | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [commentData, setCommentData] = useState<any>(null);
  const [eventLoading, setEventLoading] = useState(false);
  const [newsLoading, setNewsLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [newsStatusLoading, setNewsStatusLoading] = useState(false);
  const [eventStatusLoading, setEventStatusLoading] = useState(false);
  const [userStatusLoading, setUserStatusLoading] = useState(false);
  const [commentDeleteLoading, setCommentDeleteLoading] = useState(false);
  // const [userNames, setUserNames] = useState<Record<string, string>>({}); // No longer needed
  const { t } = useTranslation();

  const isPending = report.status === 0;
  const isEventTarget = report.targetType === 1; // 1 = Event theo targetTypeMap
  const isNewsTarget = report.targetType === 0; // 0 = News theo targetTypeMap
  const isEventManagerTarget = report.targetType === 2; // 2 = EventManager
  const isCommentTarget = report.targetType === 3; // 3 = Comment

  const getStatusText = (status: string | number) => {
    const statusStr = status.toString();
    switch (statusStr) {
      case '0':
      case 'Pending':
        return 'Pending';
      case '1':
      case 'Resolved':
        return 'Resolved';
      case '2':
      case 'Rejected':
        return 'Rejected';
      default:
        return 'Other';
    }
  };

  // Fetch event data if target type is event
  useEffect(() => {
    if (isEventTarget && report.targetId) {
      setEventLoading(true);
      getEventById(report.targetId)
        .then((event) => {
          setEventData(event);
          // No longer need to fetch user names since they should be included in the response
        })
        .catch((error) => {
          console.error('Failed to fetch event data:', error);
          toast.error('Failed to load event details');
        })
        .finally(() => {
          setEventLoading(false);
        });
    }
  }, [isEventTarget, report.targetId]);

  // Fetch news data if target type is news
  useEffect(() => {
    if (isNewsTarget && report.targetId) {
      setNewsLoading(true);
      getNewsById(report.targetId)
        .then((news) => {
          setNewsData(news);
          // No longer need to fetch user names since they should be included in the response
        })
        .catch((error) => {
          console.error('Failed to fetch news data:', error);
          toast.error('Failed to load news details');
        })
        .finally(() => {
          setNewsLoading(false);
        });
    }
  }, [isNewsTarget, report.targetId]);

  // Fetch account data if target type is EventManager
  useEffect(() => {
    if (isEventManagerTarget && report.targetId) {
      console.log('Fetching account data for targetId (accountId):', report.targetId);
      setUserLoading(true);

      // Get account details using accountId
      getAccountDetailsAPI(report.targetId)
        .then((account) => {
          console.log('Account data fetched successfully:', account);
          console.log('Account data structure:', {
            accountId: account?.accountId,
            username: account?.username,
            email: account?.email,
            isActive: account?.isActive,
            isOnline: account?.isOnline,
            isEmailVerified: account?.isEmailVerified,
            createdAt: account?.createdAt,
          });

          // Map account data to user data format for UI consistency
          const userData = {
            userId: account.accountId, // Use accountId as userId for consistency
            accountId: account.accountId,
            fullName: account.fullName || account.username,
            username: account.username,
            email: account.email,
            isActive: account.isActive,
            isOnline: account.isOnline,
            isEmailVerified: account.isEmailVerified,
            createdAt: account.createdAt,
            role: account.role,
          };

          setUserData(userData);
        })
        .catch((error) => {
          console.error('Failed to fetch account data:', error);
          console.error('Error details:', {
            status: error?.response?.status,
            statusText: error?.response?.statusText,
            data: error?.response?.data,
            message: error?.message,
          });
          toast.error('Failed to load account details');
        })
        .finally(() => {
          setUserLoading(false);
        });
    }
  }, [isEventManagerTarget, report.targetId]);

  // Fetch comment data if target type is Comment
  useEffect(() => {
    if (isCommentTarget && report.targetId) {
      console.log('Fetching comment data for targetId:', report.targetId);
      setCommentLoading(true);
      getCommentById(report.targetId)
        .then((comment) => {
          console.log('Comment data fetched successfully:', comment);
          setCommentData(comment);
        })
        .catch((error) => {
          console.error('Failed to fetch comment data:', error);
          console.error('Error details:', {
            status: error?.response?.status,
            statusText: error?.response?.statusText,
            data: error?.response?.data,
            message: error?.message,
          });
          toast.error('Failed to load comment details');
        })
        .finally(() => {
          setCommentLoading(false);
        });
    }
  }, [isCommentTarget, report.targetId]);

  // Toggle news status handler
  const handleToggleNewsStatus = async () => {
    if (!newsData) return;

    setNewsStatusLoading(true);
    try {
      if (newsData.status) {
        await hideNews(newsData.newsId);
        toast.success('News hidden successfully!');
      } else {
        await showNews(newsData.newsId);
        toast.success('News shown successfully!');
      }
      // Refresh news data
      const updatedNews = await getNewsById(newsData.newsId);
      setNewsData(updatedNews);
    } catch (error) {
      console.error('Failed to toggle news status:', error);
      toast.error('Failed to update news status!');
    } finally {
      setNewsStatusLoading(false);
    }
  };

  // Toggle event status handler
  const handleToggleEventStatus = async () => {
    if (!eventData) return;

    setEventStatusLoading(true);
    try {
      if (eventData.isActive) {
        await hideEvent(eventData.eventId);
        toast.success('Event hidden successfully!');
      } else {
        await showEvent(eventData.eventId);
        toast.success('Event shown successfully!');
      }
      // Refresh event data
      const updatedEvent = await getEventById(eventData.eventId);
      setEventData(updatedEvent);
    } catch (error) {
      console.error('Failed to toggle event status:', error);
      toast.error('Failed to update event status!');
    } finally {
      setEventStatusLoading(false);
    }
  };

  // Toggle user status handler (deactivate only)
  const handleToggleUserStatus = async () => {
    if (!userData) return;

    // Use accountId directly since targetId is accountId
    const accountId = userData.accountId;
    if (!accountId) {
      toast.error('Cannot toggle user status: missing account information');
      return;
    }

    setUserStatusLoading(true);
    try {
      // Always call deactivate API - if user is active, it will deactivate; if inactive, it will activate
      await deactivateUserAPI(accountId);
      toast.success(`User ${userData.isActive ? 'deactivated' : 'activated'} successfully!`);

      // Refresh account data
      try {
        const updatedAccount = await getAccountDetailsAPI(report.targetId);
        // Map account data to user data format for UI consistency
        const updatedUserData = {
          userId: updatedAccount.accountId,
          accountId: updatedAccount.accountId,
          fullName: updatedAccount.fullName || updatedAccount.username,
          username: updatedAccount.username,
          email: updatedAccount.email,
          isActive: updatedAccount.isActive,
          isOnline: updatedAccount.isOnline,
          isEmailVerified: updatedAccount.isEmailVerified,
          createdAt: updatedAccount.createdAt,
          role: updatedAccount.role,
        };
        setUserData(updatedUserData);
      } catch (refreshError) {
        console.warn('Failed to refresh account data after toggle:', refreshError);
        // If refresh fails, update the UI optimistically
        setUserData((prev) => (prev ? { ...prev, isActive: !prev.isActive } : null));
      }
    } catch (error) {
      toast.error(`Failed to toggle user status!`);
      console.error('Error toggling user status:', error);
    } finally {
      setUserStatusLoading(false);
    }
  };

  // Delete comment handler
  const handleDeleteComment = async () => {
    if (!commentData) return;

    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    setCommentDeleteLoading(true);
    try {
      await deleteComment(commentData.commentId);
      toast.success('Comment deleted successfully!');
      // Refresh comment data
      const updatedComment = await getCommentById(report.targetId);
      setCommentData(updatedComment);
    } catch (error) {
      toast.error('Failed to delete comment!');
      console.error('Error deleting comment:', error);
    } finally {
      setCommentDeleteLoading(false);
    }
  };

  const handleAction = async (type: 'approve' | 'reject') => {
    setActionType(type);
    setNote('');
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (actionType === 'approve') {
        await resolveReport(report.reportId, note.trim());
        toast.success(t('approvedSuccessfully'));
      } else {
        await rejectReport(report.reportId, note.trim());
        toast.success(t('rejectedSuccessfully'));
      }
      setActionType(null);
      setNote('');
      if (onActionDone) onActionDone();
      onClose();
    } catch {
      toast.error(t('actionFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleRealtime = (data: any) => {
      if (data && (data.reportId === report.reportId || data === report.reportId)) {
        onClose();
      }
    };
    onFeedback('OnReportCreated', handleRealtime);

    return () => {
      onFeedback('OnReportUpdated', handleRealtime);
      onFeedback('OnReportDeleted', handleRealtime);
      onFeedback('OnReportStatusUpdated', handleRealtime);
    };
  }, [report.reportId, onClose]);

  return (
    <Dialog open={!!report} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl bg-white p-0 shadow-lg">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>{t('reportDetail')}</DialogTitle>
          </DialogHeader>
        </div>
        <div className="space-y-2 max-h-[70vh] overflow-y-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('targetType')}</label>
              <input
                value={
                  targetTypeMap?.[report.targetType] ??
                  (report.targetType === 0
                    ? 'News'
                    : report.targetType === 1
                    ? 'Event'
                    : report.targetType === 2
                    ? 'EventManager'
                    : report.targetType === 3
                    ? 'Comment'
                    : report.targetType === 4
                    ? 'Other'
                    : `Type ${report.targetType}`)
                }
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('reporter')}</label>
              <input
                value={reporterName || report.reporterId}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('status')}</label>
              <div className="bg-gray-200 border rounded px-2 py-1 w-full mb-1">
                {getStatusText(report.status)}
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('reason')}</label>
              <input
                value={report.reason}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">{t('description')}</label>
              <div className="bg-gray-200 border rounded px-2 py-1 w-full mb-1 min-h-[40px] max-h-[120px] overflow-y-auto">
                {report.description ? (
                  <span>{report.description}</span>
                ) : (
                  <span className="text-gray-400">{t('noDescription')}</span>
                )}
              </div>
            </div>
            {/* Hiện Note nếu showNote=true */}
            {showNote && (
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-500 mb-1">{t('note')}</label>
                <div className="bg-gray-200 border rounded px-2 py-1 w-full mb-1 min-h-[40px]">
                  {report.note ? (
                    <span>{report.note}</span>
                  ) : (
                    <span className="text-gray-400">{t('noNote')}</span>
                  )}
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('createdAt')}</label>
              <input
                value={
                  report.createdAt
                    ? new Date(report.createdAt).toLocaleString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                    : 'N/A'
                }
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('updatedAt')}</label>
              <input
                value={
                  report.updatedAt
                    ? new Date(report.updatedAt).toLocaleString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                    : 'N/A'
                }
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
          </div>

          {/* Event Details Table - chỉ hiển thị khi target type là event */}
          {isEventTarget && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">
                {t('eventDetails')}
              </h3>
              {eventLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <p className="mt-2 text-gray-600">{t('loadingEventDetails')}</p>
                </div>
              ) : eventData ? (
                <div className="overflow-x-auto">
                  <Table className="min-w-full border border-gray-200 rounded-lg">
                    <TableHeader>
                      <TableRow className="bg-blue-50 hover:bg-blue-50">
                        <TableHead
                          className="text-center font-semibold text-gray-700"
                          style={{ width: '15%' }}
                        >
                          {t('eventName')}
                        </TableHead>
                        <TableHead
                          className="text-center font-semibold text-gray-700"
                          style={{ width: '15%' }}
                        >
                          {t('location')}
                        </TableHead>
                        <TableHead
                          className="text-center font-semibold text-gray-700"
                          style={{ width: '12%' }}
                        >
                          {t('startDate')}
                        </TableHead>
                        <TableHead
                          className="text-center font-semibold text-gray-700"
                          style={{ width: '12%' }}
                        >
                          {t('endDate')}
                        </TableHead>
                        <TableHead
                          className="text-center font-semibold text-gray-700"
                          style={{ width: '12%' }}
                        >
                          {t('status')}
                        </TableHead>
                        <TableHead
                          className="text-center font-semibold text-gray-700"
                          style={{ width: '12%' }}
                        >
                          {t('createdBy')}
                        </TableHead>
                        <TableHead
                          className="text-center font-semibold text-gray-700"
                          style={{ width: '12%' }}
                        >
                          {t('approvedBy')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="hover:bg-gray-50">
                        <TableCell className="text-center py-3">
                          <div className="font-medium text-gray-900">{eventData.eventName}</div>
                        </TableCell>
                        <TableCell className="text-center py-3">
                          <div className="text-gray-700">{eventData.eventLocation || 'N/A'}</div>
                        </TableCell>
                        <TableCell className="text-center py-3">
                          <div className="text-gray-700">
                            {eventData.startAt
                              ? new Date(eventData.startAt).toLocaleDateString('vi-VN')
                              : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-3">
                          <div className="text-gray-700">
                            {eventData.endAt
                              ? new Date(eventData.endAt).toLocaleDateString('vi-VN')
                              : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-3">
                          <div className="flex items-center justify-center">
                            <Switch
                              checked={eventData.isActive}
                              onCheckedChange={handleToggleEventStatus}
                              disabled={eventStatusLoading}
                              className={
                                eventData.isActive
                                  ? '!bg-green-500 !border-green-500'
                                  : '!bg-red-400 !border-red-400'
                              }
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-3">
                          <div className="text-gray-700">{eventData.createdBy || 'N/A'}</div>
                        </TableCell>
                        <TableCell className="text-center py-3">
                          <div className="text-gray-700">{eventData.approvedBy || 'N/A'}</div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>

                  {/* Additional Event Information */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        {t('eventDescription')}
                      </label>
                      <div className="bg-gray-50 border rounded px-3 py-2 text-sm text-gray-700 max-h-80 overflow-y-auto">
                        {eventData.eventDescription || t('noDescription')}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">{t('tags')}</label>
                      <div className="bg-gray-50 border rounded px-3 py-2 text-sm text-gray-700">
                        {eventData.tags && eventData.tags.length > 0
                          ? eventData.tags.join(', ')
                          : t('noTags')}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>{t('eventNotFound')}</p>
                </div>
              )}
            </div>
          )}

          {/* News Details Table - chỉ hiển thị khi target type là news */}
          {isNewsTarget && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">
                {t('newsDetails')}
              </h3>
              {newsLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <p className="mt-2 text-gray-600">{t('loadingNewsDetails')}</p>
                </div>
              ) : newsData ? (
                <div className="overflow-x-auto">
                  <Table className="min-w-full border border-gray-200 rounded-lg">
                    <TableHeader>
                      <TableRow className="bg-blue-50 hover:bg-blue-50">
                        <TableHead
                          className="text-center font-semibold text-gray-700"
                          style={{ width: '15%' }}
                        >
                          {t('newsTitle')}
                        </TableHead>
                        <TableHead
                          className="text-center font-semibold text-gray-700"
                          style={{ width: '15%' }}
                        >
                          {t('eventName')}
                        </TableHead>
                        <TableHead
                          className="text-center font-semibold text-gray-700"
                          style={{ width: '12%' }}
                        >
                          {t('author')}
                        </TableHead>
                        <TableHead
                          className="text-center font-semibold text-gray-700"
                          style={{ width: '15%' }}
                        >
                          {t('status')}
                        </TableHead>
                        <TableHead
                          className="text-center font-semibold text-gray-700"
                          style={{ width: '15%' }}
                        >
                          {t('createdAt')}
                        </TableHead>
                        <TableHead
                          className="text-center font-semibold text-gray-700"
                          style={{ width: '15%' }}
                        >
                          {t('updatedAt')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="hover:bg-gray-50">
                        <TableCell className="text-center py-3">
                          <div className="font-medium text-gray-900">{newsData.newsTitle}</div>
                        </TableCell>
                        <TableCell className="text-center py-3">
                          <div className="text-gray-700">{newsData.eventName || 'N/A'}</div>
                        </TableCell>
                        <TableCell className="text-center py-3">
                          <div className="text-gray-700">
                            {newsData.authorName || newsData.authorId || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-3">
                          <div className="flex items-center justify-center">
                            <Switch
                              checked={newsData.status}
                              onCheckedChange={handleToggleNewsStatus}
                              disabled={newsStatusLoading}
                              className={
                                newsData.status
                                  ? '!bg-green-500 !border-green-500'
                                  : '!bg-red-400 !border-red-400'
                              }
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-3">
                          <div className="text-gray-700">
                            {newsData.createdAt
                              ? new Date(newsData.createdAt).toLocaleDateString('vi-VN')
                              : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-3">
                          <div className="text-gray-700">
                            {newsData.updatedAt
                              ? new Date(newsData.updatedAt).toLocaleDateString('vi-VN')
                              : 'N/A'}
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>

                  {/* Additional News Information */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        {t('newsDescription')}
                      </label>
                      <div className="bg-gray-50 border rounded px-3 py-2 text-sm text-gray-700 max-h-20 overflow-y-auto">
                        {newsData.newsDescription || t('noDescription')}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">{t('newsContent')}</label>
                      <div
                        className="bg-gray-50 border rounded px-3 py-2 text-sm text-gray-700 max-h-20 overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: newsData.newsContent || t('noContent') }}
                      />
                    </div>
                    {newsData.rejectionReason && (
                      <div className="md:col-span-2">
                        <label className="block text-xs text-gray-500 mb-1">Rejection Reason</label>
                        <div className="bg-red-50 border border-red-200 rounded px-3 py-2 text-sm text-red-700">
                          {newsData.rejectionReason}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>{t('newsNotFound')}</p>
                </div>
              )}
            </div>
          )}

          {/* Comment Details Table - chỉ hiển thị khi target type là Comment */}
          {isCommentTarget && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">
                Comment Details
              </h3>
              {commentLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <p className="mt-2 text-gray-600">Loading comment details...</p>
                </div>
              ) : commentData ? (
                <div className="overflow-x-auto">
                  <Table className="min-w-full border border-gray-200 rounded-lg">
                    <TableHeader>
                      <TableRow className="bg-blue-50 hover:bg-blue-50">
                        <TableHead
                          className="text-center font-semibold text-gray-700"
                          style={{ width: '20%' }}
                        >
                          User
                        </TableHead>
                        <TableHead
                          className="text-center font-semibold text-gray-700"
                          style={{ width: '20%' }}
                        >
                          Event
                        </TableHead>
                        <TableHead
                          className="text-center font-semibold text-gray-700"
                          style={{ width: '40%' }}
                        >
                          Content
                        </TableHead>
                        <TableHead
                          className="text-center font-semibold text-gray-700"
                          style={{ width: '10%' }}
                        >
                          Created At
                        </TableHead>
                        <TableHead
                          className="text-center font-semibold text-gray-700"
                          style={{ width: '10%' }}
                        >
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="hover:bg-gray-50">
                        <TableCell className="text-center py-3">
                          <div className="font-medium text-gray-900">
                            {commentData.fullName || 'Unknown User'}
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-3">
                          <div className="text-gray-700">
                            {commentData.eventName || commentData.eventId || 'Unknown Event'}
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-3">
                          <div className="text-gray-700 max-h-20 overflow-y-auto">
                            {commentData.content ? (
                              <span className="whitespace-pre-wrap">{commentData.content}</span>
                            ) : (
                              <span className="text-gray-400">No content</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-3">
                          <div className="text-gray-700">
                            {commentData.createdAt
                              ? new Date(commentData.createdAt).toLocaleDateString('vi-VN')
                              : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-3">
                          <div className="flex items-center justify-center">
                            <button
                              className="border-2 border-red-500 bg-red-500 rounded-[0.9em] cursor-pointer px-3 py-1 transition-all duration-200 text-[14px] font-semibold text-white hover:bg-white hover:text-red-500 hover:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                              onClick={handleDeleteComment}
                              disabled={commentDeleteLoading}
                              title="Delete Comment"
                            >
                              <FaRegTrashAlt className="w-3 h-3" />
                              {commentDeleteLoading ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Comment not found</p>
                </div>
              )}
            </div>
          )}

          {/* User Details Table - chỉ hiển thị khi target type là EventManager */}
          {isEventManagerTarget && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">
                Event Manager Details
              </h3>
              {userLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <p className="mt-2 text-gray-600">Loading user details...</p>
                </div>
              ) : userData ? (
                <div className="mt-2 max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow">
                  <table className="min-w-full text-sm rounded-xl overflow-hidden">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-900 font-semibold">
                        <th className="px-3 py-2 text-center">#</th>
                        <th className="px-3 py-2 text-center">Name</th>
                        <th className="px-3 py-2 text-center">Username</th>
                        <th className="px-3 py-2 text-center">Email</th>
                        <th className="px-3 py-2 text-center">Status</th>
                        <th className="px-3 py-2 text-center">Online</th>
                        <th className="px-3 py-2 text-center">Email Verified</th>
                        <th className="px-3 py-2 text-center">Created At</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-blue-50 transition-colors">
                        <td className="px-3 py-2 text-center font-medium">1</td>
                        <td className="px-3 py-2 text-center">
                          {userData.fullName || userData.name || 'N/A'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {userData.username || userData.userName || 'N/A'}
                        </td>
                        <td className="px-3 py-2 text-center">{userData.email || 'N/A'}</td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex items-center justify-center">
                            <Switch
                              checked={userData.isActive || false}
                              onCheckedChange={handleToggleUserStatus}
                              disabled={userStatusLoading}
                              className={
                                userData.isActive
                                  ? '!bg-green-500 !border-green-500'
                                  : '!bg-red-400 !border-red-400'
                              }
                            />
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          {userData.isOnline ? 'Online' : 'Offline'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {userData.isEmailVerified ? 'Verified' : 'Not Verified'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {userData.createdAt
                            ? new Date(userData.createdAt).toLocaleString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })
                            : 'N/A'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : userLoading ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p>Loading user details...</p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>User not found or failed to load</p>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="p-4">
          <DialogFooter>
            {/* Nếu là pending thì hiện nút action */}
            {isPending && !actionType && (
              <div className="flex gap-2">
                <button
                  className="border-2 border-green-500 bg-green-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-white hover:text-green-500 hover:border-green-500"
                  onClick={() => handleAction('approve')}
                  type="button"
                >
                  {t('approve')}
                </button>
                <button
                  className="border-2 border-red-500 bg-red-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-white hover:text-red-500 hover:border-red-500"
                  onClick={() => handleAction('reject')}
                  type="button"
                >
                  {t('reject')}
                </button>
                <button
                  className="border-2 border-gray-400 bg-gray-400 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-white hover:text-gray-700 hover:border-gray-400"
                  onClick={onClose}
                  type="button"
                >
                  {t('close')}
                </button>
              </div>
            )}
            {/* Nếu đang approve/reject thì hiện input nhập lý do và xác nhận */}
            {isPending && actionType && (
              <form
                className="flex flex-col gap-2 w-full"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}
              >
                <label className="text-sm font-medium">
                  {actionType === 'approve' ? t('enterApprovalReason') : t('enterRejectionReason')}
                </label>
                <input
                  className="border rounded px-2 py-1"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={
                    actionType === 'approve'
                      ? t('approvalReasonPlaceholder')
                      : t('rejectionReasonPlaceholder')
                  }
                  required
                  disabled={loading}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    className={`border-2 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold ${
                      actionType === 'approve'
                        ? 'border-green-500 bg-green-500 text-white hover:bg-white hover:text-green-500'
                        : 'border-red-500 bg-red-500 text-white hover:bg-white hover:text-red-500'
                    }`}
                    type="submit"
                    disabled={loading}
                  >
                    {loading
                      ? t('processing')
                      : actionType === 'approve'
                      ? t('confirmApprove')
                      : t('confirmReject')}
                  </button>
                  <button
                    className="border-2 border-gray-400 bg-gray-400 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-white hover:text-gray-700 hover:border-gray-400"
                    type="button"
                    onClick={() => {
                      setActionType(null);
                      setNote('');
                    }}
                    disabled={loading}
                  >
                    {t('cancel')}
                  </button>
                </div>
              </form>
            )}
            {/* Nếu không phải pending thì chỉ hiện nút Close */}
            {!isPending && (
              <button
                className="border-2 border-red-500 bg-red-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-white hover:text-red-500 hover:border-red-500"
                onClick={onClose}
                type="button"
              >
                {t('close')}
              </button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDetailModal;
