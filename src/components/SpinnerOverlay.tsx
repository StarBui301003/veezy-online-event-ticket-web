import React from 'react';

// Nếu chưa có Spinner component, bạn có thể tạo tạm Spinner đơn giản như sau:
const Spinner = ({ size = 'large' }: { size?: 'small' | 'medium' | 'large' }) => (
  <svg
    className={`animate-spin text-primary ${
      size === 'small' ? 'w-6 h-6' : size === 'medium' ? 'w-8 h-8' : 'w-12 h-12'
    }`}
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
);

interface SpinnerOverlayProps {
  show: boolean;
  children?: React.ReactNode;
}

const SpinnerOverlay: React.FC<SpinnerOverlayProps> = ({ show, children }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/70">
      <Spinner size="large" />
      {children}
    </div>
  );
};

export default SpinnerOverlay;
