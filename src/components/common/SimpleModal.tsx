import React from 'react';

export default function SimpleModal({ open, onClose, children }: { open: boolean, onClose: () => void, children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(20,16,40,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #3b0764 0%, #6366f1 60%, #06b6d4 100%)',
        color: 'white', borderRadius: 28, boxShadow: '0 12px 48px #000b', padding: 40, minWidth: 370, maxWidth: 440, position: 'relative', border: '2px solid #a5b4fc',
        fontFamily: 'inherit',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', right: 20, top: 20, background: 'none', border: 'none', color: 'white', fontSize: 28, cursor: 'pointer', borderRadius: 8, transition: 'background 0.2s, color 0.2s',
          }}
          onMouseOver={e => (e.currentTarget.style.color = '#67e8f9')}
          onMouseOut={e => (e.currentTarget.style.color = 'white')}
          aria-label="Đóng"
        >×</button>
        {children}
      </div>
    </div>
  );
} 