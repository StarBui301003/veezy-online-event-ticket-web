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
