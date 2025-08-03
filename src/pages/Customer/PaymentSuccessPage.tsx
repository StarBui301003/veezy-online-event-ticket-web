import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { connectTicketHub, onTicket } from '@/services/signalr.service';

interface CheckoutData {
  eventName?: string;
  items?: { ticketName: string; quantity: number; ticketPrice: number }[];
  totalAmount?: number;
  orderId?: string;
  ticketGenerated?: boolean;
  discountAmount?: number;
  discountCode?: string;
}

const PaymentSuccessPage = () => {
  const { t } = useTranslation();
  const [checkout, setCheckout] = useState<CheckoutData | null>(null);

  useEffect(() => {
    // Gửi message về opener (tab gốc)
    if (window.opener) {
      window.opener.postMessage({ type: 'PAYMENT_SUCCESS' }, '*');
      sessionStorage.setItem('paymentStatus', 'success');
    }
    const handleUnload = () => {
      if (window.opener && sessionStorage.getItem('paymentStatus') !== 'success') {
        window.opener.postMessage({ type: 'PAYMENT_FAILED' }, '*');
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    
    // Setup realtime listeners for ticket updates
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    
    connectTicketHub(token || undefined);
    
    // Listen for ticket generation
    onTicket('TicketGenerated', (data: any) => {
      // ...removed log...
      if (data.orderId === checkout?.orderId) {
        // Update checkout data with ticket info
        setCheckout(prev => prev ? { ...prev, ticketGenerated: true } : prev);
      }
    });
    
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [checkout?.orderId]);

  useEffect(() => {
    const data = localStorage.getItem('checkout');
    if (data) {
      const parsedData = JSON.parse(data);
      // ...removed log...
      setCheckout(parsedData);
    }
  }, []);

  // Calculate subtotal from items
  const subtotal = checkout?.items?.reduce((sum, item) => {
    return sum + (item.ticketPrice || 0) * (item.quantity || 1);
  }, 0) || 0;


  // Get discount amount from checkout or default to 0
  const discountAmount = checkout?.discountAmount || 0;
  
  // Calculate final total (subtotal - discount)
  const finalTotal = (checkout?.totalAmount !== undefined) 
    ? checkout.totalAmount 
    : Math.max(0, subtotal - discountAmount);

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-green-50 p-8 text-center">
      <div className="relative mb-6">
        <span className="relative flex h-20 w-20">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-20 w-20 bg-green-500 items-center justify-center">
            <Check className="w-12 h-12 text-white" />
          </span>
        </span>
      </div>
      <h2 className="text-3xl font-bold text-green-700 mb-2">{t('paymentSuccessTitle')}</h2>
      <p className="text-green-600 text-lg mb-6">{t('paymentSuccessMessage')}</p>
      
      {checkout?.eventName && (
        <div className="text-xl font-semibold text-green-900 mb-2">🎫 {checkout.eventName}</div>
      )}
      
      {checkout?.orderId && (
        <div className="text-green-700 text-base mb-6">
          {t('orderIdLabel')}: <span className="font-bold">{checkout.orderId}</span>
        </div>
      )}
      
      <div className="bg-white rounded-xl shadow-md border border-green-200 px-6 py-4 mb-6 w-full max-w-md">
        {/* Display ticket details if available */}
        {checkout?.items && checkout.items.length > 0 && (
          <>
            <div className="font-semibold text-green-800 mb-3">{t('ticketDetail')}</div>
            <ul className="text-left space-y-2 mb-4">
              {checkout.items.map((item, idx) => (
                <li key={idx} className="flex justify-between text-green-900">
                  <span>
                    {item.ticketName} <span className="text-green-600">x{item.quantity}</span>
                  </span>
                  <span>{(item.ticketPrice * item.quantity).toLocaleString('vi-VN')} VNĐ</span>
                </li>
              ))}
            </ul>
          </>
        )}
        
        {/* Order summary */}
        <div className="border-t border-gray-200 pt-3 space-y-2">
          {/* Subtotal */}
          <div className="flex justify-between text-gray-700">
            <span>{t('subtotal')}:</span>
            <span>{subtotal.toLocaleString('vi-VN')} VNĐ</span>
          </div>
          
          {/* Discount */}
          {discountAmount > 0 && (
            <div className="flex justify-between text-red-600">
              <div>
                {t('discount')}: {checkout?.discountCode && `(${checkout.discountCode})`}
              </div>
              <span>-{discountAmount.toLocaleString('vi-VN')} VNĐ</span>
            </div>
          )}
          
          {/* Total */}
          <div className="flex justify-between font-bold text-lg text-green-700 pt-2 border-t border-gray-200 mt-2">
            <span>{t('finalTotal')}:</span>
            <span>{finalTotal.toLocaleString('vi-VN')} VNĐ</span>
          </div>
        </div>
      </div>
      
      <button
        onClick={() => window.location.href = '/'}
        className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-700 text-white font-semibold rounded-lg shadow-md hover:from-green-600 hover:to-green-800 transition-all duration-300 btn-shine"
      >
        {t('backToHome')}
      </button>
    </div>
  );
};

export default PaymentSuccessPage;