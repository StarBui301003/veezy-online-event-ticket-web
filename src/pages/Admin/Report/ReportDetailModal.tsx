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
import { getEventById } from '@/services/Admin/event.service';
import { getNewsById } from '@/services/Admin/news.service';
// import { getUserByIdAPI } from '@/services/Admin/user.service'; // No longer needed
import { toast } from 'react-toastify';
import { onFeedback } from '@/services/signalr.service';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
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
  const [eventLoading, setEventLoading] = useState(false);
  const [newsLoading, setNewsLoading] = useState(false);
  // const [userNames, setUserNames] = useState<Record<string, string>>({}); // No longer needed
  const { t } = useTranslation();

  const isPending = report.status === 0;
  const isEventTarget = report.targetType === 1; // 1 = Event theo targetTypeMap
  const isNewsTarget = report.targetType === 0; // 0 = News theo targetTypeMap

  const getStatusBadge = (status: string | number) => {
    const statusStr = status.toString();
    switch (statusStr) {
      case '0':
      case 'Pending':
        return (
          <Badge className="border-yellow-500 bg-yellow-500 text-white items-center border-2 rounded-[10px] cursor-pointer transition-all hover:bg-yellow-600 hover:text-white">
            Pending
          </Badge>
        );
      case '1':
      case 'Resolved':
        return (
          <Badge className="border-green-500 bg-green-500 text-white items-center border-2 rounded-[10px] cursor-pointer transition-all hover:bg-green-600 hover:text-white">
            Resolved
          </Badge>
        );
      case '2':
      case 'Rejected':
        return (
          <Badge className="border-red-500 bg-red-500 text-white items-center border-2 rounded-[10px] cursor-pointer transition-all hover:bg-red-600 hover:text-white">
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="border-black/70 bg-black/70 text-white items-center border-2 rounded-[10px] cursor-pointer transition-all hover:bg-black/100 hover:text-white">
            Other
          </Badge>
        );
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
      <DialogContent className="max-w-3xl bg-white p-0 shadow-lg">
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
                value={targetTypeMap?.[report.targetType] ?? report.targetType}
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
              <div className="bg-gray-200 border rounded px-2 py-1 w-full mb-1 flex items-center justify-center">
                {getStatusBadge(report.status)}
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
                          <div
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              eventData.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {eventData.isActive ? t('active') : t('inactive')}
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
                          style={{ width: '20%' }}
                        >
                          {t('newsTitle')}
                        </TableHead>
                        <TableHead
                          className="text-center font-semibold text-gray-700"
                          style={{ width: '15%' }}
                        >
                          {t('author')}
                        </TableHead>
                        <TableHead
                          className="text-center font-semibold text-gray-700"
                          style={{ width: '12%' }}
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
                          <div className="text-gray-700">{newsData.authorId || 'N/A'}</div>
                        </TableCell>
                        <TableCell className="text-center py-3">
                          <div
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              newsData.status
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {newsData.status ? t('active') : t('inactive')}
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
                      <div className="bg-gray-50 border rounded px-3 py-2 text-sm text-gray-700 max-h-20 overflow-y-auto">
                        {newsData.newsContent || t('noContent')}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>{t('newsNotFound')}</p>
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
