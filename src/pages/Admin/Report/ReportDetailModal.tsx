import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { Report } from '@/types/Admin/report';
import { useState } from 'react';
import { resolveReport, rejectReport } from '@/services/Admin/report.service'; // sửa import
import { toast } from 'react-toastify';

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
        toast.success('Approved successfully!');
      } else {
        await rejectReport(report.reportId, note.trim());
        toast.success('Rejected successfully!');
      }
      setActionType(null);
      setNote('');
      if (onActionDone) onActionDone();
      onClose();
    } catch {
      toast.error('Action failed!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!report} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white p-0 shadow-lg">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
          </DialogHeader>
        </div>
        <div className="space-y-2 max-h-[70vh] overflow-y-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Report ID</label>
              <input
                value={report.reportId}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Target ID</label>
              <input
                value={report.targetId}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Target Type</label>
              <input
                value={targetTypeMap?.[report.targetType] ?? report.targetType}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Reporter</label>
              <input
                value={reporterName || report.reporterId}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <input
                value={statusMap?.[report.status] ?? report.status}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Reason</label>
              <input
                value={report.reason}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Description</label>
              <div className="bg-gray-200 border rounded px-2 py-1 w-full mb-1 min-h-[40px] max-h-[120px] overflow-y-auto">
                {report.description ? (
                  <span>{report.description}</span>
                ) : (
                  <span className="text-gray-400">No description</span>
                )}
              </div>
            </div>
            {/* Hiện Note nếu showNote=true */}
            {showNote && (
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Note</label>
                <div className="bg-gray-200 border rounded px-2 py-1 w-full mb-1 min-h-[40px]">
                  {report.note ? (
                    <span>{report.note}</span>
                  ) : (
                    <span className="text-gray-400">No note</span>
                  )}
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Created At</label>
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
              <label className="block text-xs text-gray-500 mb-1">Updated At</label>
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
                  Approve
                </button>
                <button
                  className="border-2 border-red-500 bg-red-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-white hover:text-red-500 hover:border-red-500"
                  onClick={() => handleAction('reject')}
                  type="button"
                >
                  Reject
                </button>
                <button
                  className="border-2 border-gray-400 bg-gray-400 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-white hover:text-gray-700 hover:border-gray-400"
                  onClick={onClose}
                  type="button"
                >
                  Close
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
                    ? 'Enter reason for approval:'
                    : 'Enter reason for rejection:'}
                </label>
                <input
                  className="border rounded px-2 py-1"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={
                    actionType === 'approve' ? 'Approval reason...' : 'Rejection reason...'
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
                      ? 'Processing...'
                      : actionType === 'approve'
                      ? 'Confirm Approve'
                      : 'Confirm Reject'}
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
                    Cancel
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
                Close
              </button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDetailModal;
