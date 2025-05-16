
export interface LoginRequest {
  username: string;
  password: string;
  deviceInfo?: string,
  ipAddress?: string,
  location?: string
}

export interface RegisterRequest {
  username: string;
  email: string
  password: string;
  fullName: string
  dob: string,
   role: number;
}
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  account: {
    accountId: string;
    username: string;
    email: string;
    fullname: string;
    dob?: string;
  } 
  sessionId?: string;
}

export interface Account {
  accountId: string;
  username: string;
  avatar?: string;
  email: string;
  fullname: string;
  dob?: string;
  phone?: string;
} //tam thoi

export interface User {
  userId: string;
  accountId: string;
  fullName: string;
  phone?: string;
  email: string;
  avatar: string;
  gender: string;
  dob: string;
} 


export interface VerifyEmailRegisterAPI {
  email: string; 
  verificationCode: string;
}
