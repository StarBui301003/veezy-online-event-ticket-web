import React from 'react';
export function RingLoader({ size = 80, color = '#60a5fa' }: { size?: number; color?: string }) {
  return (
    <div
      className="lds-ring flex items-center justify-center"
      style={{ width: size, height: size, color }}
      aria-label="Loading"
    >
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  );
}
