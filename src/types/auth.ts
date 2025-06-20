export interface LoginRequest {
  username: string;
  password: string;
  deviceInfo?: string,
  ipAddress?: string,
  location?: string
}

export interface RegisterRequest {
  username: string;
  email: string;
  phone: string;
  password: string;
  fullName: string
  dateOfBirth: string,
   role: number;
}
export interface LoginResponse {
  flag: boolean;
  code: number;
  data: {
    accessToken: string;
    refreshToken: string;
    account: {
      accountId: string;
      userId: string;
      username: string;
      email: string;
      phone: string;
      role: number;
      gender: number;
      avatar: string;
      isActive: boolean;
      isEmailVerified: boolean;
      createdAt: string;
      lastLogin: string;
      isOnline: boolean;
      lastActiveAt: string;
      lastLoginDevice: string;
      lastLoginIP: string | null;
      lastLoginLocation: string | null;
      userConfig: {
        language: number;
        theme: number;
        receiveEmail: boolean;
        receiveNotify: boolean;
      };
      currentSession: {
        deviceInfo: string;
        ipAddress: string;
        location: string;
        lastUsedAt: string;
        expiresAt: string;
      };
      categories: {
        categoryId: string;
        categoryName: string;
        categoryDescription: string;
      }[];
    };
  } | null;
  message: string | null;
}

export interface Account {
  accountId: string;
  username: string;
  avatar?: string;
  email: string;
  fullname: string;
  dob?: string;
  phone?: string;
  role: number; 
} //tam thoi

export interface User {
  userId: string;
  accountId: string;
  fullName: string;
  phone: string;
  email: string;
  avatarUrl: string;
  gender: number;
  dob: string;
  location: string;
  categories: {
    categoryId: string;
    categoryName: string;
    categoryDescription: string;
  }[];
  createdAt: string;
}


export interface VerifyEmailRegisterAPI {
  email: string; 
  verificationCode: string;
}
