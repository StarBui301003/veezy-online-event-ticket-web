/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, CreditCard } from "lucide-react";
import { createOrder, createVnPayPayment, useDiscountCode, getOrderById } from '@/services/Event Manager/event.service';

interface CheckoutItem {
  ticketId: string;
  ticketName: string;
  ticketPrice: number;
  quantity: number;
}

interface CheckoutData {
  eventId: string;
  eventName: string;
  eventTime: string;
  customerId: string;
  items: CheckoutItem[];
  discountCode?: string;
  discountAmount?: number;
}

const ConfirmOrderPage = () => {
  const navigate = useNavigate();
  const [checkout, setCheckout] = useState<CheckoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [waitingPayment, setWaitingPayment] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [paymentWindow, setPaymentWindow] = useState<Window | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'error'>("pending");
  const [orderInfo, setOrderInfo] = useState<any>(null);

  useEffect(() => {
    try {
      const data = localStorage.getItem("checkout");
      if (!data) {
        setError("Không tìm thấy thông tin đơn hàng để xác nhận.");
        setLoading(false);
        return;
      }
      const checkoutObj = JSON.parse(data);
      // Always get customerId from account.userId if possible
      try {
        const accStr = localStorage.getItem('account');
        if (accStr) {
          const accObj = JSON.parse(accStr);
          checkoutObj.customerId = accObj.userId || checkoutObj.customerId;
        }
      } catch {/* ignore parse error */}
      setCheckout(checkoutObj);
    } catch {
      setError("Dữ liệu đơn hàng không hợp lệ.");
    } finally {
      setLoading(false);
    }
  }, []);

  const total = checkout
    ? checkout.items.reduce((sum, item) => sum + item.ticketPrice * item.quantity, 0)
    : 0;

  const discountAmount = checkout?.discountAmount || 0;
  const finalTotal = total - discountAmount;

  const handleConfirm = async () => {
    if (!checkout) return;
    setConfirming(true);
    setError(null);
    try {
      // Gọi API tạo order (KHÔNG truyền discountCode)
      const orderPayload = {
        eventId: checkout.eventId,
        customerId: checkout.customerId,
        items: checkout.items.map(i => ({ ticketId: i.ticketId, quantity: i.quantity })),
      };
      const orderRes = await createOrder(orderPayload);
      const orderId = orderRes.orderId;
      if (!orderId) throw new Error('Không lấy được mã đơn hàng từ server.');

      // Nếu có discountCode, gọi tiếp /use và lấy lại order đã giảm giá
      let finalOrder = orderRes;
      if (checkout.discountCode) {
        const useRes = await useDiscountCode(checkout.eventId, checkout.discountCode);
        if (!useRes.flag) {
          throw new Error(useRes.message || 'Mã giảm giá không hợp lệ hoặc không áp dụng được.');
        }
        // Lấy lại order đã giảm giá
        finalOrder = await getOrderById(orderId);
      }

      setOrderInfo(finalOrder); // Lưu lại thông tin đơn hàng đã giảm giá (nếu có)
      // Gọi API tạo thanh toán VNPAY như cũ
      const payRes = await createVnPayPayment(orderId);
      let paymentUrl = '';
      if (payRes && payRes.paymentUrl) paymentUrl = payRes.paymentUrl;
      else if (typeof payRes === 'string' && payRes.startsWith('http')) paymentUrl = payRes;
      else if (payRes.data && typeof payRes.data === 'string' && payRes.data.startsWith('http')) paymentUrl = payRes.data;
      if (!paymentUrl) throw new Error('Không lấy được link thanh toán từ server.');
      // Mở tab mới
      const win = window.open(paymentUrl, '_blank');
      setPaymentWindow(win);
      setWaitingPayment(true);
      // Lưu orderId vào localStorage để callback có thể lấy
      localStorage.setItem('lastOrderId', orderId);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Có lỗi khi tạo đơn hàng/thanh toán.');
    } finally {
      setConfirming(false);
    }
  };

  useEffect(() => {
    if (!waitingPayment) return;
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'PAYMENT_SUCCESS') {
        setWaitingPayment(false);
        setPaymentStatus('success');
        localStorage.removeItem('checkout');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [waitingPayment]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-sky-100 to-blue-200 p-8 text-center">
        <Loader2 className="w-20 h-20 text-blue-600 animate-spin mb-6" />
        <h2 className="text-3xl font-semibold text-blue-700 mb-4">Đang tải đơn hàng...</h2>
        <p className="text-blue-600 text-lg">Vui lòng đợi trong giây lát.</p>
      </div>
    );
  }

  if (error || !checkout) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-center items-center min-h-screen bg-red-50 p-8 text-center"
      >
        <AlertCircle className="w-20 h-20 text-red-500 mb-6" />
        <h2 className="text-3xl font-semibold text-red-700 mb-4">Lỗi</h2>
        <p className="text-red-600 text-lg mb-8">{error || "Không tìm thấy đơn hàng."}</p>
        <button
          onClick={() => navigate("/")}
          className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-all duration-300"
        >
          Về trang chủ
        </button>
      </motion.div>
    );
  }

  if (waitingPayment) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-green-50 via-emerald-100 to-teal-100 p-8 text-center"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full">
          <h2 className="text-2xl font-bold text-emerald-700 mb-4">Đang chờ thanh toán...</h2>
          <div className="mb-4 text-slate-700">Vui lòng hoàn tất thanh toán ở tab mới. Sau khi thanh toán xong, bạn sẽ được chuyển về trang này.</div>
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto my-6" />
          <div className="text-sm text-gray-400">Nếu bạn đã thanh toán xong mà không được chuyển trang, hãy tải lại trang này.</div>
        </div>
      </motion.div>
    );
  }

  if (paymentStatus === 'success' && orderInfo) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-green-50 via-emerald-100 to-teal-100 p-8 text-center"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full">
          <h2 className="text-2xl font-bold text-green-700 mb-4">Thanh toán thành công! Cảm ơn bạn đã đặt hàng.</h2>
          <div className="mb-4 text-left">
            <div className="font-semibold text-lg text-purple-800 mb-1">{orderInfo.eventName || checkout?.eventName}</div>
            <div className="text-xs text-gray-500 mb-2">{orderInfo.createdAt ? new Date(orderInfo.createdAt).toLocaleString('vi-VN') : checkout?.eventTime}</div>
            {orderInfo.discountCode && (
              <div className="text-sm text-amber-600 mb-2">Mã giảm giá: <b>{orderInfo.discountCode}</b></div>
            )}
          </div>
          <div className="mb-4">
            <div className="font-semibold text-slate-700 mb-2">Danh sách vé:</div>
            <div className="divide-y divide-gray-200">
              {(orderInfo.items || checkout?.items || []).map((item: any) => (
                <div key={item.ticketId} className="flex justify-between py-2 text-sm">
                  <span>{item.ticketName} (x{item.quantity})</span>
                  <span>{(item.pricePerTicket ? item.pricePerTicket * item.quantity : item.ticketPrice * item.quantity).toLocaleString('vi-VN')} VNĐ</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-between items-center font-bold text-lg text-emerald-700 border-t border-emerald-200 pt-4 mb-6">
            <span>Tổng cộng:</span>
            <span>{total.toLocaleString('vi-VN')} VNĐ</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between items-center text-lg text-amber-600 mb-2">
              <span>Giảm giá:</span>
              <span>-{discountAmount.toLocaleString('vi-VN')} VNĐ</span>
            </div>
          )}
          <div className="flex justify-between items-center font-bold text-xl text-green-700 border-t border-green-200 pt-2 mb-6">
            <span>Thành tiền:</span>
            <span>{finalTotal.toLocaleString('vi-VN')} VNĐ</span>
          </div>
          <div className="mb-4 text-sm text-gray-500">Mã đơn hàng: <b>{orderInfo.orderId}</b></div>
          <button
            onClick={() => navigate("/")}
            className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:from-emerald-600 hover:to-green-700 transition-all duration-300 flex items-center justify-center"
          >
            Về trang chủ
          </button>
        </div>
      </motion.div>
    );
  }

  if (paymentStatus === 'error') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col justify-center items-center min-h-screen bg-red-50 p-8 text-center"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full">
          <h2 className="text-2xl font-bold text-red-700 mb-4">Thanh toán thất bại</h2>
          <div className="mb-4 text-red-600">Có lỗi xảy ra khi thanh toán. Vui lòng thử lại hoặc liên hệ hỗ trợ.</div>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gradient-to-r from-red-500 to-pink-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:from-red-600 hover:to-pink-700 transition-all duration-300 flex items-center justify-center mb-2"
          >
            Thử lại
          </button>
          <a
            href="mailto:support@yourdomain.com"
            className="w-full block bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg shadow-lg hover:bg-gray-300 transition-all duration-300 text-center"
          >
            Liên hệ hỗ trợ
          </a>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-green-50 via-emerald-100 to-teal-100 p-8 text-center"
    >
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full">
        <h2 className="text-2xl font-bold text-emerald-700 mb-4">Xác nhận đơn hàng</h2>
        <div className="mb-4 text-left">
          <div className="font-semibold text-lg text-purple-800 mb-1">{checkout.eventName}</div>
          <div className="text-xs text-gray-500 mb-2">{checkout.eventTime}</div>
          {checkout.discountCode && (
            <div className="text-sm text-amber-600 mb-2">Mã giảm giá: <b>{checkout.discountCode}</b></div>
          )}
        </div>
        <div className="mb-4">
          <div className="font-semibold text-slate-700 mb-2">Danh sách vé:</div>
          <div className="divide-y divide-gray-200">
            {checkout.items.map((item) => (
              <div key={item.ticketId} className="flex justify-between py-2 text-sm">
                <span>{item.ticketName} (x{item.quantity})</span>
                <span>{(item.ticketPrice * item.quantity).toLocaleString('vi-VN')} VNĐ</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-between items-center font-bold text-lg text-emerald-700 border-t border-emerald-200 pt-4 mb-2">
          <span>Tổng cộng:</span>
          <span>{total.toLocaleString('vi-VN')} VNĐ</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between items-center text-lg text-amber-600 mb-2">
            <span>Giảm giá:</span>
            <span>-{discountAmount.toLocaleString('vi-VN')} VNĐ</span>
          </div>
        )}
        <div className="flex justify-between items-center font-bold text-xl text-green-700 border-t border-green-200 pt-2 mb-6">
          <span>Thành tiền:</span>
          <span>{finalTotal.toLocaleString('vi-VN')} VNĐ</span>
        </div>
        <button
          onClick={handleConfirm}
          disabled={confirming}
          className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:from-emerald-600 hover:to-green-700 transition-all duration-300 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {confirming ? (
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
          ) : (
            <CreditCard className="w-6 h-6 mr-2" />
          )}
          {confirming ? "Đang xử lý..." : "Thanh toán"}
        </button>
      </div>
    </motion.div>
  );
};

export default ConfirmOrderPage; 