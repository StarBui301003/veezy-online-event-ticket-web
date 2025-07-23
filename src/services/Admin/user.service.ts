import instance from "../axios.customize";
import type { CreateAdminRequest, EditUserRequest, PaginatedUserResponse } from "@/types/Admin/user";


// export const getAccountByIdAPI = async (accountId: string) => {
//   const response = await instance.get(`/api/Account/${accountId}`);
//   return response.data.data;
// };

// // Lấy username từ accountId
// export const getUsernameByAccountId = async (accountId: string) => {
//   try {
//     const account = await getAccountByIdAPI(accountId);
//     return account?.username || accountId;
//   } catch {
//     return accountId;
//   }
// };

// Lấy username từ userId
export const getUserNameByUserId = async (userId: string) => {
  try {
    const user = await getUserByIdAPI(userId);
    return user?.username || userId;
  } catch {
    return userId;
  }
};

// Lấy fullName từ userId
export const getFullNameByUserId = async (userId: string) => {
  try {
    const user = await getUserByIdAPI(userId);
    return user?.fullName || userId;
  } catch {
    return userId;
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

export async function getAdminUsers(page = 1, pageSize = 10): Promise<PaginatedUserResponse> {
  const res = await instance.get('/api/User/admins', { params: { page, pageSize } });
  return res.data;
}

export async function getCustomerUsers(page = 1, pageSize = 10): Promise<PaginatedUserResponse> {
  const res = await instance.get('/api/User/customers', { params: { page, pageSize } });
  return res.data;
}

export async function getEventManagerUsers(page = 1, pageSize = 10): Promise<PaginatedUserResponse> {
  const res = await instance.get('/api/User/event-managers', { params: { page, pageSize } });
  return res.data;
}

export async function getCollaboratorUsers(page = 1, pageSize = 10): Promise<PaginatedUserResponse> {
  const res = await instance.get('/api/User/collaborators', { params: { page, pageSize } });
  return res.data;
}

export const updateFaceAPI = async (
  accountId: string,
  faceImage: File,
  faceEmbedding: number[] | null,
  password?: string
) => {
  const formData = new FormData();
  if (faceEmbedding && faceEmbedding.length > 0) {
    faceEmbedding.forEach((num, idx) => {
      formData.append(`FaceEmbedding[${idx}]`, num.toString());
    });
  }
  formData.append('AccountId', accountId);
  formData.append('FaceImage', faceImage, 'face.jpg');
  if (password) {
    formData.append('Password', password);
  }
  const response = await instance.put('/api/Account/updateFace', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};


