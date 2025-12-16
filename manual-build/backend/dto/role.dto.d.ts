export declare class CreateRoleRequest {
    name: string;
    description?: string;
    isActive?: boolean;
    permissionIds?: string[];
}
export declare class UpdateRoleRequest {
    name?: string;
    description?: string;
    isActive?: boolean;
    permissionIds?: string[];
}
export declare class RoleFilterParams {
    search?: string;
    isActive?: boolean;
    sortBy?: "createdAt" | "name" | "updatedAt";
    sortOrder?: "ASC" | "DESC";
    page?: number;
    limit?: number;
}
export declare class AssignPermissionsRequest {
    permissionIds: string[];
}
