import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'react-toastify';
import { config } from '@/utils/config';

// Mở rộng InternalAxiosRequestConfig cho phép thêm trường _retry
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const instance: AxiosInstance = axios.create({
  baseURL: config.gatewayUrl,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Biến toàn cục để xử lý refresh token
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

// Biến spinner để điều khiển hiển thị loading toàn cục
let setSpinner: ((show: boolean) => void) | null = null;

// Hàm helper để parse cookie một cách robust
const getRefreshToken = (): string | null => {
  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'refresh_token') {
        return value;
      }
    }
    return null;
  } catch (error) {
    console.warn('Failed to parse cookies:', error);
    return null;
  }
};

export function registerGlobalSpinner(fn: (show: boolean) => void) {
  setSpinner = fn;
}

const onRefreshed = (token: string) => {
  // ✅ Chỉ xử lý khi có token hợp lệ
  if (token && token.length > 10) {
    console.log('🔄 Processing', refreshSubscribers.length, 'queued requests with new token');
    refreshSubscribers.forEach((callback) => callback(token));
  } else {
    console.warn('⚠️ onRefreshed called with invalid token, clearing queue without processing');
  }
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
  console.log('📥 Added request to refresh queue, current size:', refreshSubscribers.length);
};

// Hàm helper để clear auth data và redirect
const clearAuthDataAndRedirect = () => {
  console.log('🚨 Clearing auth data and redirecting to login');

  // ❌ Không dùng localStorage.clear() nữa vì sẽ xóa luôn account
  localStorage.removeItem('access_token');
  document.cookie = 'refresh_token=; Max-Age=0; path=/;';
  document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';

  // ✅ Clear subscriber queue mà không gọi onRefreshed với token rỗng
  refreshSubscribers = [];

  // ❌ KHÔNG gọi onRefreshed('') nữa vì sẽ gây lỗi
  // onRefreshed(''); // Đã comment out

  if (!toast.isActive('global-error-toast')) {
    toast.error('Your session has expired. Please log in again.', {
      toastId: 'global-error-toast',
    });
  }

  setTimeout(() => {
    window.location.href = '/login';
  }, 200);
};

instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (setSpinner) setSpinner(true);

    // Không thêm Authorization header cho refresh token endpoint
    const isRefreshTokenRequest = config.url?.includes('/api/Account/refresh-token');

    if (!isRefreshTokenRequest) {
      const token = window.localStorage.getItem('access_token');
      if (token && config.headers) {
        if (typeof config.headers.set === 'function') {
          config.headers.set('Authorization', `Bearer ${token}`);
        } else {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
      }
    }

    return config;
  },
  (error) => {
    if (setSpinner) setSpinner(false);
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => {
    if (setSpinner) setSpinner(false);
    return response;
  },
  async (error: AxiosError) => {
    if (setSpinner) setSpinner(false);
    const originalRequest = error.config as CustomAxiosRequestConfig;

    if (error.response?.status === 401) {
      const skipRefreshEndpoints = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];

      const shouldSkipRefresh = skipRefreshEndpoints.some(endpoint =>
        originalRequest.url?.includes(endpoint)
      );

      if (shouldSkipRefresh) {
        return Promise.reject(error);
      }

      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        return Promise.reject(error);
      }

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearAuthDataAndRedirect();
        return Promise.reject(error);
      }

      if (originalRequest._retry) {
        // ❌ KHÔNG clear ngay, chỉ reject để tránh infinite loop
        console.log('⚠️ Request already retried, rejecting to prevent infinite loop');
        return Promise.reject(error);
      }

      if (isRefreshing) {
        console.log('📋 Token refresh in progress, adding request to queue for:', originalRequest.url);
        return new Promise((resolve) => {
          addRefreshSubscriber((token: string) => {
            console.log('📤 Processing queued request with new token for:', originalRequest.url);
            if (originalRequest.headers) {
              if (typeof originalRequest.headers.set === 'function') {
                originalRequest.headers.set('Authorization', `Bearer ${token}`);
              } else {
                originalRequest.headers['Authorization'] = `Bearer ${token}`;
              }
            }
            resolve(instance(originalRequest));
          });
        });
      }

      isRefreshing = true;
      console.log('🔄 Starting token refresh process for:', originalRequest.url);

      try {
        const response = await fetch(`${config.gatewayUrl}/api/Account/refresh-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ refreshToken })
        });

        if (!response.ok) {
          throw new Error(`Refresh token failed: ${response.status}`);
        }

        const data = await response.json();
        if (!data?.flag || !data.data?.accessToken) {
          throw new Error(`Refresh token failed: ${data.message || 'Unknown error'}`);
        }

        const newAccessToken = data.data.accessToken;
        const newRefreshToken = data.data.refreshToken;
        const newAccount = data.data.account; // ✅ Lấy account từ response

        // ✅ Validate token mới trước khi xử lý
        if (!newAccessToken || newAccessToken.length < 10) {
          throw new Error('Invalid access token received from refresh endpoint');
        }

        console.log('🔑 New access token received, length:', newAccessToken.length);
        console.log('👤 New account data received:', newAccount ? 'Yes' : 'No');

        // ✅ Lưu lại CẢ token VÀ account
        localStorage.setItem('access_token', newAccessToken);
        if (newRefreshToken) {
          document.cookie = `refresh_token=${newRefreshToken}; path=/; samesite=lax; max-age=${7 * 24 * 60 * 60}`;
        }

        // ✅ Lưu lại account để ProtectedRoute không bị redirect
        if (newAccount) {
          localStorage.setItem('account', JSON.stringify(newAccount));
          console.log('💾 Account data saved back to localStorage');
        } else {
          console.warn('⚠️ No account data in refresh response, account may be missing');
        }

        // ✅ Reset refreshing flag TRƯỚC KHI xử lý requests
        isRefreshing = false;

        console.log('📢 Notifying', refreshSubscribers.length, 'queued requests with new token');
        onRefreshed(newAccessToken);

        // ✅ Log sau khi xử lý subscriber queue
        console.log('✅ Subscriber queue processed, retrying original request');

        // ✅ Đánh dấu request này đã retry để tránh infinite loop
        originalRequest._retry = true;

        if (originalRequest.headers) {
          if (typeof originalRequest.headers.set === 'function') {
            originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);
          } else {
            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          }
        }

        console.log('✅ Token refresh successful, retrying original request');
        return instance(originalRequest);

      } catch (err) {
        // ❌ Chỉ clear data khi refresh thất bại
        console.error('❌ Refresh token failed:', err);
        isRefreshing = false;

        // ✅ Chỉ clear khi thực sự cần thiết
        if (err instanceof Error && err.message.includes('Invalid refresh token')) {
          clearAuthDataAndRedirect();
        } else {
          // ✅ Nếu lỗi network hoặc server, chỉ reject để retry sau
          console.warn('⚠️ Refresh failed due to network/server error, not clearing auth data');
        }

        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default instance;
