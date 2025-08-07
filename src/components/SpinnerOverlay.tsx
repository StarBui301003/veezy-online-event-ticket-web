import React from 'react';

// Custom Spinner with gradient and blur effect
const Spinner = () => (
  <div
    style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      borderRadius: '50%',
      height: 96,
      width: 96,
      animation: 'rotate_3922 1.5s linear infinite',
      backgroundColor: '#9b59b6',
      backgroundImage: 'linear-gradient(#9b59b6, #84cdfa, #5ad1cd)',
      transform: 'translate(-50%, -50%)',
      zIndex: 1001,
    }}
    className="spinner-gradient"
  >
    <span
      style={{
        position: 'absolute',
        borderRadius: '50%',
        height: '100%',
        width: '100%',
        backgroundColor: '#9b59b6',
        backgroundImage: 'linear-gradient(#9b59b6, #84cdfa, #5ad1cd)',
        filter: 'blur(5px)',
      }}
    />
    <span
      style={{
        position: 'absolute',
        borderRadius: '50%',
        height: '100%',
        width: '100%',
        backgroundColor: '#9b59b6',
        backgroundImage: 'linear-gradient(#9b59b6, #84cdfa, #5ad1cd)',
        filter: 'blur(10px)',
      }}
    />
    <span
      style={{
        position: 'absolute',
        borderRadius: '50%',
        height: '100%',
        width: '100%',
        backgroundColor: '#9b59b6',
        backgroundImage: 'linear-gradient(#9b59b6, #84cdfa, #5ad1cd)',
        filter: 'blur(25px)',
      }}
    />
    <span
      style={{
        position: 'absolute',
        borderRadius: '50%',
        height: '100%',
        width: '100%',
        backgroundColor: '#9b59b6',
        backgroundImage: 'linear-gradient(#9b59b6, #84cdfa, #5ad1cd)',
        filter: 'blur(50px)',
      }}
    />
    <span
      style={{
        content: '""',
        position: 'absolute',
        top: 10,
        left: 10,
        right: 10,
        bottom: 10,
        backgroundColor: '#fff',
        border: 'solid 5px #ffffff',
        borderRadius: '50%',
        zIndex: 2,
        display: 'block',
      }}
    />
    <style>
      {`
        @keyframes rotate_3922 {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }
      `}
    </style>
  </div>
);

interface SpinnerOverlayProps {
  show: boolean;
  children?: React.ReactNode;
  fullScreen?: boolean;
}

const SpinnerOverlay: React.FC<SpinnerOverlayProps> = ({ show, children, fullScreen = false }) => {
  if (!show) return null;

  // Nếu fullScreen = true thì che toàn bộ màn hình, ngược lại chỉ che phần content
  const containerClass = fullScreen
    ? 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-hidden'
    : 'absolute inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-hidden';

  return (
    <div className={containerClass}>
      <Spinner />
      {children}
    </div>
  );
};

export default SpinnerOverlay;
