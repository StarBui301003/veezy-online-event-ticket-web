import { User } from "../auth";

export interface EditUserRequest {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  dob: string;
  gender: number;

}
export interface CreateAdminRequest {
  username: string;
  email: string;
  phone: string;
  password: string;
  role?: number; // default 0 (admin), can be omitted
  gender: 0 | 1; // 0: Male, 1: Female
  fullName: string;
  dateOfBirth: string; // ISO string
}

// New comprehensive user response interface
export interface UserAccountResponse {
  // User fields
  userId: string;
  fullName: string;
  phone?: string;
  email: string;
  avatarUrl?: string;
  gender: string;
  dob?: string;
  location?: string;
  createdAt: string;
  
  // Account fields
  accountId: string;
  username: string;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
  isOnline: boolean;
  lastActiveAt: string;
  lastLogin: string;
}

export interface PaginatedUserResponse {
  flag: boolean;
  code: number;
  data: {
    items: User[];
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  message: string | null;
}

// New comprehensive paginated response
export interface PaginatedUserAccountResponse {
  flag: boolean;
  code: number;
  data: {
    items: UserAccountResponse[];
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  message: string | null;
}