/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { Report } from '@/types/Admin/report';
import { useEffect, useState } from 'react';
import { resolveReport, rejectReport } from '@/services/Admin/report.service'; // sửa import
import { toast } from 'react-toastify';
import { onFeedback } from '@/services/signalr.service';
import { useTranslation } from 'react-i18next';

interface Props {
  report: Report;
  reporterName?: string;
  onClose: () => void;
  targetTypeMap?: Record<number, string>;
  statusMap?: Record<number, string>;
  showNote?: boolean;
  onActionDone?: () => void; // callback reload
}

const ReportDetailModal = ({
  report,
  reporterName,
  onClose,
  targetTypeMap,
  statusMap,
  showNote = false,
  onActionDone,
}: Props) => {
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const isPending = report.status === 0;

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
      <DialogContent className="max-w-2xl bg-white p-0 shadow-lg">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>{t('reportDetail')}</DialogTitle>
          </DialogHeader>
        </div>
        <div className="space-y-2 max-h-[70vh] overflow-y-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('reportId')}</label>
              <input
                value={report.reportId}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('targetId')}</label>
              <input
                value={report.targetId}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
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
              <input
                value={statusMap?.[report.status] ?? report.status}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
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
                    : 'unknown'
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
                    : 'unknown'
                }
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
          </div>
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
                  {actionType === 'approve'
                    ? t('enterApprovalReason')
                    : t('enterRejectionReason')}
                </label>
                <input
                  className="border rounded px-2 py-1"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={
                    actionType === 'approve' ? t('approvalReasonPlaceholder') : t('rejectionReasonPlaceholder')
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
