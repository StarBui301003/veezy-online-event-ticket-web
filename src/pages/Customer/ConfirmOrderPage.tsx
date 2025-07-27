import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, CreditCard } from "lucide-react";
import { createOrder, createVnPayPayment, useDiscountCode, getOrderById } from '@/services/Event Manager/event.service';
import { connectTicketHub, onTicket } from '@/services/signalr.service';
import type { CheckoutData, OrderInfo, CheckoutItem } from '@/types/checkout';
import { useTranslation } from 'react-i18next';


const ConfirmOrderPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const paymentWindowRef = useRef<Window | null>(null);
  const [checkout, setCheckout] = useState<CheckoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [waitingPayment, setWaitingPayment] = useState(false);
  const [paymentStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);

  // Connect to TicketHub for real-time order updates
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      connectTicketHub(token);
      
      // Listen for real-time order updates
      onTicket('OrderCreated', (data: unknown) => {
        console.log('🎫 Order created:', data);
        // Update order info if it matches current order
        if (typeof data === 'object' && data && 'orderId' in data && orderInfo?.orderId === (data as { orderId: string }).orderId) {
          setOrderInfo(data as OrderInfo);
        }
      });
      
      onTicket('OrderUpdated', (data: unknown) => {
        console.log('🎫 Order updated:', data);
        // Update order info if it matches current order
        if (typeof data === 'object' && data && 'orderId' in data && orderInfo?.orderId === (data as { orderId: string }).orderId) {
          setOrderInfo(data as OrderInfo);
        }
      });
      
      onTicket('PaymentCompleted', (data: unknown) => {
        console.log('🎫 Payment completed:', data);
        // Redirect to success page if payment is completed
        if (typeof data === 'object' && data && 'orderId' in data && orderInfo?.orderId === (data as { orderId: string }).orderId) {
          navigate('/customer/payment-success');
        }
      });
      
      onTicket('PaymentFailed', (data: unknown) => {
        console.log('🎫 Payment failed:', data);
        // Redirect to failed page if payment failed
        if (typeof data === 'object' && data && 'orderId' in data && orderInfo?.orderId === (data as { orderId: string }).orderId) {
          navigate('/customer/payment-failed');
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderInfo?.orderId, navigate]);

  useEffect(() => {
    try {
      const data = localStorage.getItem('checkout');
      if (!data) {
        setError(t('orderNotFound'));
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
      setError(t('invalidOrderData'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // FIX: Sửa cách tính total - ưu tiên dùng checkout.totalAmount cho face order
  const total = checkout
    ? checkout.faceOrder && checkout.totalAmount 
      ? checkout.totalAmount // Sử dụng totalAmount từ API nếu là face order
      : checkout.items.reduce((sum, item) => {
          // Tính từ items nếu không phải face order hoặc không có totalAmount
          let price = 0;
          // Ưu tiên pricePerTicket từ API response
          if (typeof item.pricePerTicket === 'number') {
            price = item.pricePerTicket;
          } else if (typeof item.pricePerTicket === 'string') {
            price = parseFloat(item.pricePerTicket) || 0;
          } else if (typeof item.ticketPrice === 'number') {
            price = item.ticketPrice;
          } else if (typeof item.ticketPrice === 'string') {
            price = parseFloat(item.ticketPrice) || 0;
          }
          
          let quantity = 0;
          if (typeof item.quantity === 'number') {
            quantity = item.quantity;
          } else if (typeof item.quantity === 'string') {
            quantity = parseInt(item.quantity) || 0;
          }
          
          return sum + (price * quantity);
        }, 0)
    : 0;

  // FIX: Sửa cách tính discount - ưu tiên dùng từ checkout cho face order
  const discountAmount = checkout?.faceOrder && checkout.discountAmount 
    ? checkout.discountAmount // Dùng discountAmount từ API response nếu là face order
    : checkout?.discountAmount || 0;

  const finalTotal = total - discountAmount;

  const isFaceOrderInvalid = checkout?.faceOrder && (checkout.items.length === 0 || checkout.totalAmount === 0);

  const handleConfirm = async () => {
    if (!checkout) return;
    setConfirming(true);
    setError(null);
    try {
      let orderId = checkout.orderId;
      let finalOrder = null;
      // Nếu là order bằng khuôn mặt đã có orderId, chỉ lấy lại orderInfo
      if (checkout.faceOrder && orderId) {
        finalOrder = await getOrderById(orderId);
      } else {
        // Gọi API tạo order (KHÔNG truyền discountCode)
        const orderPayload = {
          eventId: checkout.eventId,
          customerId: checkout.customerId,
          items: checkout.items.map(i => ({ ticketId: i.ticketId, quantity: i.quantity })),
        };
        const orderRes = await createOrder(orderPayload);
        orderId = orderRes.orderId;
        if (!orderId) throw new Error('Không lấy được mã đơn hàng từ server.');
        // Nếu có discountCode, gọi tiếp /use và lấy lại order đã giảm giá
        finalOrder = orderRes;
        if (checkout.discountCode) {
          const useRes = await useDiscountCode(checkout.eventId, checkout.discountCode);
          if (!useRes.flag) {
            throw new Error(useRes.message || 'Mã giảm giá không hợp lệ hoặc không áp dụng được.');
          }
          // Lấy lại order đã giảm giá
          finalOrder = await getOrderById(orderId);
        }
      }
      setOrderInfo(finalOrder); // Lưu lại thông tin đơn hàng đã giảm giá (nếu có)
      // Gọi API tạo thanh toán VNPAY như cũ
      const payRes = await createVnPayPayment(orderId);
      let paymentUrl = '';
      if (payRes && payRes.paymentUrl) paymentUrl = payRes.paymentUrl;
      else if (typeof payRes === 'string' && payRes.startsWith('http')) paymentUrl = payRes;
      else if (payRes.data && typeof payRes.data === 'string' && payRes.data.startsWith('http'))
        paymentUrl = payRes.data;
      if (!paymentUrl) throw new Error('Không lấy được link thanh toán từ server.');
      // Mở tab mới
      handleStartPayment(paymentUrl);
      // Lưu orderId vào localStorage để callback có thể lấy
      localStorage.setItem('lastOrderId', orderId);
    } catch (err: unknown) {
      let msg = 'Có lỗi khi tạo đơn hàng/thanh toán.';
      if (typeof err === 'object' && err && 'response' in err && (err as { response?: { data?: { message?: string } } }).response?.data?.message) {
        msg = (err as { response: { data: { message: string } } }).response.data.message;
      } else if (typeof err === 'object' && err && 'message' in err && typeof (err as { message?: string }).message === 'string') {
        msg = (err as { message: string }).message;
      }
      setError(msg);
    } finally {
      setConfirming(false);
    }
  };

  // Khi bắt đầu thanh toán, mở tab mới:
  const handleStartPayment = (paymentUrl: string) => {
    if (paymentWindowRef.current && !paymentWindowRef.current.closed) {
      paymentWindowRef.current.close();
    }
    paymentWindowRef.current = window.open(paymentUrl, "_blank");
    setWaitingPayment(true);
  };

  // Lắng nghe message từ tab thanh toán
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "PAYMENT_SUCCESS") {
        setWaitingPayment(false);
        navigate("/payment-success");
      }
      if (event.data?.type === "PAYMENT_FAILED") {
        setWaitingPayment(false);
        navigate("/payment-failed");
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [navigate]);

  // Kiểm tra tab thanh toán bị đóng mà không thành công
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (waitingPayment && paymentWindowRef.current) {
      interval = setInterval(() => {
        if (paymentWindowRef.current && paymentWindowRef.current.closed) {
          setWaitingPayment(false);
          navigate("/payment-failed");
          clearInterval(interval);
        }
      }, 500);
    }
    return () => interval && clearInterval(interval);
  }, [waitingPayment, navigate]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-sky-100 to-blue-200 p-8 text-center">
        <Loader2 className="w-20 h-20 text-blue-600 animate-spin mb-6" />
        <h2 className="text-3xl font-semibold text-blue-700 mb-4">{t('loadingOrder')}</h2>
        <p className="text-blue-600 text-lg">{t('pleaseWait')}</p>
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
        <h2 className="text-3xl font-semibold text-red-700 mb-4">{t('error')}</h2>
        <p className="text-red-600 text-lg mb-8">{error || t('orderNotFound')}</p>
        <button
          onClick={() => navigate('/')}
          className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-all duration-300"
        >
          {t('backToHome')}
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
          <h2 className="text-2xl font-bold text-emerald-700 mb-4">{t('waitingPayment')}</h2>
          <div className="mb-4 text-slate-700">
            {t('completePaymentInNewTab')}
          </div>
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto my-6" />
          <div className="text-sm text-gray-400">
            {t('ifPaymentNotCompletedReloadPage')}
          </div>
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
          <h2 className="text-2xl font-bold text-green-700 mb-4">
            {t('paymentSuccessful')} {t('thankYouForOrder')}
          </h2>
          <div className="mb-4 text-left">
            <div className="font-semibold text-lg text-purple-800 mb-1">
              {orderInfo.eventName || checkout?.eventName}
            </div>
            <div className="text-xs text-gray-500 mb-2">
              {orderInfo.createdAt
                ? new Date(orderInfo.createdAt).toLocaleString('vi-VN')
                : checkout?.eventTime}
            </div>
            {checkout.discountCode && (
              <div className="text-sm text-amber-600 mb-2">
                {t('discountCode')}: <b>{checkout.discountCode}</b>
              </div>
            )}
          </div>
          <div className="mb-4">
            <div className="font-semibold text-slate-700 mb-2">{t('ticketList')}:</div>
            <div className="divide-y divide-gray-200">
              {(orderInfo.items || checkout?.items || []).map((item: CheckoutItem) => {
                // FIX: Xử lý price với type checking - ưu tiên pricePerTicket từ API
                let price = 0;
                if (typeof item.pricePerTicket === 'number') {
                  price = item.pricePerTicket;
                } else if (typeof item.pricePerTicket === 'string') {
                  price = parseFloat(item.pricePerTicket) || 0;
                } else if (typeof item.ticketPrice === 'number') {
                  price = item.ticketPrice;
                } else if (typeof item.ticketPrice === 'string') {
                  price = parseFloat(item.ticketPrice) || 0;
                }
                
                let quantity = 0;
                if (typeof item.quantity === 'number') {
                  quantity = item.quantity;
                } else if (typeof item.quantity === 'string') {
                  quantity = parseInt(item.quantity) || 0;
                }
                
                const subtotal = price * quantity;
                
                return (
                  <div key={item.ticketId} className="flex justify-between py-2 text-sm">
                    <span>
                      {item.ticketName} (x{quantity})
                    </span>
                    <span>
                      {isNaN(subtotal) ? '0' : subtotal.toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex justify-between items-center font-bold text-lg text-emerald-700 border-t border-emerald-200 pt-4 mb-6">
            <span>{t('total')}:</span>
            <span>{isNaN(total) ? '0' : total.toLocaleString('vi-VN')} VNĐ</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between items-center text-lg text-amber-600 mb-2">
              <span>{t('discount')}:</span>
              <span>-{discountAmount.toLocaleString('vi-VN')} VNĐ</span>
            </div>
          )}
          <div className="flex justify-between items-center font-bold text-xl text-green-700 border-t border-green-200 pt-2 mb-6">
            <span>{t('finalTotal')}:</span>
            <span>{isNaN(finalTotal) ? '0' : finalTotal.toLocaleString('vi-VN')} VNĐ</span>
          </div>
          <div className="mb-4 text-sm text-gray-500">
            {t('orderCode')}: <b>{orderInfo.orderId}</b>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:from-emerald-600 hover:to-green-700 transition-all duration-300 flex items-center justify-center"
          >
            {t('backToHome')}
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
          <h2 className="text-2xl font-bold text-red-700 mb-4">{t('paymentFailed')}</h2>
          <div className="mb-4 text-red-600">
            {t('paymentErrorMessage')}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gradient-to-r from-red-500 to-pink-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:from-red-600 hover:to-pink-700 transition-all duration-300 flex items-center justify-center mb-2"
          >
            {t('tryAgain')}
          </button>
          <a
            href="mailto:support@yourdomain.com"
            className="w-full block bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg shadow-lg hover:bg-gray-300 transition-all duration-300 text-center"
          >
            {t('contactSupport')}
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
        <h2 className="text-2xl font-bold text-emerald-700 mb-4">{t('confirmOrder')}</h2>
        <div className="mb-4 text-left">
          <div className="font-semibold text-lg text-purple-800 mb-1">{checkout.eventName}</div>
          <div className="text-xs text-gray-500 mb-2">{checkout.eventTime}</div>
          {checkout.discountCode && (
            <div className="text-sm text-amber-600 mb-2">
              {t('discountCode')}: <b>{checkout.discountCode}</b>
            </div>
          )}
        </div>
        <div className="mb-4">
          <div className="font-semibold text-slate-700 mb-2">{t('ticketList')}:</div>
          <div className="divide-y divide-gray-200">
            {checkout.items.map((item) => {
              // FIX: Xử lý price với type checking - ưu tiên pricePerTicket từ API response
              let price = 0;
              if (typeof item.pricePerTicket === 'number') {
                price = item.pricePerTicket;
              } else if (typeof item.pricePerTicket === 'string') {
                price = parseFloat(item.pricePerTicket) || 0;
              } else if (typeof item.ticketPrice === 'number') {
                price = item.ticketPrice;
              } else if (typeof item.ticketPrice === 'string') {
                price = parseFloat(item.ticketPrice) || 0;
              }
              
              let quantity = 0;
              if (typeof item.quantity === 'number') {
                quantity = item.quantity;
              } else if (typeof item.quantity === 'string') {
                quantity = parseInt(item.quantity) || 0;
              }
              
              const subtotal = price * quantity;
              
              return (
                <div key={item.ticketId} className="flex justify-between py-2 text-sm">
                  <span>
                    {item.ticketName} (x{quantity})
                  </span>
                  <span>{isNaN(subtotal) ? '0' : subtotal.toLocaleString('vi-VN')} VNĐ</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex justify-between items-center font-bold text-lg text-emerald-700 border-t border-emerald-200 pt-4 mb-2">
          <span>{t('total')}:</span>
          <span>{isNaN(total) ? '0' : total.toLocaleString('vi-VN')} VNĐ</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between items-center text-lg text-amber-600 mb-2">
            <span>{t('discount')}:</span>
            <span>-{discountAmount.toLocaleString('vi-VN')} VNĐ</span>
          </div>
        )}
        <div className="flex justify-between items-center font-bold text-xl text-green-700 border-t border-green-200 pt-2 mb-6">
          <span>{t('finalTotal')}:</span>
          <span>{isNaN(finalTotal) ? '0' : finalTotal.toLocaleString('vi-VN')} VNĐ</span>
        </div>
        <button
          onClick={handleConfirm}
          disabled={confirming || isFaceOrderInvalid}
          className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:from-emerald-600 hover:to-green-700 transition-all duration-300 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {confirming ? (
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
          ) : (
            <CreditCard className="w-6 h-6 mr-2" />
          )}
          {isFaceOrderInvalid ? t('faceOrderInvalid') : (confirming ? t('processing') : t('pay'))}
        </button>
        {isFaceOrderInvalid && (
          <div className="text-red-500 mt-2">{t('faceOrderInvalidMessage')}</div>
        )}
      </div>
    </motion.div>
  );
};

export default ConfirmOrderPage;