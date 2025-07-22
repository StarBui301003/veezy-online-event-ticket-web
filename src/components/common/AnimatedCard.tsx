import React from 'react';
import SpinnerOverlay from '@/components/SpinnerOverlay';
import { useTranslation } from 'react-i18next';

interface AnimatedCardProps {
  title?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  error?: string;
  empty?: boolean;
  onRetry?: () => void;
  children: React.ReactNode;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({
  title,
  icon,
  loading,
  error,
  empty,
  onRetry,
  children,
}) => {
  const { t } = useTranslation();
  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 p-6 mb-8 animate-fade-in">
      {(title || icon) && (
        <div className="flex items-center gap-3 mb-6">
          {icon && <span className="text-purple-400">{icon}</span>}
          {title && <h2 className="text-xl font-bold text-white">{title}</h2>}
        </div>
      )}
      {loading ? (
        <div className="flex justify-center py-12">
          <SpinnerOverlay show={true} />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-12">
          <div className="text-red-400 mb-2 font-semibold">{error}</div>
          {onRetry && (
            <button
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold mt-2 hover:from-purple-600 hover:to-pink-600 transition"
              onClick={onRetry}
            >
              {t('retry')}
            </button>
          )}
        </div>
      ) : empty ? (
        <div className="flex flex-col items-center py-12">
          <div className="text-gray-400">{t('noData')}</div>
        </div>
      ) : (
        <div className="animate-slide-in">{children}</div>
      )}
    </div>
  );
};

export { AnimatedCard }; 