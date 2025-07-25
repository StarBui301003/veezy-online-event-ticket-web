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