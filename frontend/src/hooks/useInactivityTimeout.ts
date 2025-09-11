import { useEffect, useRef, useCallback, useState } from "react";
import { useAuthStore } from "../stores/authStore";

interface UseInactivityTimeoutProps {
  timeoutDuration?: number; // en minutos
  warningDuration?: number; // en minutos antes del timeout para mostrar advertencia
  onWarning?: () => void;
  onTimeout?: () => void;
}

export const useInactivityTimeout = ({
  timeoutDuration = 30, // 30 minutos por defecto
  warningDuration = 5, // 5 minutos de advertencia
  onWarning,
  onTimeout,
}: UseInactivityTimeoutProps = {}) => {
  const logout = useAuthStore((state) => state.logout);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [showWarning, setShowWarning] = useState(false);
  const [remainingMinutes, setRemainingMinutes] = useState(0);

  const timeoutRef = useRef<number>();
  const warningTimeoutRef = useRef<number>();
  const lastActivityRef = useRef<number>(Date.now());
  const warningIntervalRef = useRef<number>();

  const resetTimer = useCallback(() => {
    // Limpiar timers existentes
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    if (warningIntervalRef.current) {
      clearInterval(warningIntervalRef.current);
    }

    // Resetear estado de advertencia
    setShowWarning(false);
    setRemainingMinutes(0);

    // Actualizar última actividad
    lastActivityRef.current = Date.now();

    if (!isAuthenticated) return;

    // Timer para mostrar advertencia
    const warningTime = (timeoutDuration - warningDuration) * 60 * 1000;
    warningTimeoutRef.current = setTimeout(() => {
      console.log("⚠️ Advertencia de inactividad - sesión expirará pronto");
      setShowWarning(true);
      setRemainingMinutes(warningDuration);

      // Iniciar countdown para la advertencia
      warningIntervalRef.current = setInterval(() => {
        setRemainingMinutes((prev) => {
          if (prev <= 1) {
            // El timeout principal se encargará del logout
            return 0;
          }
          return prev - 1;
        });
      }, 60000); // Actualizar cada minuto

      onWarning?.();
    }, warningTime);

    // Timer para logout por inactividad
    const timeoutTime = timeoutDuration * 60 * 1000;
    timeoutRef.current = setTimeout(() => {
      console.log("🔒 Timeout por inactividad - cerrando sesión");
      setShowWarning(false);
      onTimeout?.();
      logout();
    }, timeoutTime);

    // Timer reiniciado silenciosamente
  }, [
    timeoutDuration,
    warningDuration,
    isAuthenticated,
    logout,
    onWarning,
    onTimeout,
  ]);

  useEffect(() => {
    if (!isAuthenticated) {
      // Limpiar timers si no está autenticado
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (warningIntervalRef.current) clearInterval(warningIntervalRef.current);
      setShowWarning(false);
      setRemainingMinutes(0);
      return;
    }

    // Eventos que indican actividad del usuario
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    // Throttle para evitar demasiadas llamadas
    let throttleTimer: number;
    const throttledResetTimer = () => {
      if (!throttleTimer) {
        resetTimer();
        throttleTimer = setTimeout(() => {
          throttleTimer = null as any;
        }, 1000); // Throttle de 1 segundo
      }
    };

    // Agregar listeners de actividad
    activityEvents.forEach((event) => {
      document.addEventListener(event, throttledResetTimer, true);
    });

    // Inicializar timer
    resetTimer();

    // Cleanup
    return () => {
      activityEvents.forEach((event) => {
        document.removeEventListener(event, throttledResetTimer, true);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (warningIntervalRef.current) clearInterval(warningIntervalRef.current);
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, [isAuthenticated, resetTimer]);

  const getTimeUntilTimeout = useCallback(() => {
    const timeSinceLastActivity = Date.now() - lastActivityRef.current;
    const timeoutTime = timeoutDuration * 60 * 1000;
    const remainingTime = Math.max(0, timeoutTime - timeSinceLastActivity);
    return Math.ceil(remainingTime / (60 * 1000)); // retorna minutos restantes
  }, [timeoutDuration]);

  const extendSession = useCallback(() => {
    console.log("🔄 Sesión extendida por el usuario");
    resetTimer();
  }, [resetTimer]);

  return {
    showWarning,
    remainingMinutes,
    resetTimer,
    getTimeUntilTimeout,
    extendSession,
    isActive: !showWarning,
  };
};
