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
        await initializeFromSecurityService();
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

    // Si la sesión no es válida pero estamos autenticados, cerrar sesión inmediatamente
    if (isAuthenticated && !hasValidSession) {
      logout();
      return false;
    }

    if (!isAuthenticated && hasValidSession) {
      // Hay una sesión válida pero el store no está actualizado
      // Solo log en caso de debug, normalmente esto es esperado durante la inicialización
      // console.log("✅ Sesión válida encontrada pero store no actualizado");
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
   * Obtiene el tiempo restante de la sesión usando el SecurityService directamente
   */
  const getSessionTimeRemaining = useCallback(() => {
    return securityService.getTimeUntilInactivityTimeout();
  }, []);

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
      console.log(
        "🎯 USEAUTH: Callback onSessionExpired ejecutado - haciendo logout"
      );
      logout();
    };

    const handleTokenRefreshed = (_newToken: string) => {
      // TODO: Manejar token actualizado
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
    }, 5000); // Verificar cada 5 segundos para mejor responsividad del warning

    return () => clearInterval(intervalId);
  }, [isAuthenticated, checkSessionValidity]);

  /**
   * Extiende la sesión manualmente
   */
  const extendSession = useCallback(() => {
    return securityService.extendSession();
  }, []);

  return {
    // Estado
    user,
    isAuthenticated: isAuthenticated && securityService.hasValidSession(),

    // Métodos de autenticación
    login: secureLogin,
    logout: secureLogout,
    extendSession,

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
