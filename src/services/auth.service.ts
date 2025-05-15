
import axios from "@/services/axios.customize";
import { LoginRequest, LoginResponse, RegisterRequest } from "@/types/auth";

export const loginAPI = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await axios.post<LoginResponse>("/api/Account/login", data);
  return response.data;
};

export const RegisterAPI = async (data: RegisterRequest) => {
  return await axios.post("/api/Account/register", data);
};

export const LogoutAPI = async () => {
  return await axios.post("/api/Account/logout");
};