import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { ApprovedEvent } from '@/types/Admin/event';
import { EventApproveStatus } from '@/types/Admin/event';
import { useEffect, useState } from 'react';
import { getUsernameByAccountId } from '@/services/Admin/user.service';
import { approvedRejectEvent, getCategoryById } from '@/services/Admin/event.service';
import { toast } from 'react-toastify';
import { FaSpinner } from 'react-icons/fa';
import { Category } from '@/types/Admin/category';

interface Props {
  event: ApprovedEvent;
  onClose: () => void;
  onActionDone?: () => void;
}

export const PendingEventDetailModal = ({ event, onClose, onActionDone }: Props) => {
  const [createdByName, setCreatedByName] = useState<string>('unknown');
  const [approvedByName, setApprovedByName] = useState<string>('unknown');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [categoryNames, setCategoryNames] = useState<string[]>([]);

  useEffect(() => {
    if (event.createdBy) {
      getUsernameByAccountId(event.createdBy)
        .then((name) => setCreatedByName(name || 'unknown'))
        .catch(() => setCreatedByName('unknown'));
    }
    if (event.approvedBy) {
      getUsernameByAccountId(event.approvedBy)
        .then((name) => setApprovedByName(name || 'unknown'))
        .catch(() => setApprovedByName('unknown'));
    }
    // Chỉ lấy tên category nếu id hợp lệ (UUID)
    if (event.categoryIds && event.categoryIds.length > 0) {
      const isValidCategoryId = (id: string) => !!id && /^[0-9a-fA-F-]{36}$/.test(id);
      Promise.all(
        event.categoryIds.map(async (id) => {
          if (!isValidCategoryId(id)) return 'unknown';
          try {
            const cat: Category = await getCategoryById(id);
            return cat.categoryName || id;
          } catch {
            return 'unknown';
          }
        })
      ).then(setCategoryNames);
    } else {
      setCategoryNames([]);
    }
  }, [event.createdBy, event.approvedBy, event.categoryIds]);

  const handleApprove = async () => {
    setApproveLoading(true);
    setLoading(true);
    try {
      const res = await approvedRejectEvent(event.eventId, EventApproveStatus.Approved, '');
      if (res.flag) {
        toast.success('Approve event successfully!');
        onClose();
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        onActionDone && onActionDone();
      } else {
        toast.error('Approve event failed!');
      }
    } catch {
      toast.error('Approve event failed!');
    } finally {
      setApproveLoading(false);
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please enter a rejection reason!');
      return;
    }
    setRejectLoading(true);
    setLoading(true);
    try {
      const res = await approvedRejectEvent(
        event.eventId,
        EventApproveStatus.Rejected,
        rejectReason
      );
      if (res.flag) {
        toast.success('Reject event successfully!');
        onClose();
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        onActionDone && onActionDone();
      } else {
        toast.error('Reject event failed!');
      }
    } catch {
      toast.error('Reject event failed!');
    } finally {
      setRejectLoading(false);
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!event} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white p-0 shadow-lg">
        <div className="border-b-2 border-gray-400 pb-4 p-4">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
          </DialogHeader>
        </div>
        <div className="space-y-2 max-h-[70vh] overflow-y-auto p-4">
          <div>
            <b>Event ID:</b> {event.eventId ?? 'unknown'}
          </div>
          <div>
            <b>Name:</b> {event.eventName ?? 'unknown'}
          </div>
          <div>
            <b>Description:</b> {event.eventDescription ?? 'unknown'}
          </div>
          <div>
            <b>Cover Image:</b>{' '}
            <div className="w-48 h-32 rounded border bg-gray-100 flex items-center justify-center overflow-hidden mt-1">
              {event.eventCoverImageUrl ? (
                <img
                  src={event.eventCoverImageUrl}
                  alt="cover"
                  className="object-contain w-full h-full"
                />
              ) : (
                <span className="text-gray-400">unknown</span>
              )}
            </div>
          </div>
          <div>
            <b>Location:</b> {event.eventLocation ?? 'unknown'}
          </div>
          <div className="flex gap-1">
            <b>Start At:</b>
            {event.startAt ? new Date(event.startAt).toLocaleString() : 'unknown'}
          </div>
          <div className="flex gap-1">
            <b>End At:</b>
            {event.endAt ? new Date(event.endAt).toLocaleString() : 'unknown'}
          </div>
          <div>
            <b>Tags:</b> {event.tags && event.tags.length > 0 ? event.tags.join(', ') : 'unknown'}
          </div>
          <div className="flex gap-1">
            <b>Category:</b>{' '}
            <div className="truncate max-w-[300px]" title={categoryNames.join(', ')}>
              {categoryNames.length > 0 ? categoryNames.join(', ') : 'unknown'}
            </div>
          </div>
          <div>
            <b>Contents:</b>
            <ul className="list-disc ml-6">
              {event.contents && event.contents.length > 0 ? (
                event.contents.map((c, idx) => (
                  <li key={idx} className="mb-2">
                    {/* <div>
                      <div>Position:</div> {c.position ?? 'unknown'}
                    </div> */}
                    <div>
                      <b>Description:</b>
                      <div>{c.description || 'unknown'}</div>
                    </div>
                    <div>
                      <div className="w-40 h-28 rounded border bg-gray-100 flex items-center justify-center overflow-hidden mt-1">
                        {c.imageUrl ? (
                          <img
                            src={c.imageUrl}
                            alt="content"
                            className="object-contain w-full h-full"
                          />
                        ) : (
                          <span className="text-gray-400">unknown</span>
                        )}
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <li>unknown</li>
              )}
            </ul>
          </div>
          <div className="flex gap-1">
            <b>Approved By:</b> {event.approvedBy ? approvedByName : 'unknown'}
          </div>
          <div className="flex gap-1">
            <b>Approved At:</b>
            {event.approvedAt ? new Date(event.approvedAt).toLocaleString() : 'unknown'}
          </div>
          <div>
            <b>Rejection Reason:</b> {event.rejectionReason ?? 'unknown'}
          </div>
          <div>
            <b>Created By:</b> {event.createdBy ? createdByName : 'unknown'}
          </div>
          <div className="flex gap-1">
            <b>Created At:</b>
            {event.createdAt ? new Date(event.createdAt).toLocaleString() : 'unknown'}
          </div>
          <div>
            <b>Bank Account:</b> {event.bankAccount ?? 'unknown'}
          </div>
        </div>
        <div className="p-4 border-t-2 border-gray-400">
          <DialogFooter>
            {showRejectInput ? (
              <>
                <input
                  className="border px-2 py-1 rounded w-full mb-2"
                  placeholder="Enter rejection reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  disabled={loading}
                />
                <button
                  className={`px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 mr-2 flex items-center justify-center ${
                    rejectLoading || loading ? 'cursor-not-allowed' : ''
                  }`}
                  onClick={handleReject}
                  disabled={loading || rejectLoading}
                >
                  {rejectLoading && <FaSpinner className="animate-spin mr-2" />}
                  Submit
                </button>
                <button
                  className={`px-4 py-2 rounded bg-gray-400 text-white hover:bg-gray-500 ${
                    rejectLoading || loading ? 'cursor-not-allowed' : ''
                  }`}
                  onClick={() => setShowRejectInput(false)}
                  disabled={loading || rejectLoading}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  className={`px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 flex items-center justify-center ${
                    approveLoading || loading ? 'cursor-not-allowed' : ''
                  }`}
                  onClick={handleApprove}
                  disabled={loading || approveLoading}
                >
                  {approveLoading && <FaSpinner className="animate-spin mr-2" />}
                  Approve
                </button>
                <button
                  className={`px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 ${
                    approveLoading || loading ? 'cursor-not-allowed' : ''
                  }`}
                  onClick={() => setShowRejectInput(true)}
                  disabled={loading || approveLoading}
                >
                  Reject
                </button>
                <button
                  className={`px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 ${
                    approveLoading || loading ? 'cursor-not-allowed' : ''
                  }`}
                  onClick={onClose}
                  disabled={loading || approveLoading}
                >
                  Close
                </button>
              </>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PendingEventDetailModal;
