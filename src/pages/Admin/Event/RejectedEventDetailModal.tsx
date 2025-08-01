import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { ApprovedEvent } from '@/types/Admin/event';
import { useEffect, useState } from 'react';
import { getUserByIdAPI } from '@/services/Admin/user.service';
import { getCategoryById } from '@/services/Admin/event.service';
import { Category } from '@/types/Admin/category';
import { NO_IMAGE } from '@/assets/img';
import { useTranslation } from 'react-i18next';

interface Props {
  event: ApprovedEvent;
  onClose: () => void;
}

export const RejectedEventDetailModal = ({ event, onClose }: Props) => {
  const [createdByName, setCreatedByName] = useState<string>('unknown');
  const [approvedByName, setApprovedByName] = useState<string>('unknown');
  const [categoryNames, setCategoryNames] = useState<string[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    if (event.createdBy) {
      getUserByIdAPI(event.createdBy)
        .then((user) => setCreatedByName(user.fullName || user.username || 'unknown'))
        .catch(() => setCreatedByName('unknown'));
    }
    if (event.approvedBy) {
      getUserByIdAPI(event.approvedBy)
        .then((user) => setApprovedByName(user.fullName || user.username || 'unknown'))
        .catch(() => setApprovedByName('unknown'));
    }
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

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = NO_IMAGE;
  };

  return (
    <Dialog open={!!event} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl bg-white p-0 shadow-lg">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>{t('eventDetails')}</DialogTitle>
          </DialogHeader>
        </div>
        <div className="space-y-2 max-h-[70vh] overflow-y-auto p-4">
          {/* Cover Image */}
          <div className="flex flex-col items-center mb-4">
            <div className="w-69 h-48 rounded border bg-gray-100 flex items-center justify-center overflow-hidden mt-1">
              <img
                src={event.eventCoverImageUrl || NO_IMAGE}
                alt="cover"
                className="object-contain w-full h-full"
                onError={handleImgError}
              />
            </div>
          </div>
          {/* Hiển thị từng content riêng biệt nếu có */}
          {event.contents && event.contents.length > 0 && (
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1">{t('contents')}</label>
              <div className="flex flex-col gap-6">
                {event.contents.map((c, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col md:flex-row gap-4 items-start bg-gray-100 rounded px-2 py-2 border"
                  >
                    <div>
                      <img
                        src={c.imageUrl || NO_IMAGE}
                        alt={c.description?.slice(0, 30) || `content-img-${idx}`}
                        className="w-40 h-28 object-cover rounded border mb-2 md:mb-0"
                        onError={handleImgError}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-700 mb-1">#{idx + 1}</div>
                      <div className="text-gray-700 text-sm whitespace-pre-line">
                        {c.description || (
                          <span className="italic text-gray-400">{t('noDescription')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Info fields as input/textarea (style giống category detail) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('name')}</label>
              <input
                value={event.eventName ?? t('unknown')}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('location')}</label>
              <input
                value={event.eventLocation ?? t('unknown')}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('category')}</label>
              <input
                value={categoryNames.length > 0 ? categoryNames.join(', ') : t('unknown')}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('startAt')}</label>
              <input
                value={
                  event.startAt
                    ? new Date(event.startAt).toLocaleString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                    : t('unknown')
                }
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('endAt')}</label>
              <input
                value={
                  event.endAt
                    ? new Date(event.endAt).toLocaleString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                    : t('unknown')
                }
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('tags')}</label>
              <input
                value={event.tags && event.tags.length > 0 ? event.tags.join(', ') : t('unknown')}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('bankAccount')}</label>
              <input
                value={event.bankAccount ?? t('unknown')}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">{t('description')}</label>
            <textarea
              value={event.eventDescription ?? t('unknown')}
              readOnly
              className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('approvedBy')}</label>
              <input
                value={event.approvedBy ? approvedByName : t('unknown')}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('approvedAt')}</label>
              <input
                value={
                  event.approvedAt
                    ? new Date(event.approvedAt).toLocaleString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                    : t('unknown')
                }
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('createdBy')}</label>
              <input
                value={event.createdBy ? createdByName : t('unknown')}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('createdAt')}</label>
              <input
                value={
                  event.createdAt
                    ? new Date(event.createdAt).toLocaleString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                    : t('unknown')
                }
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">{t('rejectionReason')}</label>
            <textarea
              value={event.rejectionReason ?? t('unknown')}
              readOnly
              className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              rows={2}
            />
          </div>
        </div>
        <div className="p-4">
          <DialogFooter>
            <button
              className="border-2 border-red-500 bg-red-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-white hover:text-red-500 hover:border-red-500"
              onClick={onClose}
              type="button"
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
