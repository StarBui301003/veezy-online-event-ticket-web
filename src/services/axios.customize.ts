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
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

// Hàm helper để clear auth data và redirect
const clearAuthDataAndRedirect = () => {
  window.localStorage.clear();
  document.cookie = 'refresh_token=; Max-Age=0; path=/;';
  document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
  refreshSubscribers = [];
  onRefreshed('');

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

    // Xử lý lỗi 401 (Unauthorized)
    if (error.response?.status === 401) {
      // Danh sách endpoint không cần refresh token
      const skipRefreshEndpoints = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];

      const shouldSkipRefresh = skipRefreshEndpoints.some(endpoint =>
        originalRequest.url?.includes(endpoint)
      );

      if (shouldSkipRefresh) {
        return Promise.reject(error);
      }

      // Kiểm tra nếu user chưa đăng nhập (không có access token)
      const accessToken = window.localStorage.getItem('access_token');
      if (!accessToken) {
        return Promise.reject(error);
      }

      // Lấy refresh token từ cookie
      const refreshToken = getRefreshToken();

      // Nếu không có refresh token thì reject luôn
      if (!refreshToken) {
        clearAuthDataAndRedirect();
        return Promise.reject(error);
      }

      // Kiểm tra nếu request đã được retry để tránh infinite loop
      if (originalRequest._retry) {
        console.warn('Request already retried, clearing auth data to prevent infinite loop');
        clearAuthDataAndRedirect();
        return Promise.reject(error);
      }

      // Nếu đang refresh token, thêm request vào queue
      if (isRefreshing) {
        return new Promise((resolve) => {
          addRefreshSubscriber((token: string) => {
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

      // Bắt đầu refresh token
      isRefreshing = true;

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
          const errorText = await response.text();

          // Parse error response để lấy thông tin chi tiết
          let errorMessage = `Refresh token failed: ${response.status}`;
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.message) {
              errorMessage += ` - ${errorData.message}`;
            }
            if (errorData.code) {
              errorMessage += ` (Code: ${errorData.code})`;
            }
          } catch {
            errorMessage += ` - ${errorText}`;
          }

          throw new Error(errorMessage);
        }

        const data = await response.json();

        // Kiểm tra cấu trúc response
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid response format from refresh token endpoint');
        }

        if (!data.flag) {
          throw new Error(`Refresh token failed: ${data.message || 'Unknown error'} (Code: ${data.code || 'N/A'})`);
        }

        const tokenData = data?.data;

        if (!tokenData || !tokenData.accessToken) {
          throw new Error('No access token in refresh response');
        }

        const newAccessToken = tokenData.accessToken;
        const newRefreshToken = tokenData.refreshToken;

        // Validate token mới
        if (!newAccessToken || newAccessToken.length < 10) {
          throw new Error('Invalid access token received from refresh endpoint');
        }

        // Lưu token mới
        window.localStorage.setItem('access_token', newAccessToken);
        if (newRefreshToken) {
          document.cookie = `refresh_token=${newRefreshToken}; path=/; samesite=lax; max-age=${7 * 24 * 60 * 60}`;
        }

        // Thông báo cho tất cả request đang chờ
        onRefreshed(newAccessToken);

        // Đánh dấu request đã retry để tránh infinite loop
        originalRequest._retry = true;

        // Retry request gốc với token mới
        if (originalRequest.headers) {
          if (typeof originalRequest.headers.set === 'function') {
            originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);
          } else {
            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          }
        }

        return instance(originalRequest);

      } catch (error) {

        // Nếu refresh token thất bại, clear data và redirect
        clearAuthDataAndRedirect();
        return Promise.reject(error);

      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default instance;
