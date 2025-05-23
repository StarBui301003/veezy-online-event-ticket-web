import axios from "axios";
import NProgress from "nprogress";

NProgress.configure({
  showSpinner: false,
  trickleSpeed: 100,
});

// User instance
const instance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Admin instance
export const adminInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL_ADMIN,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

instance.interceptors.request.use(
  function (config) {
    NProgress.start();
    const token = window.localStorage.getItem("access_token");
    const isLoginRequest = config.url?.includes("/api/Account/login");
    if (token && !isLoginRequest) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  function (error) {
    NProgress.done();
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  function (response) {
    NProgress.done();
    return response;
  },
  async function (error) {
    NProgress.done();
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        try {
         
          const refreshToken = document.cookie
            .split('; ')
            .find(row => row.startsWith('refresh_token='))
            ?.split('=')[1];

          const res = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/api/Account/refresh-token`,
            { refreshToken }
          );
          const { accessToken } = res.data;
          window.localStorage.setItem('access_token', accessToken);
          onRefreshed(accessToken);
          isRefreshing = false;

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return instance(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          window.localStorage.removeItem('access_token');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // Nếu đang refresh, chờ token mới rồi retry
        return new Promise((resolve) => {
          refreshSubscribers.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(instance(originalRequest));
          });
        });
      }
    }

    // Nếu lỗi khác
    if (error.response && error.response.data) return Promise.reject(error.response.data);
    return Promise.reject(error);
  }
);

// Copy interceptors logic cho adminInstance nếu muốn dùng chung logic
adminInstance.interceptors.request.use(
  function (config) {
    NProgress.start();
    const token = window.localStorage.getItem("access_token");
    const isLoginRequest = config.url?.includes("/api/Account/login");
    if (token && !isLoginRequest) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  function (error) {
    NProgress.done();
    return Promise.reject(error);
  }
);

adminInstance.interceptors.response.use(
  function (response) {
    NProgress.done();
    return response;
  },
  async function (error) {
    NProgress.done();
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        try {
         
          const refreshToken = document.cookie
            .split('; ')
            .find(row => row.startsWith('refresh_token='))
            ?.split('=')[1];

          const res = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/api/Account/refresh-token`,
            { refreshToken }
          );
          const { accessToken } = res.data;
          window.localStorage.setItem('access_token', accessToken);
          onRefreshed(accessToken);
          isRefreshing = false;

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return adminInstance(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          window.localStorage.removeItem('access_token');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // Nếu đang refresh, chờ token mới rồi retry
        return new Promise((resolve) => {
          refreshSubscribers.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(adminInstance(originalRequest));
          });
        });
      }
    }

    // Nếu lỗi khác
    if (error.response && error.response.data) return Promise.reject(error.response.data);
    return Promise.reject(error);
  }
);

export default instance;
