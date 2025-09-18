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
  const [timeUntilTimeout, setTimeUntilTimeout] = useState(0);

  const timeoutRef = useRef<number>();
  const warningTimeoutRef = useRef<number>();
  const lastActivityRef = useRef<number>(Date.now());
  const warningIntervalRef = useRef<number>();
  const countdownIntervalRef = useRef<number>();
  const showWarningRef = useRef<boolean>(false); // Ref para evitar problemas de clausura

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
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    // Resetear estado de advertencia
    setShowWarning(false);
    showWarningRef.current = false; // Sincronizar ref
    setRemainingMinutes(0);

    // Actualizar última actividad
    lastActivityRef.current = Date.now();

    if (!isAuthenticated) return;

    // Iniciar contador en tiempo real (cada segundo)
    const totalTimeMs = timeoutDuration * 60 * 1000;
    setTimeUntilTimeout(totalTimeMs);

    countdownIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const remaining = Math.max(0, totalTimeMs - elapsed);
      setTimeUntilTimeout(remaining);

      if (remaining <= 0) {
        clearInterval(countdownIntervalRef.current!);
      }
    }, 1000);

    // Timer para mostrar advertencia
    const warningTime = (timeoutDuration - warningDuration) * 60 * 1000;
    warningTimeoutRef.current = setTimeout(() => {
      console.log("⚠️ ACTIVANDO ADVERTENCIA - showWarning será true");
      setShowWarning(true);
      showWarningRef.current = true; // Sincronizar ref
      setRemainingMinutes(warningDuration);

      // Iniciar countdown para la advertencia (actualizar cada 30 segundos)
      warningIntervalRef.current = setInterval(() => {
        setRemainingMinutes((prev) => {
          if (prev <= 0.5) {
            // El timeout principal se encargará del logout
            return 0;
          }
          return prev - 0.5; // Reducir 30 segundos
        });
      }, 30000); // Actualizar cada 30 segundos

      onWarning?.();
    }, warningTime);

    // Timer para logout por inactividad
    const timeoutTime = timeoutDuration * 60 * 1000;
    timeoutRef.current = setTimeout(() => {
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

  // Función separada para actividad del usuario (NO debe funcionar durante advertencia)
  const resetTimerForActivity = useCallback(() => {
    // Usar la ref para evitar problemas de clausura
    if (showWarningRef.current) {
      console.log(
        "🚫 ACTIVIDAD IGNORADA - Modal de seguridad activo, showWarning =",
        showWarningRef.current
      );
      return;
    }

    console.log(
      "✅ ACTIVIDAD DETECTADA - Reiniciando timer, showWarning =",
      showWarningRef.current
    );
    resetTimer();
  }, [resetTimer]);
  useEffect(() => {
    // Limpiar timers si no está autenticado
    if (!isAuthenticated) {
      // Limpiar timers si no está autenticado
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (warningIntervalRef.current) clearInterval(warningIntervalRef.current);
      if (countdownIntervalRef.current)
        clearInterval(countdownIntervalRef.current);
      setShowWarning(false);
      showWarningRef.current = false; // Sincronizar ref
      setRemainingMinutes(0);
      setTimeUntilTimeout(0);
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
        resetTimerForActivity(); // Usar la función que respeta el estado de advertencia
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
      if (countdownIntervalRef.current)
        clearInterval(countdownIntervalRef.current);
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, [isAuthenticated, resetTimerForActivity]);

  const getTimeUntilTimeout = useCallback(() => {
    return timeUntilTimeout;
  }, [timeUntilTimeout]);

  const extendSession = useCallback(() => {
    console.log("🔄 EXTENDIENDO SESIÓN - Ocultando modal y reiniciando timer");
    // Forzar el reset del timer y ocultar la advertencia
    setShowWarning(false);
    showWarningRef.current = false; // Sincronizar ref
    setRemainingMinutes(0);
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
