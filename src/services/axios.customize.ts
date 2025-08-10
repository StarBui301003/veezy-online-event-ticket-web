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

      // ✅ Kiểm tra access token có hết hạn không
      if (isAccessTokenExpired(accessToken)) {
        // Access token expired, proceeding with refresh
      } else {
        // Access token not expired but got 401, may be invalid
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
        // ✅ Thêm timeout cho refresh token request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout

        const response = await fetch(`${config.gatewayUrl}/api/Account/refresh-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ refreshToken }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

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

        // ✅ Kiểm tra token mới có hết hạn không
        if (isAccessTokenExpired(newAccessToken)) {
          throw new Error('New access token is already expired');
        }

        // ✅ Lưu lại CẢ token VÀ account
        localStorage.setItem('access_token', newAccessToken);
        if (newRefreshToken) {
          document.cookie = `refresh_token=${newRefreshToken}; path=/; samesite=lax; max-age=${7 * 24 * 60 * 60}`;
        }

        // ✅ Lưu lại account với chỉ các field cần thiết cho ProtectedRoute
        if (newAccount) {
          // Chỉ lưu các field cần thiết cho authentication và routing
          const essentialAccountData = {
            accountId: newAccount.accountId,
            userId: newAccount.userId,
            username: newAccount.username,
            email: newAccount.email,
            role: newAccount.role,
            avatar: newAccount.avatar
          };
          localStorage.setItem('account', JSON.stringify(essentialAccountData));
        } else {
          // No account data in response
        }

        // ✅ Lưu lại user-config với chỉ các field cần thiết
        if (data.data.userConfig) {
          const userConfig = data.data.userConfig;
          // Chỉ lưu các field cần thiết cho user preferences
          const essentialUserConfig = {
            language: userConfig.language,
            theme: userConfig.theme,
            receiveEmail: userConfig.receiveEmail,
            receiveNotify: userConfig.receiveNotify,
            userId: userConfig.userId
          };
          localStorage.setItem('user_config', JSON.stringify(essentialUserConfig));
        } else {
          // No user config in response
        }

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

        // ✅ Chỉ clear khi thực sự cần thiết
        if (err instanceof Error && (
          err.message.includes('Invalid refresh token') ||
          err.message.includes('Refresh token failed') ||
          err.message.includes('New access token is already expired') ||
          err.message.includes('AbortError') // Timeout
        )) {
          clearAuthDataAndRedirect();
        } else {
          // ✅ Nếu lỗi network hoặc server, chỉ reject để retry sau
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
