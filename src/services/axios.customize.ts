/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { toast } from "react-toastify";

// Create Axios instance
const instance = axios.create({
  baseURL: import.meta.env.VITE_GATEWAY_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

let setSpinner: ((show: boolean) => void) | null = null;

export function registerGlobalSpinner(fn: (show: boolean) => void) {
  setSpinner = fn;
}

// Axios request interceptor
instance.interceptors.request.use(
  (config) => {
    if (setSpinner) setSpinner(true);
    const token = window.localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    if (setSpinner) setSpinner(false);
    return Promise.reject(error);
  }
);

// Axios response interceptor
instance.interceptors.response.use(
  (response) => {
    if (setSpinner) setSpinner(false);
    return response;
  },
  async (error) => {
    if (setSpinner) setSpinner(false);
    const originalRequest = error.config;
    const ERROR_TOAST_ID = "global-error-toast";

    // Handle 401 Unauthorized (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;

        try {
          // Get refresh token from cookie
          const refreshToken = document.cookie
            .split("; ")
            .find((row) => row.startsWith("refresh_token="))
            ?.split("=")[1];

          if (!refreshToken) {
            isRefreshing = false;
            return Promise.reject(error);
          }

          // Call refresh token API with separate axios instance to avoid interceptors
          const refreshResponse = await axios.post(
            `${import.meta.env.VITE_GATEWAY_URL || "http://localhost:5000"}/api/Account/refresh-token`,
            { refreshToken },
            {
              headers: { 'Content-Type': 'application/json' }
            }
          );

          const { accessToken } = refreshResponse.data;

          if (!accessToken) {
            isRefreshing = false;
            return Promise.reject(error);
          }

          // Update access token
          window.localStorage.setItem("access_token", accessToken);

          // Update Authorization header for original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          // Notify subscribers with new token
          refreshSubscribers.forEach((cb) => cb(accessToken));
          refreshSubscribers = [];

          isRefreshing = false;

          // Retry original request with new token
          return instance(originalRequest);

        } catch (refreshError: any) {
          isRefreshing = false;
          refreshSubscribers = [];

          // Only clear auth and redirect if refresh token API returns 401/403
          if (refreshError?.response?.status === 401 || refreshError?.response?.status === 403) {
            window.localStorage.removeItem("access_token");
            window.localStorage.removeItem("account");
            window.localStorage.removeItem("customerId");
            window.localStorage.removeItem("user_config");
            document.cookie = "refresh_token=; Max-Age=0; path=/;";

            toast.error("Session expired. Please login again.", {
              toastId: ERROR_TOAST_ID
            });

            window.location.href = "/login";
          }
          return Promise.reject(refreshError);
        }
      }

      // Queue retry if refresh is in progress
      return new Promise((resolve) => {
        refreshSubscribers.push((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(instance(originalRequest));
        });
      });
    }

    // Handle 400 Bad Request
    if (error.response?.status === 400) {
      toast.error(error.response.data?.message || "Invalid data provided.", {
        toastId: ERROR_TOAST_ID,
      });
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

