import instance from "@/services/axios.customize";
import { LoginRequest, LoginResponse, RegisterRequest,  VerifyEmailRegisterAPI } from "@/types/auth";

export const loginAPI = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await instance.post<LoginResponse>("/api/Account/login", data);
  return response.data;
};

//authentication
export const RegisterAPI = async (data: RegisterRequest) => {
  const response = await instance.post("/api/Account/register", data);
  return response.data;
};

export const LogoutAPI = async () => {
  return await instance.post("/api/Account/logout");
};

export const verifyEmailRegisterAPI = async (data: VerifyEmailRegisterAPI) => {
  const response = await instance.post("/api/Account/verify-email", data);
return response.data;
};

export const resendVerifyEmailRegisterAPI = async (email: string) => {
  const response = await instance.post("/api/Account/resend-verification", { email });
 return response.data;
};

export const requestResetPassword = async (email: string) => {
  const response = await instance.post("/api/Account/forgot-password", { email });
  return response.data;
};

export const resetPasswordWithCode = async (email: string, code: string, newPassword: string) => {
  const response = await instance.post("/api/Account/reset-password", {
    email,
    verificationCode: code,
    newPassword,
  });
  return response.data;
};

export const getUserAPI = async (userId: string) => {
  const response = await instance.get(`/api/User/${userId}`);
  return response.data.data;
};

export async function refreshTokenAPI() {
  // Lấy refresh token từ cookie hoặc localStorage
  let refreshToken = '';
  const match = document.cookie.match(/(^|;\s*)refresh_token=([^;]*)/);
  if (match) {
    refreshToken = decodeURIComponent(match[2]);
  } else { throw new Error('No refresh token found');}

  const res = await instance.post('/api/Account/refresh-token', { refreshToken });
  return res.data;
}

export async function deleteOrder(orderId: string) {
  const response = await instance.delete(`/api/Order/${orderId}`);
  return response.data;
}

export async function getDiscountCodesByEvent(eventId: string) {
  try {
    const response = await instance.get(`/api/DiscountCode/event/${eventId}`);
    return response.data?.data || [];
  } catch (err: any) {
    if (err.response && err.response.status === 404) {
      return [];
    }
    throw err;
  }
}
export interface CreateDiscountCodeData {
  code: string;
  discountPercentage: number;
  startDate: string;
  endDate: string;
  eventId: string;
}

export interface DiscountCode {
  id: string;
  code: string;
  discountPercentage: number;
  startDate: string;
  endDate: string;
  eventId: string;
  eventName: string;
}

export async function createDiscountCode(data: CreateDiscountCodeData) {
  const response = await instance.post("/api/DiscountCode", data);
  return response.data?.data || response.data;
}


export async function deleteDiscountCode(id: string) {
  const response = await instance.delete(`/api/DiscountCode/${id}`);
  return response.data?.data || response.data;
} 