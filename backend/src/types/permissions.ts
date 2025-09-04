// Tipos específicos para el sistema de permisos
export interface UserWithPermissions {
  id: string;
  email: string;
  fullName?: string;
  roleId: string;
  roleName?: string;
  teamId?: string;
  permissionScope?: "own" | "team" | "all";
  scopeFilters?: { [key: string]: any };
}

// Extender el Request para incluir el usuario con permisos
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
