import { Role } from "../entities/Role";
import { Permission } from "../entities/Permission";
export interface CreateRoleDto {
    name: string;
    description?: string;
    permissionIds?: string[];
}
export interface UpdateRoleDto {
    name?: string;
    description?: string;
    isActive?: boolean;
    permissionIds?: string[];
}
export declare class RoleService {
    private roleRepository;
    private rolePermissionRepository;
    private permissionRepository;
    private userProfileRepository;
    constructor();
    getAllRoles(): Promise<Role[]>;
    getRolesWithCounts(): Promise<any[]>;
    getRoleById(id: string): Promise<Role | null>;
    getRoleWithPermissions(id: string): Promise<{
        role: Role;
        permissions: Permission[];
        permissionsByModule: {
            [module: string]: Permission[];
        };
    } | null>;
    createRole(roleData: CreateRoleDto): Promise<Role>;
    updateRole(id: string, roleData: UpdateRoleDto): Promise<Role>;
    deleteRole(id: string): Promise<void>;
    assignPermissionsToRole(roleId: string, permissionIds: string[]): Promise<void>;
    cloneRole(sourceRoleId: string, newRoleName: string, newRoleDescription?: string): Promise<Role>;
    getRoleStats(): Promise<{
        totalRoles: number;
        activeRoles: number;
        inactiveRoles: number;
        rolesWithMostPermissions: {
            role: Role;
            permissionsCount: number;
        }[];
    }>;
    searchRoles(filters: {
        search?: string;
        isActive?: boolean;
        hasPermission?: string;
    }): Promise<Role[]>;
    canDeleteRole(roleId: string): Promise<{
        canDelete: boolean;
        reason?: string;
        hasUsers?: boolean;
        hasPermissions?: boolean;
    }>;
}
