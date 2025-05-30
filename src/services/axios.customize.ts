import axios from "axios";
import NProgress from "nprogress";
import { toast } from 'react-toastify';

NProgress.configure({
  showSpinner: false,
  trickleSpeed: 100,
});

const instance = axios.create({
  baseURL: import.meta.env.VITE_GATEWAY_URL || "http://localhost:5000",
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

// Interceptor request
instance.interceptors.request.use(
  function (config) {
    NProgress.start();
    const token = window.localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  function (error) {
    NProgress.done();
    return Promise.reject(error);
  }
);

// Interceptor response
instance.interceptors.response.use(
  function (response) {
    NProgress.done();
    return response;
  },
  async function (error) {
    NProgress.done();
    const originalRequest = error.config;

    // Nếu bị 401 (Unauthorized)
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshToken = document.cookie
            .split('; ')
            .find(row => row.startsWith('refresh_token='))
            ?.split('=')[1];

          if (!refreshToken) {
            toast.error('Your session has expired. Please log in again!');
            window.localStorage.removeItem('access_token');
            window.location.href = '/login';
            isRefreshing = false;
            return Promise.reject(error);
          }

          const res = await axios.post(
            `${import.meta.env.VITE_GATEWAY_URL || "http://localhost:5000"}/api/Account/refresh-token`,
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
          toast.error('Your session has expired. Please log in again!');
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

    const ERROR_TOAST_ID = "global-error-toast";

    // Nếu lỗi 400 (Bad Request)
    if (error.response && error.response.status === 400) {
  
      toast.error(error.response.data?.message || "Invalid data submitted!", {
        toastId: ERROR_TOAST_ID,

      });
      return Promise.reject(error.response.data);
    }

    // Nếu backend trả về message (bất kỳ code nào)
    if (error.response && error.response.data && error.response.data.message) {

      toast.error(error.response.data.message, {
        toastId: ERROR_TOAST_ID,

      });
      return Promise.reject(error.response.data);
    }

    if (error.message) {

      toast.error(error.message, {
        toastId: ERROR_TOAST_ID,

      });
    }
    return Promise.reject(error);
  }
);

export default instance;