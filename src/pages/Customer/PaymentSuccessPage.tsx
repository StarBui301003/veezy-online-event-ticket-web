import { useEffect } from 'react';

const PaymentSuccessPage = () => {
  useEffect(() => {
    // Gửi message về opener (tab gốc)
    if (window.opener) {
      window.opener.postMessage({ type: 'PAYMENT_SUCCESS' }, '*');
    }
  }, []);
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-green-50 p-8 text-center">
      <h2 className="text-3xl font-bold text-green-700 mb-4">Thanh toán thành công!</h2>
      <p className="text-green-600 text-lg mb-6">Bạn có thể đóng tab này và quay lại trang trước.</p>
      <button
        onClick={() => window.close()}
        className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-all duration-300"
      >
        Đóng tab này
      </button>
    </div>
  );
};

export default PaymentSuccessPage; 