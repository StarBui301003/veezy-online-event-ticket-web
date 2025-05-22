import axios from "@/services/axios.customize";
import { LoginRequest, LoginResponse, RegisterRequest, VerifyEmailRegisterAPI } from "@/types/auth";

export const loginAPI = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await axios.post<LoginResponse>("https://localhost:7120/api/Account/login", data);
  return response.data;
};
//authentication
export const RegisterAPI = async (data: RegisterRequest) => {
  const response = await axios.post("https://localhost:7120/api/Account/register", data);
  return response.data;
};

export const LogoutAPI = async () => {
  return await axios.post("https://localhost:7120/api/Account/logout");
};

export const verifyEmailRegisterAPI = async (data: VerifyEmailRegisterAPI) => {
  const response = await axios.post("https://localhost:7120/api/Account/verify-email", data);
  return response.data;
};

export const resendVerifyEmailRegisterAPI = async (email: string) => {
  const response = await axios.post("https://localhost:7120/api/Account/resend-verification", { email });
  return response.data;
};

export const requestResetPassword = async (email: string) => {
  const response = await axios.post("https://localhost:7120/api/Account/forgot-password", { email });
  return response.data;
};

export const resetPasswordWithCode = async (email: string, code: string, newPassword: string) => {
  const response = await axios.post("https://localhost:7120/api/Account/reset-password", {
    email,
    verificationCode: code,
    newPassword,
  });
  return response.data;
};

export const getUserAPI = async (userId: string) => {
  const token = localStorage.getItem('access_token');
  const response = await axios.get(
    `/api/User/${userId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};
//------------------------------------------------------------------------------------------------------


