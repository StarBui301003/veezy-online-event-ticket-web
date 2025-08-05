import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
      <DialogContent className="max-w-2xl bg-white dark:bg-gray-800 p-0 shadow-lg rounded-xl border-0 dark:border-0">
        <div className="p-6 border-b border-gray-200 dark:border-0">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800 dark:text-gray-200">
              Payment Detail
            </DialogTitle>
          </DialogHeader>
        </div>
        <div className="p-6 space-y-6 max-h-[50vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Order ID
              </label>
              <input
                value={payment.orderId || 'N/A'}
                readOnly
                className="text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-0 rounded px-3 py-2 w-full text-left"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Amount
              </label>
              <input
                value={payment.amount ? formatCurrency(parseFloat(payment.amount)) : 'N/A'}
                readOnly
                className="text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-0 rounded px-3 py-2 w-full text-left"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Payment Method
              </label>
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
                className="text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-0 rounded px-3 py-2 w-full text-left"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Status
              </label>
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
                className="text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-0 rounded px-3 py-2 w-full text-left"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Transaction Code
              </label>
              <input
                value={payment.transactionCode || 'N/A'}
                readOnly
                className="text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-0 rounded px-3 py-2 w-full text-left"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Paid At
              </label>
              <input
                value={payment.paidAt ? new Date(payment.paidAt).toLocaleString() : 'N/A'}
                readOnly
                className="text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-0 rounded px-3 py-2 w-full text-left"
              />
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-0 flex justify-end gap-3">
          <button
            className="border-2 border-red-500 bg-red-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[14px] font-semibold text-white hover:bg-white hover:text-red-500 hover:border-red-500"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDetailModal;
