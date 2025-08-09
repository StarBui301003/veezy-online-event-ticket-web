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

    // Xử lý lỗi ERR_BLOCKED_BY_CLIENT (thường do Ad Blocker)
    if (error.code === 'ERR_BLOCKED_BY_CLIENT' || error.message === 'Network Error') {
      if (!toast.isActive('blocked-by-client-toast')) {
        toast.warning('Some content may be blocked by your browser extensions. Please disable Ad Blocker or whitelist this site for full functionality.', {
          toastId: 'blocked-by-client-toast',
          autoClose: 8000
        });
      }

      return Promise.reject(error);
    }

    // Xử lý lỗi 401 (Unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
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

      originalRequest._retry = true;

      // Lấy refresh token từ cookie
      const refreshToken = document.cookie
        .split('; ')
        .find((row) => row.startsWith('refresh_token='))
        ?.split('=')[1];



      // Nếu không có refresh token thì reject luôn, không refresh nữa
      if (!refreshToken) {
        return Promise.reject(error);
      }

      if (!isRefreshing) {
        isRefreshing = true;
        try {

          const response = await axios.post(
            `${config.gatewayUrl}/api/Account/refresh-token`,
            { refreshToken },
            {
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              withCredentials: true,
              timeout: 10000 // 10 second timeout
            }
          );



          // Lấy accessToken từ response.data.data.accessToken (ApiResponse wrapper)
          if (!response.data || typeof response.data !== 'object') {
            throw new Error('Invalid response format from refresh token API');
          }

          const tokenData = response.data?.data;
          if (!tokenData || !tokenData.accessToken) {
            throw new Error('No access token in refresh response');
          }

          const newAccessToken = tokenData.accessToken;
          window.localStorage.setItem('access_token', newAccessToken);

          onRefreshed(newAccessToken);

          // Cập nhật refresh token mới vào cookie nếu có
          if (tokenData.refreshToken) {
            document.cookie = `refresh_token=${tokenData.refreshToken}; path=/; samesite=lax; max-age=${7 * 24 * 60 * 60}`;
          }

          // Cập nhật header của request với token mới
          if (originalRequest.headers) {
            if (typeof originalRequest.headers.set === 'function') {
              originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);
            } else {
              originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
            }
          }

          return instance(originalRequest);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
          // Fallback to fetch if axios fails
          try {
            const fetchResponse = await fetch(`${config.gatewayUrl}/api/Account/refresh-token`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              credentials: 'include',
              body: JSON.stringify({ refreshToken })
            });

            if (!fetchResponse.ok) {
              // Xử lý các status code cụ thể
              if (fetchResponse.status === 401 || fetchResponse.status === 403) {
                // Refresh token bị từ chối hoặc hết hạn
                throw new Error('REFRESH_TOKEN_EXPIRED');
              } else if (fetchResponse.status >= 500) {
                // Server error, có thể thử lại
                throw new Error(`Server error: ${fetchResponse.status}`);
              } else {
                throw new Error(`Fetch failed with status: ${fetchResponse.status}`);
              }
            }

            const fetchData = await fetchResponse.json();

            // Kiểm tra cấu trúc response
            if (!fetchData || typeof fetchData !== 'object') {
              throw new Error('Invalid fetch response format from refresh token API');
            }

            // Lấy accessToken từ fetchData.data (ApiResponse wrapper)
            const tokenData = fetchData?.data;
            if (!tokenData || !tokenData.accessToken) {
              throw new Error('No access token in fetch refresh response');
            }

            const newAccessToken = tokenData.accessToken;
            window.localStorage.setItem('access_token', newAccessToken);

            onRefreshed(newAccessToken);

            if (tokenData.refreshToken) {
              document.cookie = `refresh_token=${tokenData.refreshToken}; path=/; samesite=lax; max-age=${7 * 24 * 60 * 60}`;
            }

            if (originalRequest.headers) {
              if (typeof originalRequest.headers.set === 'function') {
                originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);
              } else {
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
              }
            }

            return instance(originalRequest);
          } catch (fetchErr) {
            // Nếu cả axios và fetch đều thất bại, xử lý lỗi
            console.error('Both axios and fetch refresh token failed:', { axiosErr: err, fetchErr });

            // Kiểm tra nếu là network error, không xóa token ngay
            if (err.code === 'ERR_NETWORK' || err.message === 'Network Error' ||
              fetchErr.message?.includes('Network Error')) {
              return Promise.reject(error);
            }

            // Kiểm tra nếu refresh token hết hạn
            if (fetchErr.message === 'REFRESH_TOKEN_EXPIRED' ||
              err.response?.status === 401 || err.response?.status === 403) {
              // Refresh token hết hạn, xóa sạch dữ liệu và redirect
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
            }

            // Xóa sạch token và refresh token nếu lỗi refresh khác
            window.localStorage.clear();
            document.cookie = 'refresh_token=; Max-Age=0; path=/;';

            refreshSubscribers = [];
            onRefreshed('');

            if (!toast.isActive(ERROR_TOAST_ID)) {
              toast.error('Authentication failed. Please log in again.', {
                toastId: ERROR_TOAST_ID,
              });
            }

            // Để cho toast hiển thị trước khi redirect
            setTimeout(() => {
              window.location.href = '/login';
            }, 200);

            return Promise.reject(err);
          }
        } finally {
          isRefreshing = false;
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
