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
import { resolveReport, rejectReport } from '@/services/Admin/report.service';
import { getEventById, hideEvent, showEvent } from '@/services/Admin/event.service';
import { getNewsById, hideNews, showNews } from '@/services/Admin/news.service';
import { getAccountDetailsAPI, deactivateUserAPI } from '@/services/Admin/user.service';
import { getCommentById, deleteComment } from '@/services/Admin/comment.service';
import { toast } from 'react-toastify';
import { onFeedback } from '@/services/signalr.service';
import { useTranslation } from 'react-i18next';
import { FaRegTrashAlt } from 'react-icons/fa';
import { Switch } from '@/components/ui/switch';

interface Props {
  report: Report;
  reporterName?: string;
  onClose: () => void;
  targetTypeMap?: Record<number, string>;
  showNote?: boolean;
  onActionDone?: () => void;
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
  const { t } = useTranslation();

  const isPending = report.status === 0;
  const isEventTarget = report.targetType === 1;
  const isNewsTarget = report.targetType === 0;
  const isEventManagerTarget = report.targetType === 2;
  const isCommentTarget = report.targetType === 3;

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
          console.log('Event data fetched:', event);
          console.log('Event name:', event?.eventName);
          console.log('All event fields:', Object.keys(event || {}));
          setEventData(event);
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
        .then(async (news) => {
          console.log('📰 News data fetched:', news);
          console.log('📰 News eventName:', news.eventName);
          console.log('📰 News eventId:', news.eventId);
          
          // Nếu có eventId nhưng không có eventName, thì fetch event name
          if (news.eventId && !news.eventName) {
            try {
              const eventData = await getEventById(news.eventId);
              console.log('📰 Event data fetched for news:', eventData);
              setNewsData({
                ...news,
                eventName: eventData.eventName
              });
            } catch (eventError) {
              console.error('Failed to fetch event data for news:', eventError);
              setNewsData(news);
            }
          } else {
            setNewsData(news);
          }
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
      setUserLoading(true);
      getAccountDetailsAPI(report.targetId)
        .then((account) => {
          const userData = {
            userId: account.accountId,
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
      setCommentLoading(true);
      getCommentById(report.targetId)
        .then((comment) => {
          setCommentData(comment);
        })
        .catch((error) => {
          console.error('Failed to fetch comment data:', error);
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
      const updatedEvent = await getEventById(eventData.eventId);
      setEventData(updatedEvent);
    } catch (error) {
      console.error('Failed to toggle event status:', error);
      toast.error('Failed to update event status!');
    } finally {
      setEventStatusLoading(false);
    }
  };

  // Toggle user status handler
  const handleToggleUserStatus = async () => {
    if (!userData) return;
    const accountId = userData.accountId;
    if (!accountId) {
      toast.error('Cannot toggle user status: missing account information');
      return;
    }
    setUserStatusLoading(true);
    try {
      await deactivateUserAPI(accountId);
      toast.success(`User ${userData.isActive ? 'deactivated' : 'activated'} successfully!`);
      try {
        const updatedAccount = await getAccountDetailsAPI(report.targetId);
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

          {/* Event Details Table */}
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
                <div className="mt-2 max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow">
                  <table className="min-w-full text-sm rounded-xl overflow-hidden">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-900 font-semibold">
                        <th className="px-3 py-2 text-center">#</th>
                        <th className="px-3 py-2 text-center">Event Name</th>
                        <th className="px-3 py-2 text-center">Location</th>
                        <th className="px-3 py-2 text-center">Start Date</th>
                        <th className="px-3 py-2 text-center">End Date</th>
                        <th className="px-3 py-2 text-center">Status</th>
                        <th className="px-3 py-2 text-center">Created By</th>
                        <th className="px-3 py-2 text-center">Approved By</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-blue-50 transition-colors">
                        <td className="px-3 py-2 text-center font-medium">1</td>
                        <td className="px-3 py-2 text-center">{eventData.eventName || 'N/A'}</td>
                        <td className="px-3 py-2 text-center">
                          {eventData.eventLocation || 'N/A'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {eventData.startAt
                            ? new Date(eventData.startAt).toLocaleDateString('vi-VN')
                            : 'N/A'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {eventData.endAt
                            ? new Date(eventData.endAt).toLocaleDateString('vi-VN')
                            : 'N/A'}
                        </td>
                        <td className="px-3 py-2 text-center">
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
                        </td>
                        <td className="px-3 py-2 text-center">{eventData.createdBy || 'N/A'}</td>
                        <td className="px-3 py-2 text-center">{eventData.approvedBy || 'N/A'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>{t('eventNotFound')}</p>
                </div>
              )}
            </div>
          )}

          {/* News Details Table */}
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
                <div className="mt-2 max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow">
                  <table className="min-w-full text-sm rounded-xl overflow-hidden">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-900 font-semibold">
                        <th className="px-3 py-2 text-center">#</th>
                        <th className="px-3 py-2 text-center">News Title</th>
                        <th className="px-3 py-2 text-center">Event Name</th>
                        <th className="px-3 py-2 text-center">Author</th>
                        <th className="px-3 py-2 text-center">Status</th>
                        <th className="px-3 py-2 text-center">Created At</th>
                        <th className="px-3 py-2 text-center">Updated At</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-blue-50 transition-colors">
                        <td className="px-3 py-2 text-center font-medium">1</td>
                        <td className="px-3 py-2 text-center">{newsData.newsTitle || 'N/A'}</td>
                        <td className="px-3 py-2 text-center">{newsData.eventName || 'N/A'}</td>
                        <td className="px-3 py-2 text-center">
                          {newsData.authorName || newsData.authorId || 'N/A'}
                        </td>
                        <td className="px-3 py-2 text-center">
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
                        </td>
                        <td className="px-3 py-2 text-center">
                          {newsData.createdAt
                            ? new Date(newsData.createdAt).toLocaleDateString('vi-VN')
                            : 'N/A'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {newsData.updatedAt
                            ? new Date(newsData.updatedAt).toLocaleDateString('vi-VN')
                            : 'N/A'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>{t('newsNotFound')}</p>
                </div>
              )}
            </div>
          )}

          {/* Comment Details Table */}
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
                <div className="mt-2 max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow">
                  <table className="min-w-full text-sm rounded-xl overflow-hidden">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-900 font-semibold">
                        <th className="px-3 py-2 text-center">#</th>
                        <th className="px-3 py-2 text-center">User</th>
                        <th className="px-3 py-2 text-center">Event</th>
                        <th className="px-3 py-2 text-center">Content</th>
                        <th className="px-3 py-2 text-center">Created At</th>
                        <th className="px-3 py-2 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-blue-50 transition-colors">
                        <td className="px-3 py-2 text-center font-medium">1</td>
                        <td className="px-3 py-2 text-center">
                          {commentData.fullName || 'Unknown User'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {commentData.eventName || commentData.eventId || 'Unknown Event'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div className="max-h-20 overflow-y-auto">
                            {commentData.content ? (
                              <span className="whitespace-pre-wrap">{commentData.content}</span>
                            ) : (
                              <span className="text-gray-400">No content</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          {commentData.createdAt
                            ? new Date(commentData.createdAt).toLocaleDateString('vi-VN')
                            : 'N/A'}
                        </td>
                        <td className="px-3 py-2 text-center">
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
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Comment not found</p>
                </div>
              )}
            </div>
          )}

          {/* User Details Table */}
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
