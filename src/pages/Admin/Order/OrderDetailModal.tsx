import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import type { AdminOrder } from '@/types/Admin/order';
import { formatCurrency } from '@/utils/format';

interface Props {
  order: AdminOrder;
  onClose: () => void;
  onRefresh: () => void;
}

const OrderDetailModal = ({ order, onClose }: Props) => {
  return (
    <Dialog open={!!order} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white dark:bg-gray-800 p-0 shadow-lg rounded-xl border-0 dark:border-0">
        <div className="p-6 border-b border-gray-200 dark:border-0">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800 dark:text-gray-200">
              Order Detail
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
                value={order.orderId}
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
                  const statusStr = order.orderStatus.toString();
                  switch (statusStr) {
                    case '0':
                      return 'Pending';
                    case '1':
                      return 'Paid';
                    case '2':
                      return 'Cancelled';
                    case '3':
                      return 'Refunded';
                    case '4':
                      return 'Expired';
                    case '5':
                      return 'Other';
                    case '6':
                      return 'Payment Success But Ticket Failed';
                    case '7':
                      return 'Failed';
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
                Customer Name
              </label>
              <input
                value={order.customerName}
                readOnly
                className="text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-0 rounded px-3 py-2 w-full text-left"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Event Name
              </label>
              <input
                value={order.eventName}
                readOnly
                className="text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-0 rounded px-3 py-2 w-full text-left"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Total Amount
              </label>
              <input
                value={formatCurrency(order.totalAmount)}
                readOnly
                className="text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-0 rounded px-3 py-2 w-full text-left"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Discount Code
              </label>
              <input
                value={order.discountCode || 'N/A'}
                readOnly
                className="text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-0 rounded px-3 py-2 w-full text-left"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Created At
              </label>
              <input
                value={order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}
                readOnly
                className="text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-0 rounded px-3 py-2 w-full text-left"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Paid At
              </label>
              <input
                value={order.paidAt ? new Date(order.paidAt).toLocaleString() : 'N/A'}
                readOnly
                className="text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-0 rounded px-3 py-2 w-full text-left"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Hold Until
              </label>
              <input
                value={order.holdUntil ? new Date(order.holdUntil).toLocaleString() : ''}
                readOnly
                className="text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-0 rounded px-3 py-2 w-full text-left"
              />
            </div>

            <div className="md:col-span-2">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Ticket Items
                </label>
                <div className="mt-2 max-h-60 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow">
                  {order.items.length === 0 ? (
                    <div className="text-gray-500 dark:text-gray-400 p-4">
                      No ticket items found.
                    </div>
                  ) : (
                    <table className="min-w-full text-sm rounded-xl overflow-hidden">
                      <thead>
                        <tr className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 text-blue-900 dark:text-blue-100 font-semibold">
                          <th className="px-3 py-2 text-center">#</th>
                          <th className="px-3 py-2 text-center">Name</th>
                          <th className="px-3 py-2 text-center">Price</th>
                          <th className="px-3 py-2 text-center">Quantity</th>
                          <th className="px-3 py-2 text-center">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item, idx) => (
                          <tr
                            key={item.ticketId}
                            className="hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors"
                          >
                            <td className="px-3 py-2 text-center font-medium text-gray-900 dark:text-gray-100">
                              {idx + 1}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {item.ticketName}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-center text-blue-700 dark:text-blue-400 font-bold">
                              {formatCurrency(item.pricePerTicket)}
                            </td>
                            <td className="px-3 py-2 text-center text-gray-900 dark:text-gray-100">
                              {item.quantity}
                            </td>
                            <td className="px-3 py-2 text-center text-green-600 dark:text-green-400 font-bold">
                              {formatCurrency(item.subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
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

export default OrderDetailModal;
