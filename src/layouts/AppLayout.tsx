import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { ApprovedEvent } from '@/types/Admin/event';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getCategoryById } from '@/services/Admin/event.service';
import { getUserByIdAPI } from '@/services/Admin/user.service';
import { Category } from '@/types/Admin/category';

interface Props {
  event: ApprovedEvent;
  onClose: () => void;
}

export const RejectedEventDetailModal = ({ event, onClose }: Props) => {
  const { t } = useTranslation();
  const [createdByName, setCreatedByName] = useState<string>('unknown');
  const [approvedByName, setApprovedByName] = useState<string>('unknown');
  const [categoryNames, setCategoryNames] = useState<string[]>([]);

  useEffect(() => {
    if (event.createdBy) {
      getUserByIdAPI(event.createdBy)
        .then((name) => setCreatedByName(name || 'unknown'))
        .catch(() => setCreatedByName('unknown'));
    }
    if (event.approvedBy) {
      getUserByIdAPI(event.approvedBy)
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
            <DialogTitle>{t('eventDetails')}</DialogTitle>
          </DialogHeader>
        </div>
        <div className="space-y-2 max-h-[70vh] overflow-y-auto p-4">
          <div>
            <b>{t('eventId')}:</b> {event.eventId ?? 'unknown'}
          </div>
          <div>
            <b>{t('name')}:</b> {event.eventName ?? 'unknown'}
          </div>
          <div>
            <b>{t('description')}:</b> {event.eventDescription ?? 'unknown'}
          </div>
          <div>
            <b>{t('coverImage')}:</b>{' '}
            <div className="w-48 h-32 rounded border bg-gray-100 flex items-center justify-center overflow-hidden mt-1">
              {event.eventCoverImageUrl ? (
                <img
                  src={event.eventCoverImageUrl}
                  alt="cover"
                  className="object-contain w-full h-full"
                />
              ) : (
                <span className="text-gray-400">{t('unknown')}</span>
              )}
            </div>
          </div>
          <div>
            <b>{t('location')}:</b> {event.eventLocation ?? 'unknown'}
          </div>
          <div className="flex gap-1">
            <b>{t('startAt')}:</b> {event.startAt ?? 'unknown'}
          </div>
          <div className="flex gap-1">
            <b>{t('endAt')}:</b> {event.endAt ?? 'unknown'}
          </div>
          <div>
            <b>{t('tags')}:</b> {event.tags && event.tags.length > 0 ? event.tags.join(', ') : 'unknown'}
          </div>
          <div className="flex gap-1">
            <b>{t('category')}:</b>{' '}
            <div className="truncate max-w-[300px]" title={categoryNames.join(', ')}>
              {categoryNames.length > 0 ? categoryNames.join(', ') : 'unknown'}
            </div>
          </div>
          <div>
            <b>{t('contents')}:</b>
            <ul className="list-disc ml-6">
              {event.contents && event.contents.length > 0 ? (
                event.contents.map((c, idx) => (
                  <li key={idx} className="mb-2">
                    {/* <div>
                      <div>Position:</div> {c.position ?? 'unknown'}
                    </div> */}
                    <div>
                      <b>{t('description')}:</b>
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
                          <span className="text-gray-400">{t('unknown')}</span>
                        )}
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <li>{t('unknown')}</li>
              )}
            </ul>
          </div>
          <div>
            <b>{t('approvedBy')}:</b> {event.approvedBy ? approvedByName : 'unknown'}
          </div>
          <div>
            <b>{t('approvedAt')}:</b> {event.approvedAt ?? 'unknown'}
          </div>
          <div>
            <b>{t('rejectionReason')}:</b> {event.rejectionReason ?? 'unknown'}
          </div>
          <div>
            <b>{t('createdBy')}:</b> {event.createdBy ? createdByName : 'unknown'}
          </div>
          <div>
            <b>{t('createdAt')}:</b> {event.createdAt ?? 'unknown'}
          </div>
          <div>
            <b>{t('bankAccount')}:</b> {event.bankAccount ?? 'unknown'}
          </div>
        </div>
        <div className="p-4 border-t-2 border-gray-400">
          <DialogFooter>
            <button
              className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
              onClick={onClose}
            >
              {t('close')}
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RejectedEventDetailModal;
