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
  password?: string,
  hasExistingFaceAuth?: boolean
) => {
  console.log('[UpdateFace] Starting face update process...', {
    accountId,
    fileName: faceImage.name,
    fileSize: faceImage.size,
    fileType: faceImage.type,
    hasPassword: !!password,
    hasExistingFaceAuth,
    faceEmbeddingLength: faceEmbedding?.length || 0
  });

  const formData = new FormData();
  if (faceEmbedding && faceEmbedding.length > 0) {
    console.log('[UpdateFace] Adding face embedding to form data...');
    faceEmbedding.forEach((num, idx) => {
      formData.append(`FaceEmbedding[${idx}]`, num.toString());
    });
  }
  
  // Only append AccountId if user already has face authentication
  // This helps the backend determine whether to call AI service with accountId (update) or without (enroll)
  if (hasExistingFaceAuth !== false) {
    console.log('[UpdateFace] Adding AccountId to form data (user has existing face auth)');
    formData.append('AccountId', accountId);
  } else {
    console.log('[UpdateFace] Skipping AccountId (new face registration)');
  }
  
  formData.append('FaceImage', faceImage, 'face.jpg');
  if (password) {
    console.log('[UpdateFace] Adding password to form data');
    formData.append('Password', password);
  }

  console.log('[UpdateFace] Form data prepared, sending request...');
  try {
    const response = await instance.put('/api/Account/updateFace', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    console.log('[UpdateFace] API Response received:', {
      status: response.status,
      flag: response.data?.flag,
      code: response.data?.code,
      message: response.data?.message,
      data: response.data?.data
    });
    
    return response.data;
  } catch (error: any) {
    console.error('[UpdateFace] API Error:', {
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      message: error?.message
    });
    throw error;
  }
};

export const checkFaceAuthStatusAPI = async () => {
  try {
    const response = await instance.get('/api/Account/hasFaceAuth');
    return response.data;
  } catch (error: any) {
    console.error('[FaceAuthStatus] API Error:', {
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      message: error?.message
    });
    throw error;
  }
};

