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
        dashboard: [
          "dashboard.read.own",
          "dashboard.read.all",
          "dashboard.view.own",
          "dashboard.view.all",
        ],
        cases: ["cases.view.own", "cases.view.team", "cases.view.all"],
        todos: ["todos.view.own", "todos.view.team", "todos.view.all"],
        notes: ["notes.view.own", "notes.view.team", "notes.view.all"],
        knowledge: [
          "knowledge.read.own",
          "knowledge.read.team",
          "knowledge.read.all",
          "knowledge.view.own",
          "knowledge.view.team",
          "knowledge.view.all",
        ],
        archive: ["archive.view.own", "archive.view.team", "archive.view.all"],
        dispositions: [
          "dispositions.view.own",
          "dispositions.view.team",
          "dispositions.view.all",
        ],
        users: ["users.view.own", "users.view.team", "users.view.all"],
        roles: ["roles.view.own", "roles.view.team", "roles.view.all"],
        permissions: [
          "permissions.read.own",
          "permissions.read.team",
          "permissions.read.all",
        ],
        teams: ["teams.view.own", "teams.view.team", "teams.view.all"],
        admin: ["permissions.admin.all", "roles.manage.all", "users.admin.all"],
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
