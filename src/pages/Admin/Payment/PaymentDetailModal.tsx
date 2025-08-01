import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

import type { AdminPayment } from '@/types/Admin/order';
import { formatCurrency } from '@/utils/format';

interface Props {
  payment: AdminPayment;
  onClose: () => void;
  onRefresh: () => void;
}

const PaymentDetailModal = ({ payment, onClose }: Props) => {
  return (
    <Dialog open={!!payment} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white p-0 shadow-lg">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>Payment Detail</DialogTitle>
          </DialogHeader>
        </div>
        <div className="space-y-2 max-h-[50vh] overflow-y-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Order ID</label>
              <input
                value={payment.orderId || 'N/A'}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Amount</label>
              <input
                value={payment.amount ? formatCurrency(parseFloat(payment.amount)) : 'N/A'}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Payment Method</label>
              <input
                value={(() => {
                  if (payment.paymentMethod === null) return 'N/A';
                  const methodStr = payment.paymentMethod.toString();
                  switch (methodStr) {
                    case '0':
                      return 'VietQR';
                    case '1':
                      return 'Momo';
                    case '2':
                      return 'VnPay';
                    case '3':
                      return 'Other';
                    default:
                      return 'Unknown';
                  }
                })()}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <input
                value={(() => {
                  if (payment.paymentStatus === null) return 'N/A';
                  const statusStr = payment.paymentStatus.toString();
                  switch (statusStr) {
                    case '0':
                      return 'Success';
                    case '1':
                      return 'Failed';
                    case '2':
                      return 'Pending';
                    case '3':
                      return 'Processing';
                    case '4':
                      return 'Paid';
                    case '5':
                      return 'Rejected';
                    case '6':
                      return 'Other';
                    default:
                      return 'Unknown';
                  }
                })()}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Transaction Code</label>
              <input
                value={payment.transactionCode || 'N/A'}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Paid At</label>
              <input
                value={payment.paidAt ? new Date(payment.paidAt).toLocaleString() : 'N/A'}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
          </div>
        </div>
        <div className="p-4">
          <DialogFooter>
            <button
              className="border-2 border-gray-400 bg-gray-400 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-white hover:text-gray-700 hover:border-gray-400"
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

export default PaymentDetailModal;
