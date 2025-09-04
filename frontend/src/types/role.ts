export interface Role {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  permissions?: Permission[];
  userCount?: number;
  permissionCount?: number;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  module: string;
  action: string;
  scope: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  isActive?: boolean;
  permissionIds?: string[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
  permissionIds?: string[];
}

export interface RoleFilterParams {
  search?: string;
  isActive?: boolean;
  sortBy?: "createdAt" | "name" | "updatedAt";
  sortOrder?: "ASC" | "DESC";
  page?: number;
  limit?: number;
}

export interface RoleListResponse {
  roles: Role[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AssignPermissionsRequest {
  permissionIds: string[];
}

export interface RoleStats {
  totalRoles: number;
  activeRoles: number;
  inactiveRoles: number;
  totalPermissions: number;
  rolesWithUsers: number;
  systemRoles: number;
}

export interface CloneRoleRequest {
  newName: string;
}
