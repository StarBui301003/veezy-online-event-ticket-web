/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { processFreeOrder } from '@/services/Admin/order.service';
import { toast } from 'react-toastify';

export default function GenerateTicketModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<any[] | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setTickets(null);
    try {
      const res = await processFreeOrder(orderId.trim());
      if (res.success) {
        setTickets(res.tickets || []);
      } else {
        toast.error(res.error || res.message || 'Unknown error');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose} modal>
      <DialogContent className="max-w-md bg-white dark:bg-gray-800 p-0 shadow-lg rounded-xl border-0 dark:border-0">
        <div className="p-6 border-b border-gray-200 dark:border-0">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800 dark:text-gray-200">
              Generate Error Ticket
            </DialogTitle>
          </DialogHeader>
        </div>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto p-6">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Order ID</label>
            <input
              className="border px-3 py-2 rounded w-full text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              disabled={loading}
              placeholder="Nhập Order ID"
            />
          </div>
          {tickets && (
            <div className="mt-4">
              <div className="font-semibold mb-2 text-gray-800 dark:text-gray-200">
                Ticket Information:
              </div>
              <pre className="bg-gray-100 dark:bg-gray-700 rounded p-2 text-xs overflow-x-auto text-gray-800 dark:text-gray-200">
                {JSON.stringify(tickets, null, 2)}
              </pre>
            </div>
          )}
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-0 flex justify-end gap-2">
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
              onClick={handleGenerate}
              disabled={loading || !orderId.trim()}
              type="button"
            >
              {loading ? 'Generating...' : 'Generate'}
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
