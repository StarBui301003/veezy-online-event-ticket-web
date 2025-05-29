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

export const ApprovedEventDetailModal = ({ event, onClose }: Props) => {
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
    if (event.categoryIds && event.categoryIds.length > 0) {
      Promise.all(
        event.categoryIds.map(async (id) => {
          try {
            const cat: Category = await getCategoryById(id);
            return cat.categoryName || id;
          } catch {
            return id;
          }
        })
      ).then(setCategoryNames);
    } else {
      setCategoryNames([]);
    }
  }, [event.createdBy, event.approvedBy, event.categoryIds]);

  return (
    <Dialog open={!!event} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white p-4  shadow-lg">
        <DialogHeader>
          <DialogTitle>Event Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-[70vh] overflow-y-auto">
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
            {event.eventCoverImageUrl ? (
              <img
                src={event.eventCoverImageUrl}
                alt="cover"
                className="w-40 h-24 object-cover rounded border"
              />
            ) : (
              'unknown'
            )}
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
                  <li key={idx}>
                    <div>
                      <b>Position:</b> {c.position ?? 'unknown'}
                    </div>
                    <div>
                      <b>Description:</b> {c.description || 'unknown'}
                    </div>
                    <div>
                      <b>Image:</b>{' '}
                      {c.imageUrl ? (
                        <img
                          src={c.imageUrl}
                          alt="content"
                          className="w-32 h-20 object-cover rounded border mt-1"
                        />
                      ) : (
                        'unknown'
                      )}
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
            <b>Approved At:</b>
            {event.approvedAt ? new Date(event.approvedAt).toLocaleString() : 'unknown'}
          </div>
          <div>
            <b>Rejection Reason:</b> {event.rejectionReason ?? 'unknown'}
          </div>
          <div>
            <b>Created By:</b> {event.createdBy ? createdByName : 'unknown'}
          </div>
          <div>
            <b>Created At:</b>
            {event.createdAt ? new Date(event.createdAt).toLocaleString() : 'unknown'}
          </div>
          <div>
            <b>Bank Account:</b> {event.bankAccount ?? 'unknown'}
          </div>
        </div>
        <DialogFooter>
          <button
            className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
            onClick={onClose}
          >
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApprovedEventDetailModal;
