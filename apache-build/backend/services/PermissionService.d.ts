import { Permission } from "../entities/Permission";
export declare class PermissionService {
    private permissionRepository;
    private rolePermissionRepository;
    private roleRepository;
    constructor();
    getAllPermissions(): Promise<Permission[]>;
    getPermissionsByModule(module: string): Promise<Permission[]>;
    getPermissionsByRole(roleId: string): Promise<Permission[]>;
    hasPermission(roleId: string, permissionName: string): Promise<boolean>;
    hasPermissions(roleId: string, permissionNames: string[]): Promise<{
        [key: string]: boolean;
    }>;
    hasPermissionWithScope(roleId: string, module: string, action: string, userScope?: "own" | "team" | "all"): Promise<boolean>;
    getHighestScope(roleId: string, module: string, action: string): Promise<"own" | "team" | "all" | null>;
    assignPermissionsToRole(roleId: string, permissionIds: string[]): Promise<void>;
    createPermission(permissionData: {
        name: string;
        description?: string;
        module: string;
        action: string;
        scope: "own" | "team" | "all";
    }): Promise<Permission>;
    getModulesStructure(): Promise<{
        [module: string]: {
            actions: string[];
            scopes: string[];
            totalPermissions: number;
        };
    }>;
    searchPermissions(filters: {
        module?: string;
        action?: string;
        scope?: string;
        search?: string;
    }): Promise<Permission[]>;
    getAllActions(): Promise<{
        action: string;
    }[]>;
    translateAction(fromAction: string, toAction: string): Promise<{
        count: number;
    }>;
    updateNamesFormat(): Promise<{
        count: number;
    }>;
}
