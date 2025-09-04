import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

// Interfaces
interface UserPermission {
  id: string;
  name: string;
  module: string;
  action: string;
  scope: string;
}

/**
 * Hook para obtener permisos del backend
 */
export const useBackendPermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setPermissions([]);
      return;
    }

    const loadPermissions = async () => {
      try {
        setIsLoading(true);
        // TODO: Implementar carga real de permisos
        setPermissions([]);
      } catch (err) {
        console.error("Error loading permissions:", err);
        setPermissions([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadPermissions();
  }, [user]);

  const hasPermission = (permissionName: string): boolean => {
    if (!permissions.length) return false;
    return permissions.some(p => p.name === permissionName);
  };

  const refreshPermissions = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      // TODO: Implementar refresh real de permisos
      setPermissions([]);
    } catch (err) {
      console.error("Error refreshing permissions:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    permissions,
    isLoading,
    hasPermission,
    refreshPermissions,
  };
};

/**
 * Hook específico para verificar permisos de módulos usando el backend
 */
export const useBackendModulePermissions = () => {
  const { hasPermission } = useBackendPermissions();

  const canAccessModule = (moduleName: string): boolean => {
    const modulePermissionMap: Record<string, string[]> = {
      dashboard: [], // Siempre accesible
      cases: ["cases.read_own", "cases.read_team", "cases.read_all"],
      notes: ["notes.read_own", "notes.read_team", "notes.read_all"],
      todos: ["todos.read_own", "todos.read_team", "todos.read_all"],
      dispositions: ["dispositions.read_own", "dispositions.read_team", "dispositions.read_all"],
      reports: ["reports.read_own", "reports.read_team", "reports.read_all"],
      admin: ["admin.users", "admin.roles", "admin.permissions"],
      users: ["users.read_all", "admin.users"],
      roles: ["roles.read_all", "admin.roles"],
      permissions: ["permissions.read_all", "admin.permissions"],
      profile: [], // Siempre accesible
    };

    const requiredPermissions = modulePermissionMap[moduleName];

    // Si no hay permisos requeridos, es accesible
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Verificar si tiene alguno de los permisos requeridos
    return requiredPermissions.some(permission => hasPermission(permission));
  };

  return {
    canAccessModule,
  };
};
