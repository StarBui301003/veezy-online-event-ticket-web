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
let lastRefreshTime = 0;

// Biến spinner để điều khiển hiển thị loading toàn cục
let setSpinner: ((show: boolean) => void) | null = null;

// Hàm helper để parse cookie một cách robust
const getRefreshToken = (): string | null => {
  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'refresh_token') {
        // ✅ Validate GUID format (32-36 characters, alphanumeric + hyphens)
        if (value && /^[0-9a-fA-F-]{32,36}$/.test(value)) {
          return value;
        } else {
          // Clear invalid token
          document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
          return null;
        }
      }
    }
    return null;
  } catch {
    return null;
  }
};

// ✅ Hàm mới: Kiểm tra access token có hết hạn không
const isAccessTokenExpired = (token: string): boolean => {
  try {
    // Decode JWT token để check expiration
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime >= payload.exp;
  } catch {
    return true; // Nếu không decode được, coi như expired
  }
};

// ✅ Hàm kiểm tra xem có nên refresh token không
// Token sẽ được refresh tự động sau mỗi 170 phút (khi có request 401)
const shouldRefreshToken = (): boolean => {
  const currentTime = Date.now();
  const timeSinceLastRefresh = currentTime - lastRefreshTime;
  const REFRESH_INTERVAL = 170 * 60 * 1000; // 170 phút = 170 * 60 * 1000 ms

  // ✅ Chỉ refresh khi đã đủ thời gian từ lần refresh cuối
  if (timeSinceLastRefresh < REFRESH_INTERVAL) {


    return false;
  }


  return true;
};


export function registerGlobalSpinner(fn: (show: boolean) => void) {
  setSpinner = fn;
}

const onRefreshed = (token: string) => {
  // ✅ Chỉ xử lý khi có token hợp lệ và chưa hết hạn
  if (token && token.length > 10 && !isAccessTokenExpired(token)) {
    // ✅ Copy queue trước khi clear để tránh race condition
    const subscribers = [...refreshSubscribers];
    refreshSubscribers = [];
    subscribers.forEach((callback) => {
      try {
        callback(token);
      } catch {
        // Silent error handling
      }
    });
  } else {
    refreshSubscribers = [];
    // ✅ Nếu token mới cũng expired, clear auth data
    if (token && isAccessTokenExpired(token)) {
      clearAuthDataAndRedirect();
    }
  }
};

const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

// Hàm helper để clear auth data và redirect
const clearAuthDataAndRedirect = () => {
  // ❌ Không dùng localStorage.clear() nữa vì sẽ xóa luôn account
  localStorage.removeItem('access_token');
  document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';

  // ✅ Clear subscriber queue mà không gọi onRefreshed với token rỗng
  refreshSubscribers = [];

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
        // ✅ Kiểm tra token có hết hạn không trước khi sử dụng
        if (isAccessTokenExpired(token)) {
          // Không set header, để response interceptor xử lý
        } else {
          if (typeof config.headers.set === 'function') {
            config.headers.set('Authorization', `Bearer ${token}`);
          } else {
            config.headers['Authorization'] = `Bearer ${token}`;
          }
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
        return Promise.reject(error);
      }

      // ✅ KIỂM TRA xem có nên refresh token không
      if (!shouldRefreshToken()) {

        return Promise.reject(error);
      }

      if (isRefreshing) {
        // ✅ TẤT CẢ request đều được thêm vào hàng đợi
        // Tránh tình trạng nhiều request cùng gọi refresh token
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

      // ✅ Chỉ request đầu tiên mới set flag và thực hiện refresh
      // Các request khác sẽ được thêm vào hàng đợi ở trên
      isRefreshing = true;

      try {
        const response = await fetch(`${config.gatewayUrl}/api/Account/refresh-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ refreshToken }),
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
        const newAccount = data.data.account;

        // Lưu token mới
        localStorage.setItem('access_token', newAccessToken);
        if (newRefreshToken) {
          document.cookie = `refresh_token=${newRefreshToken}; path=/; samesite=lax; max-age=${7 * 24 * 60 * 60}`;
        }

        // Lưu account mới
        if (newAccount) {
          const essentialAccountData = {
            accountId: newAccount.accountId,
            userId: newAccount.userId,
            username: newAccount.username,
            email: newAccount.email,
            role: newAccount.role,
            avatar: newAccount.avatar
          };
          localStorage.setItem('account', JSON.stringify(essentialAccountData));
        }

        // Lưu user config mới
        if (data.data.userConfig) {
          const userConfig = data.data.userConfig;
          const essentialUserConfig = {
            language: userConfig.language,
            theme: userConfig.theme,
            receiveEmail: userConfig.receiveEmail,
            receiveNotify: userConfig.receiveNotify,
            userId: userConfig.userId
          };
          localStorage.setItem('user_config', JSON.stringify(essentialUserConfig));
        }

        // ✅ Cập nhật thời gian refresh cuối cùng ở MỘT NƠI DUY NHẤT
        lastRefreshTime = Date.now();

        // ✅ Xử lý subscriber queue TRƯỚC KHI reset flag
        onRefreshed(newAccessToken);

        // ✅ Đánh dấu request này đã retry để tránh infinite loop
        originalRequest._retry = true;

        if (originalRequest.headers) {
          if (typeof originalRequest.headers.set === 'function') {
            originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);
          } else {
            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          }
        }

        return instance(originalRequest);

      } catch (err) {
        // ❌ Chỉ clear data khi refresh thất bại
        if (err instanceof Error && (
          err.message.includes('Invalid refresh token') ||
          err.message.includes('Refresh token failed') ||
          err.message.includes('New access token is already expired')
        )) {
          clearAuthDataAndRedirect();
        }
        return Promise.reject(err);
      } finally {
        // ✅ Đảm bảo flag luôn được reset trong mọi trường hợp
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default instance;
