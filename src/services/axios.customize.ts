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

export function registerGlobalSpinner(fn: (show: boolean) => void) {
  setSpinner = fn;
}

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (setSpinner) setSpinner(true);
    const token = window.localStorage.getItem('access_token');
    if (token && config.headers) {
      if (typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        config.headers['Authorization'] = `Bearer ${token}`;
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
    const ERROR_TOAST_ID = 'global-error-toast';

    // Xử lý lỗi 401 (Unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('[Auth] 401 Unauthorized detected, attempting token refresh...', {
        url: originalRequest.url,
        method: originalRequest.method,
        hasRetry: originalRequest._retry
      });
      
      originalRequest._retry = true;

      // Lấy refresh token từ cookie
      const refreshToken = document.cookie
        .split('; ')
        .find((row) => row.startsWith('refresh_token='))
        ?.split('=')[1];

      console.log('[Auth] Refresh token check:', {
        hasRefreshToken: !!refreshToken,
        refreshTokenLength: refreshToken?.length || 0
      });

      // Nếu không có refresh token thì reject luôn, không refresh nữa
      if (!refreshToken) {
        console.warn('[Auth] No refresh token found, redirecting to login');
        return Promise.reject(error);
      }

      if (!isRefreshing) {
        console.log('[Auth] Starting token refresh process...');
        isRefreshing = true;
        try {
          const response = await axios.post(
            `${config.gatewayUrl}/api/Account/refresh-token`,
            { refreshToken },
            { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
          );

          console.log('[Auth] Refresh token response:', {
            status: response.status,
            hasData: !!response.data,
            hasAccessToken: !!response.data?.data?.accessToken,
            hasRefreshToken: !!response.data?.data?.refreshToken
          });

          // Lấy accessToken từ response.data.data.accessToken
          const tokenData = response.data?.data;
          if (!tokenData || !tokenData.accessToken) {
            throw new Error('No access token in refresh response');
          }

          const newAccessToken = tokenData.accessToken;
          window.localStorage.setItem('access_token', newAccessToken);
          console.log('[Auth] New access token stored successfully');
          
          onRefreshed(newAccessToken);

          // Cập nhật refresh token mới vào cookie nếu có
          if (tokenData.refreshToken) {
            document.cookie = `refresh_token=${tokenData.refreshToken}; path=/;`;
            console.log('[Auth] New refresh token stored in cookie');
          }

          // Cập nhật header của request với token mới
          if (originalRequest.headers) {
            if (typeof originalRequest.headers.set === 'function') {
              originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);
            } else {
              originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
            }
          }
          
          console.log('[Auth] Retrying original request with new token');
          return instance(originalRequest);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
          console.error('[Auth] Token refresh failed:', {
            error: err,
            message: err?.message,
            status: err?.response?.status,
            data: err?.response?.data
          });
          
          // Xóa sạch token và refresh token nếu lỗi refresh
          window.localStorage.clear();
          document.cookie = 'refresh_token=; Max-Age=0; path=/;';

          refreshSubscribers = [];
          onRefreshed('');

          if (!toast.isActive(ERROR_TOAST_ID)) {
            toast.error('Your session has expired. Please log in again.', {
              toastId: ERROR_TOAST_ID,
            });
          }

          // Để cho toast hiển thị trước khi redirect
          setTimeout(() => {
            window.location.href = '/login';
          }, 200);

          return Promise.reject(err);
        } finally {
          isRefreshing = false;
          console.log('[Auth] Token refresh process completed');
        }
      }

      // Nếu token đang được refresh, chờ các request treo hoàn thành
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

    return Promise.reject(error);
  }
);

export default instance;
