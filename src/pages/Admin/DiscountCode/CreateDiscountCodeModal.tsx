import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { createDiscountCode } from '@/services/Admin/discountCode.service';
import { getApprovedEvents } from '@/services/Admin/event.service';
import { toast } from 'react-toastify';
import type { DiscountCodeCreateInput } from '@/types/Admin/discountCode';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { FaSpinner } from 'react-icons/fa';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export const CreateDiscountCodeModal = ({ open, onClose, onCreated }: Props) => {
  const [form, setForm] = useState<DiscountCodeCreateInput>({
    eventId: '',
    code: '',
    discountType: 0,
    value: 0,
    minimum: 0,
    maximum: 0,
    maxUsage: 1,
    expiredAt: '',
  });
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<{ eventId: string; eventName: string }[]>([]);

  useEffect(() => {
    // Gọi API lấy danh sách event khi mở modal
    if (open) {
      getApprovedEvents({ page: 1, pageSize: 100 })
        .then((res) => {
          setEvents(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            res.data.items.map((e: any) => ({
              eventId: e.eventId,
              eventName: e.eventName,
            }))
          );
        })
        .catch(() => setEvents([]));
    }
  }, [open]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };
  const handleCustomChange = (name: string, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleCreate = async () => {
    if (!form.eventId) {
      toast.error('Event is required!');
      return;
    }
    if (!form.code.trim()) {
      toast.error('Code is required!');
      return;
    }
    if (form.value <= 0) {
      toast.error('Value must be greater than 0!');
      return;
    }
    if (!form.expiredAt) {
      toast.error('Expired At is required!');
      return;
    }
    setLoading(true);
    try {
      // Build payload, only include fields if > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = {
        eventId: form.eventId,
        code: form.code,
        discountType: form.discountType,
        value: form.value,
        expiredAt: form.expiredAt,
      };
      if (form.minimum > 0) payload.minimum = form.minimum;
      if (form.maximum > 0) payload.maximum = form.maximum;
      if (form.maxUsage > 0 && form.maxUsage !== 2147483647) payload.maxUsage = form.maxUsage;

      await createDiscountCode(payload);
      toast.success('Discount code created successfully!');
      setForm({
        eventId: '',
        code: '',
        discountType: 0,
        value: 0,
        minimum: 0,
        maximum: 0,
        maxUsage: 1,
        expiredAt: '',
      });
      onClose();
      if (onCreated) onCreated(); // Only call after success
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create discount code!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white p-0 shadow-lg">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>Create Discount Code</DialogTitle>
          </DialogHeader>
        </div>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto p-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Event</label>
            <Select
              onValueChange={(value) => handleCustomChange('eventId', value)}
              disabled={loading}
              defaultValue={form.eventId}
            >
              <SelectTrigger className=" border-gray-200 w-full border px-3 py-2 rounded">
                <SelectValue placeholder="Select event" />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.eventId} value={event.eventId.toString()}>
                    {event.eventName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Code</label>
            <input
              className="border px-3 py-2 rounded w-full"
              name="code"
              value={form.code}
              onChange={handleInputChange}
              disabled={loading}
              placeholder="Enter code"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Discount Type</label>
            <Select
              value={String(form.discountType)}
              onValueChange={(val) => setForm((prev) => ({ ...prev, discountType: Number(val) }))}
            >
              <SelectTrigger className=" border-gray-200 border px-3 py-2 rounded w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Percentage</SelectItem>
                <SelectItem value="1">Fixed</SelectItem>
                <SelectItem value="3">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Value</label>
            <input
              className="border px-3 py-2 rounded w-full"
              name="value"
              type="number"
              value={form.value}
              onChange={handleInputChange}
              disabled={loading}
              min={0}
              step={0.01}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Minimum</label>
            <input
              className="border px-3 py-2 rounded w-full"
              name="minimum"
              type="number"
              value={form.minimum}
              onChange={handleInputChange}
              disabled={loading}
              min={0}
              step={0.01}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Maximum</label>
            <input
              className="border px-3 py-2 rounded w-full"
              name="maximum"
              type="number"
              value={form.maximum}
              onChange={handleInputChange}
              disabled={loading}
              min={0}
              step={0.01}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Max Usage</label>
            <input
              className="border px-3 py-2 rounded w-full"
              name="maxUsage"
              type="number"
              value={form.maxUsage}
              onChange={handleInputChange}
              disabled={loading}
              min={1}
              step={1}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Expired At</label>
            <input
              className="border px-3 py-2 rounded w-full"
              name="expiredAt"
              type="datetime-local"
              value={form.expiredAt}
              onChange={handleInputChange}
              disabled={loading}
            />
          </div>
        </div>
        <div className="p-4 flex justify-end gap-2">
          <DialogFooter>
            <button
              className="border-2 border-red-500 bg-red-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-white hover:text-red-500 hover:border-red-500"
              onClick={onClose}
              disabled={loading}
              type="button"
            >
              Cancel
            </button>
            <button
              className="border-2 border-[#24b4fb] bg-[#24b4fb] rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-[#0071e2]"
              onClick={handleCreate}
              disabled={loading}
              type="button"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <FaSpinner className="animate-spin" />
                  Creating...
                </div>
              ) : (
                'Create'
              )}
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDiscountCodeModal;
