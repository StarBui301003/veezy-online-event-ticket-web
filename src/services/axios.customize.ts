import axios from "axios";
import NProgress from "nprogress";
import { toast } from "react-toastify";

// Configure loading bar
NProgress.configure({
  showSpinner: false,
  trickleSpeed: 100,
});

// Create Axios instance
const instance = axios.create({
  baseURL: import.meta.env.VITE_GATEWAY_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

// Call all subscribers after refreshing token
function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

// Add subscriber while waiting for refresh
function addRefreshSubscriber(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

// Axios request interceptor
instance.interceptors.request.use(
  (config) => {
    NProgress.start();
    const token = window.localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    NProgress.done();
    return Promise.reject(error);
  }
);

// Axios response interceptor
instance.interceptors.response.use(
  (response) => {
    NProgress.done();
    return response;
  },
  async (error) => {
    NProgress.done();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const originalRequest: any = error.config;
    const ERROR_TOAST_ID = "global-error-toast";

    // Handle 401 Unauthorized (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;

        try {
          // Get refresh token from cookie only
          const refreshToken =
            document.cookie
              .split("; ")
              .find((row) => row.startsWith("refresh_token="))
              ?.split("=")[1];

          if (!refreshToken) throw new Error("Refresh token not found in cookies");

          const response = await axios.post(
            `${import.meta.env.VITE_GATEWAY_URL || "http://localhost:5000"}/api/Account/refresh-token`,
            { refreshToken }
          );

          const { accessToken } = response.data;
          window.localStorage.setItem("access_token", accessToken);

          isRefreshing = false;
          onRefreshed(accessToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return instance(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;

          // Remove tokens and redirect to login
          window.localStorage.removeItem("access_token");

          toast.error("Your session has expired. Please log in again.");
          window.location.href = "/login";

          return Promise.reject(refreshError);
        }
      }

      // Queue requests while refreshing
      return new Promise((resolve, reject) => {
        addRefreshSubscriber((newToken: string) => {
          if (!newToken) return reject(error);

          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          resolve(instance(originalRequest));
        });
      });
    }

    // Handle 400 Bad Request
    if (error.response?.status === 400) {
      toast.error(error.response.data?.message || "Invalid data provided.", {
        toastId: ERROR_TOAST_ID,
      });
      return Promise.reject(error.response.data);
    }

    // Handle other error messages
    if (error.response?.data?.message) {
      toast.error(error.response.data.message, {
        toastId: ERROR_TOAST_ID,
      });
      return Promise.reject(error.response.data);
    }

    // Handle generic errors
    if (error.message) {
      toast.error(error.message, {
        toastId: ERROR_TOAST_ID,
      });
    }

    return Promise.reject(error);
  }
);

export default instance;
