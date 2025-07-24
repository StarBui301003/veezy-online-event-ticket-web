import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const PaymentFailedPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  useEffect(() => {
    // Gửi message về opener (tab gốc)
    if (window.opener) {
      window.opener.postMessage({ type: 'PAYMENT_FAILED' }, '*');
    }
    const handleUnload = () => {
      if (window.opener) {
        window.opener.postMessage({ type: 'PAYMENT_FAILED' }, '*');
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-red-50 p-8 text-center">
      <AlertCircle className="w-20 h-20 text-red-500 mb-6" />
      <h2 className="text-3xl font-bold text-red-700 mb-4">{t('paymentFailedTitle')}</h2>
      <p className="text-red-600 text-lg mb-6">{t('paymentFailedMessage')}</p>
      <button
        onClick={() => navigate("/")}
        className="px-8 py-3 bg-red-600 text-white font-semibold rounded-lg shadow hover:bg-red-700 transition-all text-lg"
      >
        {t('backToHomepage')}
      </button>
    </div>
  );
};

export default PaymentFailedPage; 