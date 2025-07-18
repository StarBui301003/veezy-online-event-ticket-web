import { Button } from '@/components/ui/button';
import SpinnerOverlay from '@/components/SpinnerOverlay';

interface OrderHistoryProps {
  orders: any[];
  loading: boolean;
  error: string;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSelectOrder: (order: any) => void;
}

const OrderHistory = ({ orders, loading, error, page, totalPages, onPageChange, onSelectOrder }: OrderHistoryProps) => {
  return (
    <div className="flex flex-col items-center w-full min-h-[400px] animate-in fade-in duration-300">
      <h2 className="text-2xl font-semibold mb-6 text-slate-100 animate-in slide-in-from-top duration-500">
        Lịch sử mua vé
      </h2>
      
      {loading ? (
        <SpinnerOverlay show={true} />
      ) : error ? (
        <div className="text-red-400 mb-4 animate-in slide-in-from-left duration-300 p-4 bg-red-50/10 rounded-lg border border-red-400/20">
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-slate-400 animate-in fade-in duration-500 delay-200 p-8 text-center">
          <div className="text-4xl mb-4 opacity-50">📋</div>
          <p>Bạn chưa có đơn hàng nào.</p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto animate-in slide-in-from-bottom duration-500 delay-100">
          <table className="min-w-full text-sm text-left bg-slate-800/50 backdrop-blur-sm rounded-lg overflow-hidden shadow-xl">
            <thead>
              <tr className="bg-slate-700/80 text-slate-100 border-b border-slate-600/50">
                <th className="px-4 py-3 font-medium">Mã đơn</th>
                <th className="px-4 py-3 font-medium">Sự kiện</th>
                <th className="px-4 py-3 font-medium">Tổng tiền</th>
                <th className="px-4 py-3 font-medium">Ngày mua</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <tr 
                  key={order.orderId} 
                  className="border-b border-slate-600/30 hover:bg-slate-700/50 transition-all duration-200 hover:shadow-lg hover:scale-[1.01] animate-in fade-in duration-300"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="px-4 py-3 font-mono text-slate-300 text-xs">
                    {order.orderId}
                  </td>
                  <td className="px-4 py-3 text-slate-200 font-medium">
                    {order.eventName}
                  </td>
                  <td className="px-4 py-3 text-slate-200 font-semibold">
                    {order.totalAmount?.toLocaleString()}đ
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-xs">
                    {order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : ''}
                  </td>
                  <td className="px-4 py-3">
                    {order.orderStatus === 1 ? (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-400 bg-green-400/10 rounded-full border border-green-400/20 animate-pulse">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5"></span>
                        Đã thanh toán
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-yellow-400 bg-yellow-400/10 rounded-full border border-yellow-400/20">
                        <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full mr-1.5 animate-pulse"></span>
                        Chờ thanh toán
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      onClick={() => onSelectOrder(order)}
                      className="hover:scale-105 transition-transform duration-200 bg-slate-600/50 hover:bg-slate-600 text-slate-200 border-slate-500/50"
                    >
                      Xem vé
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6 gap-3 animate-in slide-in-from-bottom duration-500 delay-300">
              <Button 
                size="sm" 
                variant="secondary" 
                onClick={() => onPageChange(page - 1)} 
                disabled={page === 1}
                className="hover:scale-105 transition-all duration-200 bg-slate-600/50 hover:bg-slate-600 text-slate-200 border-slate-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                ← Trước
              </Button>
              <div className="flex items-center px-4 py-2 text-slate-300 font-medium bg-slate-700/50 rounded-md border border-slate-600/50">
                <span className="animate-pulse">{page}</span>
                <span className="mx-2">/</span>
                <span>{totalPages}</span>
              </div>
              <Button 
                size="sm" 
                variant="secondary" 
                onClick={() => onPageChange(page + 1)} 
                disabled={page === totalPages}
                className="hover:scale-105 transition-all duration-200 bg-slate-600/50 hover:bg-slate-600 text-slate-200 border-slate-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Tiếp →
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;