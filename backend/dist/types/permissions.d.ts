export interface UserWithPermissions {
    id: string;
    email: string;
    fullName?: string;
    roleId: string;
    roleName?: string;
    teamId?: string;
    teamIds?: string[];
    permissionScope?: "own" | "team" | "all";
    scopeFilters?: {
        [key: string]: any;
    };
}
declare global {
    namespace Express {
        interface Request {
            userWithPermissions?: UserWithPermissions;
        }
    }
}
export interface PermissionCheckResult {
    hasPermission: boolean;
    scope?: "own" | "team" | "all";
    message?: string;
}
export interface ScopeFilterOptions {
    userIdField?: string;
    teamIdField?: string;
    getEntityId?: (req: any) => string | undefined;
    getEntityTeamId?: (req: any) => Promise<string | undefined>;
}
