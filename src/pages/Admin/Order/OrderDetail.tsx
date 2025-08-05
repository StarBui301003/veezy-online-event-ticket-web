import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface OrderTicketItem {
  ticketName: string;
  pricePerTicket: number;
  quantity: number;
  subtotal: number;
}

interface OrderDetailData {
  orderId: string;
  customerName: string;
  eventName: string;
  createdAt: string;
  totalAmount: number;
  discountCode?: string;
  items: OrderTicketItem[];
}

interface OrderDetailProps {
  order: OrderDetailData;
  onClose: () => void;
}

export default function OrderDetail({ order, onClose }: OrderDetailProps) {
  if (!order) return null;
  return (
    <Dialog open={!!order} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white dark:bg-gray-800 p-0 shadow-lg rounded-xl border-0 dark:border-0">
        <div className="p-6 border-b border-gray-200 dark:border-0">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800 dark:text-gray-200">
              Order Details
            </DialogTitle>
          </DialogHeader>
        </div>
        <div className="space-y-2 max-h-[70vh] overflow-y-auto p-6">
          {/* Info fields as input/textarea (style giống event detail) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Order ID
              </label>
              <input
                value={order.orderId ?? 'unknown'}
                readOnly
                className="bg-gray-200 dark:bg-gray-700 border dark:border-gray-600 rounded px-2 py-1 w-full mb-1 text-gray-600 dark:text-gray-300"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Customer Name
              </label>
              <input
                value={order.customerName ?? 'unknown'}
                readOnly
                className="bg-gray-200 dark:bg-gray-700 border dark:border-gray-600 rounded px-2 py-1 w-full mb-1 text-gray-600 dark:text-gray-300"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Event Name
              </label>
              <input
                value={order.eventName ?? 'unknown'}
                readOnly
                className="bg-gray-200 dark:bg-gray-700 border dark:border-gray-600 rounded px-2 py-1 w-full mb-1 text-gray-600 dark:text-gray-300"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Created At
              </label>
              <input
                value={order.createdAt ? new Date(order.createdAt).toLocaleString() : 'unknown'}
                readOnly
                className="bg-gray-200 dark:bg-gray-700 border dark:border-gray-600 rounded px-2 py-1 w-full mb-1 text-gray-600 dark:text-gray-300"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Discount Code
              </label>
              <input
                value={order.discountCode || 'None'}
                readOnly
                className="bg-gray-200 dark:bg-gray-700 border dark:border-gray-600 rounded px-2 py-1 w-full mb-1 text-gray-600 dark:text-gray-300"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Total Amount
              </label>
              <input
                value={order.totalAmount?.toLocaleString('vi-VN') + ' ₫'}
                readOnly
                className="bg-gray-200 dark:bg-gray-700 border dark:border-gray-600 rounded px-2 py-1 w-full mb-1 font-bold text-green-700 dark:text-green-400"
              />
            </div>
          </div>
          {/* Ticket Items Table */}
          <div>
            <div className="font-semibold text-lg mb-2 text-blue-700 dark:text-blue-400">
              Ticket Items
            </div>
            <div className="mt-2 max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow">
              {order.items.length === 0 ? (
                <div className="text-gray-500 p-4">No tickets found.</div>
              ) : (
                <table className="min-w-full text-sm rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-900 font-semibold">
                      <th className="px-3 py-2 text-center">#</th>
                      <th className="px-3 py-2 text-center">Ticket Name</th>
                      <th className="px-3 py-2 text-center">Price</th>
                      <th className="px-3 py-2 text-center">Quantity</th>
                      <th className="px-3 py-2 text-center">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-blue-50 transition-colors">
                        <td className="px-3 py-2 text-center font-medium">{idx + 1}</td>
                        <td className="px-3 py-2 text-center">{item.ticketName}</td>
                        <td className="px-3 py-2 text-center text-blue-700 font-bold">
                          {item.pricePerTicket.toLocaleString('vi-VN')} ₫
                        </td>
                        <td className="px-3 py-2 text-center">{item.quantity}</td>
                        <td className="px-3 py-2 text-center font-semibold">
                          {item.subtotal.toLocaleString('vi-VN')} ₫
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
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
}
