import instance from "./axios.customize";

export interface UserConfig {
  language: number; // 0: default, 1: vi, 2: en
  theme: number;
  receiveEmail: boolean;
  receiveNotify: boolean;
}

export interface UserConfigResponse {
  flag: boolean;
  code: number;
  data: UserConfig;
  message: string;
}

export interface UpdateUserConfigResponse {
  flag: boolean;
  code: number;
  data: boolean;
  message: string;
}

export async function getUserConfig(userId: string) {
  const response = await instance.get<UserConfigResponse>(`/api/User/${userId}/config`);
  return response.data;
}

export async function updateUserConfig(userId: string, config: UserConfig) {
  const response = await instance.put<UpdateUserConfigResponse>(`/api/User/${userId}/config`, config);
  return response.data;
} 