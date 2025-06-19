import { AdminOrderListResponse } from "@/types/Admin/order";
import instance from "../axios.customize";
import { User } from "@/types/auth";
import type { CreateAdminRequest, EditUserRequest } from "@/types/Admin/user";

export async function getOrdersAdmin(params?: { page?: number; pageSize?: number; eventId?: string }) {
  const res = await instance.get<AdminOrderListResponse>('/api/Order', { params });
  return res.data;
}


export const getAccountByIdAPI = async (accountId: string) => {
  const response = await instance.get(`/api/Account/${accountId}`);
  return response.data.data;
};

// Lấy username từ accountId
export const getUsernameByAccountId = async (accountId: string) => {
  try {
    const account = await getAccountByIdAPI(accountId);
    return account?.username || accountId;
  } catch {
    return accountId;
  }
};

export const editUserAPI = async (
  userId: string,
  data: EditUserRequest
) => {
  const response = await instance.put(`/api/User/${userId}`, data);
  return response.data.data;
};



//------------------------------------------------------------------------------------------------------
interface UserListResponse {
  data: {
    items: User[];
  };
  message?: string;
  code?: number;
}
export async function getUsers() {
  const res = await instance.get<UserListResponse>('/api/User');
  return res.data.data.items;
}

export const uploadUserAvatarAPI = async (userId: string, avatarFile: File) => {
  const formData = new FormData();
  formData.append('avatarFile', avatarFile);

  const response = await instance.post(`/api/User/${userId}/avatar`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getUserByIdAPI = async (userId: string) => {
  const response = await instance.get(`/api/User/${userId}`);
  return response.data.data;
};



export const createAdminAPI = async (data: CreateAdminRequest) => {
  const payload = { ...data, role: 0 };
  const response = await instance.post('/api/Account/create-admin', payload);
  return response.data;
};


