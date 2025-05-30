import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { ApprovedEvent, Category } from '@/types/Admin/event';
import { useEffect, useState } from 'react';
import { getUsernameByAccountId } from '@/services/auth.service';
import { getCategoryById } from '@/services/Admin/event.service';

interface Props {
  event: ApprovedEvent;
  onClose: () => void;
}

export const RejectedEventDetailModal = ({ event, onClose }: Props) => {
  const [createdByName, setCreatedByName] = useState<string>('unknown');
  const [approvedByName, setApprovedByName] = useState<string>('unknown');
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
            <b>Start At:</b> {event.startAt ?? 'unknown'}
          </div>
          <div className="flex gap-1">
            <b>End At:</b> {event.endAt ?? 'unknown'}
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
          <div>
            <b>Approved By:</b> {event.approvedBy ? approvedByName : 'unknown'}
          </div>
          <div>
            <b>Approved At:</b> {event.approvedAt ?? 'unknown'}
          </div>
          <div>
            <b>Rejection Reason:</b> {event.rejectionReason ?? 'unknown'}
          </div>
          <div>
            <b>Created By:</b> {event.createdBy ? createdByName : 'unknown'}
          </div>
          <div>
            <b>Created At:</b> {event.createdAt ?? 'unknown'}
          </div>
          <div>
            <b>Bank Account:</b> {event.bankAccount ?? 'unknown'}
          </div>
        </div>
        <div className="p-4 border-t-2 border-gray-400">
          <DialogFooter>
            <button
              className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
              onClick={onClose}
            >
              Close
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RejectedEventDetailModal;
