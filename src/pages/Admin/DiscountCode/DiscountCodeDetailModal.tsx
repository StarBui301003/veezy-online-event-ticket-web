import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { getEventById } from '@/services/Admin/event.service';
import { formatDiscountValue, formatMinMaxAmount, getDiscountTypeLabel } from '@/utils/format';

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  discount: any;
  onClose: () => void;
}

export const DiscountCodeDetailModal = ({ discount, onClose }: Props) => {
  const [eventName, setEventName] = useState<string>('');
  const [loadingEventName, setLoadingEventName] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function fetchEventName() {
      if (discount?.eventId) {
        setLoadingEventName(true);
        try {
          const event = await getEventById(discount.eventId);
          if (!ignore) {
            setEventName(event?.eventName || '');
            setLoadingEventName(false); // Dừng loading ngay sau khi lấy xong tên event
          }
        } catch {
          if (!ignore) {
            setEventName('');
            setLoadingEventName(false);
          }
        }
      } else {
        setEventName('');
        setLoadingEventName(false);
      }
    }
    fetchEventName();
    return () => {
      ignore = true;
    };
  }, [discount?.eventId]);

  return (
    <Dialog open={!!discount} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white p-0 shadow-lg">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>Discount Code Details</DialogTitle>
          </DialogHeader>
        </div>
        <div className="space-y-2 max-h-[70vh] overflow-y-auto p-4 pt-0 text-sm">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Event</label>
            <input
              className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              value={loadingEventName ? 'Loading...' : eventName ? eventName : discount.eventId}
              readOnly
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Code</label>
            <input
              className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              value={discount.code}
              readOnly
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Discount Type</label>
            <input
              className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              value={getDiscountTypeLabel(discount.discountType)}
              readOnly
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Value</label>
            <input
              className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              value={formatDiscountValue(discount.value, discount.discountType)}
              readOnly
            />
          </div>
          <div className="flex gap-4 items-center w-full">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Minimum</label>
              <input
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
                value={formatMinMaxAmount(discount.minimum)}
                readOnly
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Maximum</label>
              <input
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
                value={formatMinMaxAmount(discount.maximum)}
                readOnly
              />
            </div>
          </div>
          <div className="flex gap-4 items-center w-full">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Max Usage</label>
              <input
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
                value={discount.maxUsage}
                readOnly
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Used Count</label>
              <input
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
                value={discount.usedCount}
                readOnly
              />
            </div>
          </div>
          <div className="flex gap-4 items-center w-full">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Expired At</label>
              <input
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
                value={discount.expiredAt}
                readOnly
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Created At</label>
              <input
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
                value={discount.createdAt}
                readOnly
              />
            </div>
          </div>
          <div className="flex gap-4 items-center w-full">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Is Expired</label>

              <input
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
                value={discount.isExpired ? 'Yes' : 'No'}
                readOnly
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Is Available</label>
              <input
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
                value={discount.isAvailable ? 'Yes' : 'No'}
                readOnly
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Remaining Usage</label>
            <input
              className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              value={discount.remainingUsage}
              readOnly
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
              Close
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DiscountCodeDetailModal;
