import React, { createContext, useContext, useEffect, ReactNode } from "react";
import { useAuthStore, initializeAuth } from "../stores/authStore";

interface User {
  id: string;
  email: string;
  fullName: string;
  roleName: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  clearError: () => void;
  hasPermission: (permission: string) => boolean; // Deprecado
  canAccessModule: (module: string) => boolean; // Deprecado
  hasPermissionAsync: (permission: string) => Promise<boolean>; // Nueva función dinámica
  canAccessModuleAsync: (module: string) => Promise<boolean>; // Nueva función dinámica
  refreshPermissions: () => Promise<void>; // Nueva función para recargar permisos
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    updateUser,
    clearError,
    hasPermission,
    canAccessModule,
    hasPermissionAsync,
    canAccessModuleAsync,
    refreshTokens,
    refreshPermissions,
  } = useAuthStore();

  // Efecto para inicializar la autenticación
  useEffect(() => {
    const initializeAuthState = async () => {
      try {
        // Usar la función de inicialización del store
        await initializeAuth();
      } catch (error) {
        console.error("Error durante inicialización de auth:", error);
        logout();
      }
    };

    initializeAuthState();
  }, [logout]);

  // Efecto para configurar interceptor de token refresh
  useEffect(() => {
    if (token && isAuthenticated) {
      // Configurar un interceptor para refrescar el token automáticamente
      const interceptor = setInterval(async () => {
        try {
          await refreshTokens();
        } catch (error) {
          console.error("Error refreshing token:", error);
        }
      }, 14 * 60 * 1000); // Refrescar cada 14 minutos

      return () => clearInterval(interceptor);
    }
  }, [token, isAuthenticated, refreshTokens]);

  const contextValue: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    updateUser,
    clearError,
    hasPermission,
    canAccessModule,
    hasPermissionAsync,
    canAccessModuleAsync,
    refreshPermissions,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
