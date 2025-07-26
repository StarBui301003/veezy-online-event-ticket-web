import React, { useState, useEffect } from 'react';

export const TokenDebugger: React.FC = () => {
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  const refreshTokenInfo = () => {
    const token = localStorage.getItem('access_token');
    const refreshToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('refresh_token='))
      ?.split('=')[1];

    if (!token) {
      setTokenInfo({ error: 'No access token found' });
      return;
    }

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        setTokenInfo({ error: 'Invalid token format', tokenLength: token.length });
        return;
      }

      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);
      
      setTokenInfo({
        valid: true,
        tokenLength: token.length,
        refreshTokenExists: !!refreshToken,
        payload: {
          sub: payload.sub,
          email: payload.email,
          role: payload.role,
          iat: payload.iat ? new Date(payload.iat * 1000).toLocaleString() : 'N/A',
          exp: payload.exp ? new Date(payload.exp * 1000).toLocaleString() : 'N/A',
          isExpired: payload.exp ? payload.exp < now : false,
          timeUntilExpiry: payload.exp ? Math.max(0, payload.exp - now) : 0
        },
        rawPayload: payload
      });
    } catch (error) {
      setTokenInfo({ error: 'Failed to parse token', tokenLength: token.length });
    }
  };

  useEffect(() => {
    refreshTokenInfo();
    const interval = setInterval(() => {
      refreshTokenInfo();
      setRefreshCount(c => c + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!tokenInfo) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] w-80 bg-white/95 backdrop-blur border border-gray-300 shadow-lg rounded-lg p-4 text-xs font-mono">
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold text-blue-600">🔑 Token Debug</span>
        <span className="text-gray-500">#{refreshCount}</span>
      </div>
      
      {tokenInfo.error ? (
        <div className="text-red-600 bg-red-50 p-2 rounded">
          Error: {tokenInfo.error}
          {tokenInfo.tokenLength && <div>Length: {tokenInfo.tokenLength}</div>}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-1">
            <span>Length:</span>
            <span>{tokenInfo.tokenLength}</span>
            
            <span>Has Refresh:</span>
            <span className={tokenInfo.refreshTokenExists ? 'text-green-600' : 'text-red-600'}>
              {tokenInfo.refreshTokenExists ? 'Yes' : 'No'}
            </span>
            
            <span>User ID:</span>
            <span className="truncate">{tokenInfo.payload.sub || 'N/A'}</span>
            
            <span>Email:</span>
            <span className="truncate">{tokenInfo.payload.email || 'N/A'}</span>
            
            <span>Role:</span>
            <span>{tokenInfo.payload.role || 'N/A'}</span>
            
            <span>Issued:</span>
            <span className="truncate">{tokenInfo.payload.iat}</span>
            
            <span>Expires:</span>
            <span className="truncate">{tokenInfo.payload.exp}</span>
            
            <span>Is Expired:</span>
            <span className={tokenInfo.payload.isExpired ? 'text-red-600' : 'text-green-600'}>
              {tokenInfo.payload.isExpired ? 'YES' : 'NO'}
            </span>
            
            <span>Time Left:</span>
            <span className={tokenInfo.payload.timeUntilExpiry < 300 ? 'text-orange-600' : 'text-green-600'}>
              {Math.floor(tokenInfo.payload.timeUntilExpiry / 60)}m {tokenInfo.payload.timeUntilExpiry % 60}s
            </span>
          </div>
          
          <button 
            onClick={refreshTokenInfo}
            className="w-full bg-blue-500 text-white py-1 px-2 rounded text-xs hover:bg-blue-600"
          >
            Refresh Now
          </button>
          
          <button 
            onClick={() => {
              console.log('Full Token Info:', tokenInfo);
              console.log('Raw Token:', localStorage.getItem('access_token'));
            }}
            className="w-full bg-gray-500 text-white py-1 px-2 rounded text-xs hover:bg-gray-600"
          >
            Log to Console
          </button>
        </div>
      )}
    </div>
  );
};

export default TokenDebugger;
