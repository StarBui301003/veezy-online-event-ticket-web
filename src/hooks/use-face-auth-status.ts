import { useState, useEffect } from 'react';
import { checkFaceAuthStatusAPI } from '@/services/Admin/user.service';

interface FaceAuthStatusResponse {
  flag: boolean;
  code: number;
  message: string;
  data: boolean;
}

export const useFaceAuthStatus = () => {
  const [hasFaceAuth, setHasFaceAuth] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkFaceAuthStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response: FaceAuthStatusResponse = await checkFaceAuthStatusAPI();
      
      if (response.flag) {
        setHasFaceAuth(response.data);
      } else {
        console.warn('[FaceAuth] API returned error:', response.message);
        setError(response.message || 'Failed to check face authentication status');
        setHasFaceAuth(false);
      }
    } catch (err: any) {
      console.error('[FaceAuth] Error checking face auth status:', {
        error: err,
        message: err?.message,
        status: err?.response?.status,
        data: err?.response?.data
      });
      setError(err?.response?.data?.message || 'Failed to check face authentication status');
      setHasFaceAuth(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check face auth status on mount if user is authenticated
    const token = localStorage.getItem('access_token');
    
    if (token) {
      checkFaceAuthStatus();
    } else {
      setIsLoading(false);
    }
  }, []);

  return {
    hasFaceAuth,
    isLoading,
    error,
    refetch: checkFaceAuthStatus
  };
};
