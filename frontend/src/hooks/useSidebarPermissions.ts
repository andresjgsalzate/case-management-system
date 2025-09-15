import { useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useAuthStore } from "../stores/authStore";
import { Permission } from "../types/auth";

interface SidebarPermissions {
  hasPermission: (permission: string) => boolean;
  canAccessModule: (module: string) => boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  userPermissions: Permission[];
}

export const useSidebarPermissions = (): SidebarPermissions => {
  const { isAuthenticated } = useAuth();
  const {
    isLoadingPermissions,
    permissionsLoaded,
    hasPermission,
    userPermissions,
  } = useAuthStore();

  const isLoading = useMemo(() => {
    return isLoadingPermissions || !permissionsLoaded;
  }, [isLoadingPermissions, permissionsLoaded]);

  const canAccessModule = useMemo(() => {
    return (module: string): boolean => {
      if (!isAuthenticated || isLoading) return false;

      const modulePermissions: Record<string, string[]> = {
        dashboard: ["dashboard:view", "metrics:view"],
        cases: ["cases:view", "cases:read"],
        todos: ["todos:view", "todos:read"],
        notes: ["notes:view", "notes:read"],
        knowledge: ["knowledge:view", "knowledge:read"],
        archive: ["archive:view", "archive:read"],
        dispositions: ["dispositions:view", "dispositions:read"],
        users: ["users:view", "users:read"],
        roles: ["roles:view", "roles:read"],
        permissions: ["permissions:view", "permissions:read"],
        admin: ["admin:access", "system:admin"],
      };

      const requiredPermissions = modulePermissions[module] || [];
      return requiredPermissions.some((permission) =>
        hasPermission(permission)
      );
    };
  }, [isAuthenticated, isLoading, hasPermission]);

  return useMemo(
    () => ({
      hasPermission: (permission: string) => {
        if (!isAuthenticated || isLoading) return false;
        return hasPermission(permission);
      },
      canAccessModule,
      isLoading,
      isAuthenticated,
      userPermissions: userPermissions || [],
    }),
    [
      isAuthenticated,
      isLoading,
      hasPermission,
      canAccessModule,
      userPermissions,
    ]
  );
};
