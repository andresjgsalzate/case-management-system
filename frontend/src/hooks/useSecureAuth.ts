import { useEffect, useCallback } from "react";
import { useAuthStore } from "../stores/authStore";
import { securityService } from "../services/security.service";

/**
 * Hook personalizado para manejar autenticación segura
 *
 * Funcionalidades:
 * - Verificación automática de sesión al cargar
 * - Manejo de expiración por inactividad
 * - Sincronización con SecurityService
 * - Logout automático en caso de compromiso de seguridad
 */
export const useSecureAuth = () => {
  const {
    user,
    isAuthenticated,
    logout,
    login,
    initializeFromSecurityService,
  } = useAuthStore();

  /**
   * Inicializa la autenticación desde el SecurityService al montar el hook
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log("🔧 Inicializando autenticación desde SecurityService...");
        await initializeFromSecurityService();
        console.log("✅ Autenticación inicializada correctamente");
      } catch (error) {
        console.warn("⚠️ Error inicializando autenticación:", error);
      }
    };

    initializeAuth();
  }, [initializeFromSecurityService]);

  /**
   * Verifica si la sesión actual es válida
   */
  const checkSessionValidity = useCallback(() => {
    const hasValidSession = securityService.hasValidSession();

    if (isAuthenticated && !hasValidSession) {
      // Sesión comprometida o expirada
      console.warn("🚨 Sesión inválida detectada - Cerrando sesión");
      logout();
      return false;
    }

    if (!isAuthenticated && hasValidSession) {
      // Hay una sesión válida pero el store no está actualizado
      console.log("🔄 Sesión válida encontrada - Sincronizando estado");
      return true;
    }

    return hasValidSession;
  }, [isAuthenticated, logout]);

  /**
   * Obtiene información de la sesión actual
   */
  const getSessionInfo = useCallback(() => {
    return securityService.getSessionInfo();
  }, []);

  /**
   * Fuerza el logout seguro
   */
  const secureLogout = useCallback(() => {
    securityService.clearSession();
    logout();
  }, [logout]);

  /**
   * Login seguro que utiliza SecurityService
   */
  const secureLogin = useCallback(
    async (email: string, password: string) => {
      try {
        await login(email, password);
        return true;
      } catch (error) {
        console.error("Error en login seguro:", error);
        return false;
      }
    },
    [login]
  );

  /**
   * Verifica si el usuario tiene actividad reciente
   */
  const hasRecentActivity = useCallback(() => {
    const sessionInfo = getSessionInfo();
    if (!sessionInfo) return false;

    const timeSinceActivity = Date.now() - sessionInfo.lastActivity.getTime();
    const ACTIVITY_THRESHOLD = 5 * 60 * 1000; // 5 minutos

    return timeSinceActivity < ACTIVITY_THRESHOLD;
  }, [getSessionInfo]);

  /**
   * Obtiene el tiempo restante de la sesión
   */
  const getSessionTimeRemaining = useCallback(() => {
    const sessionInfo = getSessionInfo();
    if (!sessionInfo) return 0;

    const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutos
    const timeSinceActivity = Date.now() - sessionInfo.lastActivity.getTime();

    return Math.max(0, INACTIVITY_TIMEOUT - timeSinceActivity);
  }, [getSessionInfo]);

  /**
   * Formatea el tiempo restante para mostrar al usuario
   */
  const formatSessionTimeRemaining = useCallback(() => {
    const timeRemaining = getSessionTimeRemaining();
    if (timeRemaining === 0) return "Expirada";

    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [getSessionTimeRemaining]);

  // Verificar sesión al montar el componente
  useEffect(() => {
    checkSessionValidity();
  }, [checkSessionValidity]);

  // Configurar escuchadores de SecurityService
  useEffect(() => {
    const handleSessionExpired = () => {
      console.warn("🚨 Sesión expirada por SecurityService");
      logout();
    };

    const handleTokenRefreshed = (newToken: string) => {
      console.log("🔄 Token actualizado:", newToken.substring(0, 10) + "...");
    };

    securityService.onSessionExpire(handleSessionExpired);
    securityService.onTokenRefresh(handleTokenRefreshed);

    // Cleanup no es necesario ya que SecurityService mantiene las referencias
    return () => {
      // SecurityService maneja la limpieza internamente
    };
  }, [logout]);

  // Verificar periódicamente la validez de la sesión
  useEffect(() => {
    if (!isAuthenticated) return;

    const intervalId = setInterval(() => {
      checkSessionValidity();
    }, 30000); // Verificar cada 30 segundos

    return () => clearInterval(intervalId);
  }, [isAuthenticated, checkSessionValidity]);

  return {
    // Estado
    user,
    isAuthenticated: isAuthenticated && securityService.hasValidSession(),

    // Métodos de autenticación
    login: secureLogin,
    logout: secureLogout,

    // Información de sesión
    sessionInfo: getSessionInfo(),
    hasRecentActivity: hasRecentActivity(),
    sessionTimeRemaining: getSessionTimeRemaining(),
    sessionTimeRemainingFormatted: formatSessionTimeRemaining(),

    // Utilidades
    checkSessionValidity,
    isSessionValid: securityService.hasValidSession(),
  };
};
