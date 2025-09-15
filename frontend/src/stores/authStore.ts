import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authService } from "../services/auth.service";
import { authPermissionService } from "../services/authPermission.service";
import { securityService } from "../services/security.service";
import { Permission } from "../types/auth";
interface User {
  id: string;
  email: string;
  fullName: string;
  roleName: string;
  roleId?: string;
  permissions?: Permission[];
  modules?: string[];
}
interface AuthState {
  // Estado
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  // Cache de permisos y módulos (obtenidos del backend)
  userPermissions: Permission[];
  userModules: string[];
  permissionsLoaded: boolean;
  isLoadingPermissions: boolean;
  // Control de warnings para evitar spam en consola
  lastPermissionWarningTime?: number;
  // Acciones
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<void>;
  logout: () => void;
  refreshTokens: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  clearError: () => void;
  initializeFromSecurityService: () => Promise<void>;
  // Permisos dinámicos
  loadUserPermissions: () => Promise<void>;
  hasPermission: (permission: string) => boolean; // Deprecado - usar hasPermissionAsync
  canAccessModule: (module: string) => boolean; // Deprecado - usar canAccessModuleAsync
  hasPermissionAsync: (permission: string) => Promise<boolean>; // Nueva función dinámica
  canAccessModuleAsync: (module: string) => Promise<boolean>; // Nueva función dinámica
  refreshPermissions: () => Promise<void>;
}
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      userPermissions: [],
      userModules: [],
      permissionsLoaded: false,
      isLoadingPermissions: false,
      // Acciones de autenticación
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login({ email, password });
          if (response.success && response.data) {
            const { user, token, refreshToken } = response.data;
            // Usar SecurityService para almacenamiento seguro
            securityService.storeTokens(token, refreshToken, 3600); // 1 hora por defecto
            // Solo guardar datos del usuario (no tokens)
            localStorage.setItem("user", JSON.stringify(user));
            set({
              user,
              token,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            // Pequeño delay para asegurar que los tokens estén disponibles
            await new Promise((resolve) => setTimeout(resolve, 100));
            // Cargar permisos automáticamente después del login
            await get().loadUserPermissions();
          } else {
            throw new Error(response.message || "Login failed");
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Login failed";
          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
            user: null,
            token: null,
            refreshToken: null,
          });
          throw error;
        }
      },
      register: async (email: string, password: string, fullName: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register({
            email,
            password,
            fullName,
          });
          if (response.success && response.data) {
            const { user, token, refreshToken } = response.data;
            // Usar SecurityService para almacenamiento seguro
            securityService.storeTokens(token, refreshToken, 3600); // 1 hora por defecto
            // Solo guardar datos del usuario (no tokens)
            localStorage.setItem("user", JSON.stringify(user));
            set({
              user,
              token,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            // Cargar permisos automáticamente después del registro
            await get().loadUserPermissions();
          } else {
            throw new Error(response.message || "Registration failed");
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Registration failed";
          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
            user: null,
            token: null,
            refreshToken: null,
          });
          throw error;
        }
      },
      logout: () => {
        // Usar SecurityService para limpiar sesión de forma segura
        securityService.clearSession();
        // Limpiar localStorage
        localStorage.removeItem("user");
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          userPermissions: [],
          userModules: [],
          permissionsLoaded: false,
          isLoadingPermissions: false,
        });
      },
      refreshTokens: async () => {
        const currentRefreshToken = get().refreshToken;
        if (!currentRefreshToken) {
          get().logout();
          return;
        }
        try {
          const response = await authService.refreshToken(currentRefreshToken);
          if (response.success && response.data) {
            const newToken = response.data.token;
            // Usar SecurityService para actualizar tokens
            securityService.storeTokens(newToken, currentRefreshToken, 3600); // 1 hora por defecto
            set({
              token: newToken,
              error: null,
            });
          } else {
            throw new Error("Token refresh failed");
          }
        } catch (error) {
          console.error("Error refreshing token:", error);
          get().logout();
        }
      },
      getCurrentUser: async () => {
        set({ isLoading: true });
        try {
          const response = await authService.getCurrentUser();
          if (response.success && response.data) {
            const user = response.data;
            localStorage.setItem("user", JSON.stringify(user));
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            // Cargar permisos automáticamente después de obtener el usuario
            await get().loadUserPermissions();
          } else {
            throw new Error("Failed to get current user");
          }
        } catch (error) {
          console.error("Error getting current user:", error);
          set({ isLoading: false });
          get().logout();
        }
      },
      clearError: () => {
        set({ error: null });
      },
      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...userData };
          set({ user: updatedUser });
          // Actualizar también en localStorage
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
      },
      // Inicializar desde SecurityService
      initializeFromSecurityService: async () => {
        set({ isLoading: true }); // Importante: marcar como cargando
        try {
          const tokens = securityService.getValidTokens();
          const userString = localStorage.getItem("user");
          if (tokens && userString) {
            const user = JSON.parse(userString);
            set({
              user,
              token: tokens.token,
              refreshToken: tokens.refreshToken,
              isAuthenticated: true,
              isLoading: false, // Terminar la carga
              error: null,
            });
            // Cargar permisos
            await get().loadUserPermissions();
          } else {
            // No hay sesión válida, limpiar estado
            set({
              user: null,
              token: null,
              refreshToken: null,
              isAuthenticated: false,
              isLoading: false, // Terminar la carga
              userPermissions: [],
              userModules: [],
              permissionsLoaded: false,
            });
          }
        } catch (error) {
          console.error("Error inicializando desde SecurityService:", error);
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false, // Terminar la carga incluso en error
            error: "Error de inicialización",
          });
        }
      },
      // Cargar permisos del usuario desde el backend
      loadUserPermissions: async () => {
        const { isLoadingPermissions, isAuthenticated } = get();
        // Solo cargar si el usuario está autenticado
        if (!isAuthenticated) {
          return;
        }
        // Evitar cargas múltiples
        if (isLoadingPermissions) {
          return;
        }
        set({ isLoadingPermissions: true });
        try {
          const response = await authPermissionService.getUserPermissions();
          if (response.success && response.data) {
            const { permissions, modules } = response.data;
            console.log("✅ loadUserPermissions - Permisos cargados:", {
              permissionsCount: permissions.length,
              modulesCount: modules.length,
              firstPermissions: permissions.slice(0, 5).map((p) => p.name || p),
              allPermissions: permissions.map((p) => p.name || p), // 🔍 Ver TODOS los permisos
            });
            set({
              userPermissions: permissions,
              userModules: modules,
              permissionsLoaded: true,
              isLoadingPermissions: false,
            });
          } else {
            console.log(
              "❌ loadUserPermissions - Respuesta sin datos:",
              response
            );
            set({
              userPermissions: [],
              userModules: [],
              permissionsLoaded: false,
              isLoadingPermissions: false,
            });
          }
        } catch (error) {
          console.error("❌ loadUserPermissions - Error:", error);
          // Si es error 401, el token ha expirado o es inválido
          if (error instanceof Error && error.message.includes("401")) {
            get().logout();
            return;
          }
          set({
            userPermissions: [],
            userModules: [],
            permissionsLoaded: false,
            isLoadingPermissions: false,
          });
        }
      },
      refreshPermissions: async () => {
        set({ permissionsLoaded: false, isLoadingPermissions: false });
        await get().loadUserPermissions();
      },
      // Verificación de permisos con throttling de warnings - FUNCIONALMENTE CORRECTA
      hasPermission: (permission: string) => {
        const state = get();
        const { user, userPermissions, permissionsLoaded } = state;
        // Si no hay usuario o permisos no están cargados, no tiene permisos
        if (!user || !permissionsLoaded) return false;
        // Verificar permisos del usuario usando userPermissions (datos de BD)
        if (!userPermissions || !Array.isArray(userPermissions)) {
          return false;
        }
        // Los permisos de BD vienen como objetos con 'name'
        const permissionNames = userPermissions.map((p) => p.name || p);
        // Verificar permiso directo
        if (permissionNames.includes(permission)) {
          return true;
        }
        // Verificar permisos de admin
        if (permissionNames.includes("permissions.admin_all")) {
          return true;
        }
        return false;
      },
      // Nueva función para verificación dinámica de permisos
      hasPermissionAsync: async (permission: string): Promise<boolean> => {
        const { user } = get();
        // Si no hay usuario, no tiene permisos
        if (!user) return false;
        try {
          // SIEMPRE consultar al servidor - NO usar caché
          const response = await authPermissionService.getUserPermissions();
          if (response.success && response.data) {
            const { permissions } = response.data;
            return permissions.some(
              (p: any) => p.name === permission && p.isActive
            );
          }
          return false;
        } catch (error) {
          console.error("Error verificando permiso:", error);
          return false;
        }
      },
      // Verificación de módulos completamente dinámica - SIEMPRE consulta al servidor
      canAccessModule: (module: string) => {
        const { user } = get();
        // Si no hay usuario, no puede acceder
        if (!user) return false;
        // SIEMPRE retornar false y forzar que los componentes usen canAccessModuleAsync
        console.warn(
          `🚨 canAccessModule(${module}) - Use canAccessModuleAsync para consulta dinámica`
        );
        return false;
      },
      // Nueva función para verificación dinámica de módulos
      canAccessModuleAsync: async (module: string): Promise<boolean> => {
        const { user } = get();
        // Si no hay usuario, no puede acceder
        if (!user) return false;
        try {
          // SIEMPRE consultar al servidor - NO usar caché
          const response = await authPermissionService.getUserPermissions();
          if (response.success && response.data) {
            const { modules } = response.data;
            return modules.includes(module.toLowerCase());
          }
          return false;
        } catch (error) {
          console.error("Error verificando módulo:", error);
          return false;
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // NO persistir tokens - estos se manejan via SecurityService
        // NO persistir permisos ni módulos - siempre deben consultarse dinámicamente
      }),
    }
  )
);
// Función para inicializar el estado de autenticación al cargar la página
export const initializeAuth = async () => {
  const { initializeFromSecurityService } = useAuthStore.getState();
  // Usar el método del store que maneja SecurityService correctamente
  await initializeFromSecurityService();
};
// Hook para verificar si el usuario está autenticado
export const useIsAuthenticated = () => {
  return useAuthStore((state) => state.isAuthenticated);
};
// Hook para obtener el usuario actual
export const useCurrentUser = () => {
  return useAuthStore((state) => state.user);
};
// Hook para obtener acciones de autenticación
export const useAuthActions = () => {
  return useAuthStore((state) => ({
    login: state.login,
    register: state.register,
    logout: state.logout,
    getCurrentUser: state.getCurrentUser,
    updateUser: state.updateUser,
    clearError: state.clearError,
  }));
};
// Hook para verificar permisos
export const usePermissions = () => {
  return useAuthStore((state) => ({
    hasPermission: state.hasPermission, // Deprecado
    canAccessModule: state.canAccessModule, // Deprecado
    hasPermissionAsync: state.hasPermissionAsync, // Nueva función dinámica
    canAccessModuleAsync: state.canAccessModuleAsync, // Nueva función dinámica
  }));
};
