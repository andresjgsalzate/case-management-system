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
    return permissions.some((p) => p.name === permissionName);
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
      cases: ["cases.view.own", "cases.view.team", "cases.view.all"],
      notes: ["notes.view.own", "notes.view.team", "notes.view.all"],
      todos: ["todos.view.own", "todos.view.team", "todos.view.all"],
      dispositions: [
        "dispositions.view.own",
        "dispositions.view.team",
        "dispositions.view.all",
      ],
      reports: ["reports.view.own", "reports.view.team", "reports.view.all"],
      admin: ["admin.users.all", "admin.roles.all", "admin.permissions.all"],
      users: ["users.view.all", "admin.users.all"],
      roles: ["roles.manage.all", "admin.roles.all"],
      permissions: ["permissions.read.all", "admin.permissions.all"],
      profile: [], // Siempre accesible
    };

    const requiredPermissions = modulePermissionMap[moduleName];

    // Si no hay permisos requeridos, es accesible
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Verificar si tiene alguno de los permisos requeridos
    return requiredPermissions.some((permission) => hasPermission(permission));
  };

  return {
    canAccessModule,
  };
};
