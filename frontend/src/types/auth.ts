export interface Permission {
  id: string;
  name: string;
  module: string;
  action: string;
  scope: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  permissions: Permission[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UserWithPermissions {
  id: string;
  email: string;
  fullName: string;
  roleName: string;
  roleId: string;
  permissions: Permission[];
  role: Role;
}

export interface PermissionResponse {
  success: boolean;
  data?: Permission[];
  message?: string;
}

export interface RoleResponse {
  success: boolean;
  data?: Role[];
  message?: string;
}

export interface UserPermissionsResponse {
  success: boolean;
  data?: {
    user: UserWithPermissions;
    permissions: Permission[];
    modules: string[];
  };
  message?: string;
}

// Token response interface
export interface AuthResponse {
  message: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    roleName: string;
    isActive: boolean;
  };
  token: string;
}

// Login data interface
export interface LoginData {
  email: string;
  password: string;
}

// Register data interface
export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// User state interface
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  roleName: string;
  isActive: boolean;
}
