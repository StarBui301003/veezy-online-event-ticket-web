import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { checkFaceAuthStatusAPI } from '@/services/Admin/user.service';
import { useFaceAuthStatus } from '@/hooks/use-face-auth-status';

interface TokenInfo {
  hasToken: boolean;
  tokenLength?: number;
  tokenPreview?: string;
  isExpired?: boolean;
  payload?: any;
}

interface ApiTestResult {
  success: boolean;
  error?: string;
  status?: number;
  data?: any;
  timestamp: string;
}

export const FaceAuthDebug: React.FC = () => {
  const [tokenInfo, setTokenInfo] = useState<TokenInfo>({ hasToken: false });
  const [apiResults, setApiResults] = useState<{
    hasFaceAuth?: ApiTestResult;
    updateFace?: ApiTestResult;
  }>({});
  
  // Use the face auth hook
  const { hasFaceAuth, isLoading, error, refetch } = useFaceAuthStatus();

  // Check token info
  const checkTokenInfo = () => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      setTokenInfo({ hasToken: false });
      return;
    }

    try {
      // Decode JWT payload (without verification, just for debugging)
      const parts = token.split('.');
      if (parts.length !== 3) {
        setTokenInfo({ 
          hasToken: true, 
          tokenLength: token.length,
          tokenPreview: token.substring(0, 20) + '...',
          isExpired: true 
        });
        return;
      }

      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);
      const isExpired = payload.exp && payload.exp < now;

      setTokenInfo({
        hasToken: true,
        tokenLength: token.length,
        tokenPreview: token.substring(0, 20) + '...',
        isExpired,
        payload
      });
    } catch (error) {
      setTokenInfo({ 
        hasToken: true, 
        tokenLength: token.length,
        tokenPreview: token.substring(0, 20) + '...',
        isExpired: true 
      });
    }
  };

  // Test hasFaceAuth API directly
  const testHasFaceAuthAPI = async () => {
    try {
      console.log('[FaceAuthDebug] Testing hasFaceAuth API...');
      const response = await checkFaceAuthStatusAPI();
      
      setApiResults(prev => ({
        ...prev,
        hasFaceAuth: {
          success: true,
          data: response,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
    } catch (error: any) {
      console.error('[FaceAuthDebug] hasFaceAuth API error:', error);
      
      setApiResults(prev => ({
        ...prev,
        hasFaceAuth: {
          success: false,
          error: error.message || 'Unknown error',
          status: error.response?.status,
          data: error.response?.data,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
    }
  };

  // Test updateFace API with minimal data
  const testUpdateFaceAPI = async () => {
    try {
      console.log('[FaceAuthDebug] Testing updateFace API with OPTIONS request...');
      
      // First test with OPTIONS to see if endpoint is accessible
      const response = await fetch('http://localhost:5000/api/Account/updateFace', {
        method: 'OPTIONS',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      setApiResults(prev => ({
        ...prev,
        updateFace: {
          success: response.ok,
          status: response.status,
          data: { 
            message: 'OPTIONS request successful',
            headers: Object.fromEntries(response.headers.entries())
          },
          timestamp: new Date().toLocaleTimeString()
        }
      }));
    } catch (error: any) {
      console.error('[FaceAuthDebug] updateFace API error:', error);
      
      setApiResults(prev => ({
        ...prev,
        updateFace: {
          success: false,
          error: error.message || 'Unknown error',
          timestamp: new Date().toLocaleTimeString()
        }
      }));
    }
  };

  useEffect(() => {
    checkTokenInfo();
  }, []);

  return (
    <div className="fixed top-4 left-4 z-[9999] w-96 max-h-[80vh] overflow-y-auto">
      <Card className="bg-white/95 backdrop-blur border border-gray-300 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-gray-800">
            🔍 Face Auth Debug Panel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Token Information */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-gray-700">Token Status</h3>
            <div className="bg-gray-50 p-2 rounded text-xs space-y-1">
              <div className="flex justify-between">
                <span>Has Token:</span>
                <Badge variant={tokenInfo.hasToken ? "default" : "destructive"}>
                  {tokenInfo.hasToken ? "Yes" : "No"}
                </Badge>
              </div>
              {tokenInfo.hasToken && (
                <>
                  <div className="flex justify-between">
                    <span>Length:</span>
                    <span>{tokenInfo.tokenLength}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Preview:</span>
                    <span className="font-mono">{tokenInfo.tokenPreview}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Expired:</span>
                    <Badge variant={tokenInfo.isExpired ? "destructive" : "default"}>
                      {tokenInfo.isExpired ? "Yes" : "No"}
                    </Badge>
                  </div>
                  {tokenInfo.payload && (
                    <>
                      <div className="flex justify-between">
                        <span>User ID:</span>
                        <span className="font-mono text-xs">{tokenInfo.payload.sub}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Expires:</span>
                        <span className="text-xs">
                          {new Date(tokenInfo.payload.exp * 1000).toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Hook Status */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-gray-700">useFaceAuthStatus Hook</h3>
            <div className="bg-gray-50 p-2 rounded text-xs space-y-1">
              <div className="flex justify-between">
                <span>Loading:</span>
                <Badge variant={isLoading ? "secondary" : "outline"}>
                  {isLoading ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Has Face Auth:</span>
                <Badge variant={hasFaceAuth ? "default" : "secondary"}>
                  {hasFaceAuth ? "Yes" : "No"}
                </Badge>
              </div>
              {error && (
                <div className="text-red-600">
                  <span>Error: {error}</span>
                </div>
              )}
            </div>
          </div>

          {/* API Test Results */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-gray-700">API Test Results</h3>
            
            {/* hasFaceAuth API */}
            {apiResults.hasFaceAuth && (
              <div className="bg-gray-50 p-2 rounded text-xs">
                <div className="font-semibold mb-1">hasFaceAuth API:</div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <Badge variant={apiResults.hasFaceAuth.success ? "default" : "destructive"}>
                    {apiResults.hasFaceAuth.success ? "Success" : "Failed"}
                  </Badge>
                </div>
                <div className="text-xs text-gray-600">
                  Time: {apiResults.hasFaceAuth.timestamp}
                </div>
                {apiResults.hasFaceAuth.error && (
                  <div className="text-red-600 mt-1">
                    Error: {apiResults.hasFaceAuth.error}
                  </div>
                )}
                {apiResults.hasFaceAuth.status && (
                  <div className="text-gray-600">
                    HTTP Status: {apiResults.hasFaceAuth.status}
                  </div>
                )}
              </div>
            )}

            {/* updateFace API */}
            {apiResults.updateFace && (
              <div className="bg-gray-50 p-2 rounded text-xs">
                <div className="font-semibold mb-1">updateFace API:</div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <Badge variant={apiResults.updateFace.success ? "default" : "destructive"}>
                    {apiResults.updateFace.success ? "Success" : "Failed"}
                  </Badge>
                </div>
                <div className="text-xs text-gray-600">
                  Time: {apiResults.updateFace.timestamp}
                </div>
                {apiResults.updateFace.error && (
                  <div className="text-red-600 mt-1">
                    Error: {apiResults.updateFace.error}
                  </div>
                )}
                {apiResults.updateFace.status && (
                  <div className="text-gray-600">
                    HTTP Status: {apiResults.updateFace.status}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Control Buttons */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={checkTokenInfo}
                className="text-xs"
              >
                Refresh Token
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={refetch}
                className="text-xs"
              >
                Refetch Hook
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                size="sm" 
                variant="secondary" 
                onClick={testHasFaceAuthAPI}
                className="text-xs"
              >
                Test hasFaceAuth
              </Button>
              <Button 
                size="sm" 
                variant="secondary" 
                onClick={testUpdateFaceAPI}
                className="text-xs"
              >
                Test updateFace
              </Button>
            </div>
          </div>

          {/* Clear Results */}
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setApiResults({})}
            className="w-full text-xs"
          >
            Clear Results
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default FaceAuthDebug;
