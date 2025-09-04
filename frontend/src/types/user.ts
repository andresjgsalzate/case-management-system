export interface User {
  id: string;
  email: string;
  fullName: string;
  roleId?: string;
  roleName: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  role?: {
    id: string;
    name: string;
    description?: string;
  };
}

export interface CreateUserRequest {
  email: string;
  fullName: string;
  password: string;
  roleId?: string;
  roleName?: string;
  isActive?: boolean;
}

export interface UpdateUserRequest {
  email?: string;
  fullName?: string;
  roleId?: string;
  roleName?: string;
  isActive?: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdatePasswordRequest {
  newPassword: string;
}

export interface UserFilterParams {
  search?: string;
  roleId?: string;
  roleName?: string;
  isActive?: boolean;
  sortBy?: "createdAt" | "fullName" | "email" | "lastLoginAt";
  sortOrder?: "ASC" | "DESC";
  page?: number;
  limit?: number;
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
