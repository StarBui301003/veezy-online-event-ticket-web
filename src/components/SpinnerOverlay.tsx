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
      animation: 'rotate_3922 1.2s linear infinite',
      backgroundColor: '#9b59b6',
      backgroundImage: 'linear-gradient(#9b59b6, #84cdfa, #5ad1cd)',
      transform: 'translate(-50%, -50%)',
      zIndex: 10001,
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
}

const SpinnerOverlay: React.FC<SpinnerOverlayProps> = ({ show, children }) => {
  if (!show) return null;
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: '#e3edf3', opacity: 0.8, backdropFilter: 'blur(1px)' }}
    >
      <Spinner />
      {children}
    </div>
  );
};

export default SpinnerOverlay;
