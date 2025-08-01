import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

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
      <DialogContent className="max-w-2xl bg-white p-0 shadow-lg">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>Order Detail</DialogTitle>
          </DialogHeader>
        </div>
        <div className="space-y-2 max-h-[50vh] overflow-y-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Order ID</label>
              <input
                value={order.orderId}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
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
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Customer ID</label>
              <input
                value={order.customerId}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Customer Name</label>
              <input
                value={order.customerName}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Event ID</label>
              <input
                value={order.eventId}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Event Name</label>
              <input
                value={order.eventName}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Total Amount</label>
              <input
                value={formatCurrency(order.totalAmount)}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Discount Code</label>
              <input
                value={order.discountCode || 'N/A'}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Created At</label>
              <input
                value={order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Paid At</label>
              <input
                value={order.paidAt ? new Date(order.paidAt).toLocaleString() : 'N/A'}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Hold Until</label>
              <input
                value={order.holdUntil ? new Date(order.holdUntil).toLocaleString() : ''}
                readOnly
                className="bg-gray-200 border rounded px-2 py-1 w-full mb-1"
              />
            </div>

            <div className="md:col-span-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Ticket Items</label>
                <div className="mt-2 max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow">
                  {order.items.length === 0 ? (
                    <div className="text-gray-500 p-4">No ticket items found.</div>
                  ) : (
                    <table className="min-w-full text-sm rounded-xl overflow-hidden">
                      <thead>
                        <tr className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-900 font-semibold">
                          <th className="px-3 py-2 text-center">#</th>
                          <th className="px-3 py-2 text-center">Name</th>
                          <th className="px-3 py-2 text-center">Price</th>
                          <th className="px-3 py-2 text-center">Quantity</th>
                          <th className="px-3 py-2 text-center">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item, idx) => (
                          <tr key={item.ticketId} className="hover:bg-blue-50 transition-colors">
                            <td className="px-3 py-2 text-center font-medium">{idx + 1}</td>
                            <td className="px-3 py-2 text-center">
                              <div className="font-medium">{item.ticketName}</div>
                            </td>
                            <td className="px-3 py-2 text-center text-blue-700 font-bold">
                              {formatCurrency(item.pricePerTicket)}
                            </td>
                            <td className="px-3 py-2 text-center">{item.quantity}</td>
                            <td className="px-3 py-2 text-center text-green-600 font-bold">
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

export default OrderDetailModal;
