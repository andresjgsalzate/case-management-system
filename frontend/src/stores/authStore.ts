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
  clearError: () => void;
  initializeFromSecurityService: () => Promise<void>;

  // Permisos dinámicos
  loadUserPermissions: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  canAccessModule: (module: string) => boolean;
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

            // Guardar en localStorage
            localStorage.setItem("token", token);
            localStorage.setItem("refreshToken", refreshToken);
            localStorage.setItem("user", JSON.stringify(user));

            set({
              user,
              token,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
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
            localStorage.setItem("token", newToken);

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

      // Inicializar desde SecurityService
      initializeFromSecurityService: async () => {
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
              error: null,
            });

            console.log("🔄 Store inicializado desde SecurityService");

            // Cargar permisos
            await get().loadUserPermissions();
          } else {
            // No hay sesión válida, limpiar estado
            set({
              user: null,
              token: null,
              refreshToken: null,
              isAuthenticated: false,
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
            error: "Error de inicialización",
          });
        }
      },

      // Cargar permisos del usuario desde el backend
      loadUserPermissions: async () => {
        const { isLoadingPermissions, permissionsLoaded } = get();

        console.log("🔄 loadUserPermissions - Iniciando carga:", {
          isLoadingPermissions,
          permissionsLoaded,
        });

        // Evitar cargas múltiples
        if (isLoadingPermissions || permissionsLoaded) {
          console.log(
            "⏭️ loadUserPermissions - Saltando carga (ya en proceso o cargados)"
          );
          return;
        }

        console.log("🚀 loadUserPermissions - Iniciando carga de permisos...");
        set({ isLoadingPermissions: true });

        try {
          const response = await authPermissionService.getUserPermissions();
          console.log(
            "📡 loadUserPermissions - Respuesta del servidor:",
            response
          );

          if (response.success && response.data) {
            const { permissions, modules } = response.data;
            console.log(
              "✅ loadUserPermissions - Permisos cargados exitosamente:",
              {
                permissionsCount: permissions.length,
                modulesCount: modules.length,
              }
            );

            set({
              userPermissions: permissions,
              userModules: modules,
              permissionsLoaded: true,
              isLoadingPermissions: false,
            });
          } else {
            console.warn(
              "⚠️ loadUserPermissions - Respuesta no exitosa:",
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
            console.warn(
              "🚨 Token inválido o expirado. Haciendo logout automático..."
            );
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
      }, // Refrescar permisos
      refreshPermissions: async () => {
        set({ permissionsLoaded: false, isLoadingPermissions: false });
        await get().loadUserPermissions();
      },

      // Verificación de permisos completamente dinámica
      hasPermission: (permission: string) => {
        const { user, userPermissions, permissionsLoaded } = get();

        // Si no hay usuario, no tiene permisos
        if (!user) return false;

        // Si los permisos no se han cargado, retornar false
        // Los permisos deben cargarse explícitamente usando loadUserPermissions()
        if (!permissionsLoaded) {
          return false;
        }

        // Verificar si el permiso está en la lista de permisos del usuario
        return userPermissions.some((p) => p.name === permission && p.isActive);
      },

      // Verificación de módulos completamente dinámica
      canAccessModule: (module: string) => {
        const { user, userModules, permissionsLoaded } = get();

        // Si no hay usuario, no puede acceder
        if (!user) return false;

        // Si los permisos no se han cargado, retornar false
        // Los permisos deben cargarse explícitamente usando loadUserPermissions()
        if (!permissionsLoaded) {
          return false;
        }

        // Verificar si el módulo está en la lista de módulos permitidos
        return userModules.includes(module.toLowerCase());
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        userPermissions: state.userPermissions,
        userModules: state.userModules,
        permissionsLoaded: state.permissionsLoaded,
      }),
    }
  )
);

// Función para inicializar el estado de autenticación al cargar la página
export const initializeAuth = async () => {
  const { token, user, isAuthenticated, loadUserPermissions } =
    useAuthStore.getState();

  // Si hay token y usuario pero no está autenticado, restaurar el estado
  if (token && user && !isAuthenticated) {
    console.log("🔄 Inicializando auth desde localStorage...");
    useAuthStore.setState({ isAuthenticated: true });

    try {
      // Cargar permisos después de restaurar la autenticación
      await loadUserPermissions();
    } catch (error) {
      console.error("Error al cargar permisos durante inicialización:", error);
      useAuthStore.getState().logout();
    }
  }
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
    clearError: state.clearError,
  }));
};

// Hook para verificar permisos
export const usePermissions = () => {
  return useAuthStore((state) => ({
    hasPermission: state.hasPermission,
    canAccessModule: state.canAccessModule,
  }));
};
