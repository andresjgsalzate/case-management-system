import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

interface DynamicPermissions {
  hasPermission: (permission: string) => boolean;
  canAccessModule: (module: string) => boolean;
  isLoading: boolean;
}

/**
 * Hook que proporciona verificación dinámica de permisos
 * Actualiza los permisos en tiempo real consultando al servidor
 */
export const useDynamicPermissions = (
  permissions: string[] = [],
  modules: string[] = []
): DynamicPermissions => {
  const { hasPermissionAsync, canAccessModuleAsync, isAuthenticated } =
    useAuth();
  const [permissionCache, setPermissionCache] = useState<
    Record<string, boolean>
  >({});
  const [moduleCache, setModuleCache] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Función para verificar permisos dinámicamente
  const checkPermissions = async () => {
    if (!isAuthenticated) {
      setPermissionCache({});
      setModuleCache({});
      return;
    }

    setIsLoading(true);

    try {
      // Verificar permisos
      const permissionResults: Record<string, boolean> = {};
      for (const permission of permissions) {
        permissionResults[permission] = await hasPermissionAsync(permission);
      }

      // Verificar módulos
      const moduleResults: Record<string, boolean> = {};
      for (const module of modules) {
        moduleResults[module] = await canAccessModuleAsync(module);
      }

      setPermissionCache(permissionResults);
      setModuleCache(moduleResults);
    } catch (error) {
      console.error("Error verificando permisos dinámicos:", error);
      // En caso de error, denegar todos los permisos por seguridad
      setPermissionCache(
        Object.fromEntries(permissions.map((p) => [p, false]))
      );
      setModuleCache(Object.fromEntries(modules.map((m) => [m, false])));
    } finally {
      setIsLoading(false);
    }
  };

  // Verificar permisos al montar y cuando cambian las dependencias
  useEffect(() => {
    checkPermissions();
  }, [isAuthenticated, permissions.join(","), modules.join(",")]);

  // Re-verificar cada 30 segundos para mantener los permisos actualizados
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      checkPermissions();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return {
    hasPermission: (permission: string) => permissionCache[permission] || false,
    canAccessModule: (module: string) => moduleCache[module] || false,
    isLoading,
  };
};

/**
 * Hook específico para el Sidebar que verifica todos los permisos necesarios
 */
export const useSidebarPermissions = () => {
  const permissions = [
    "dashboard.view.own",
    "dashboard.view.all",
    "cases.create.all",
    "users.view.all",
    "roles.view.all",
    "permissions.read.all",
    "tags.manage.all",
    "knowledge.read.all",
    "archive.view.all",
  ];

  const modules = ["cases", "todos", "dispositions", "notes"];

  return useDynamicPermissions(permissions, modules);
};
