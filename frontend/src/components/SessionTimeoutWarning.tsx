import React, { useState, useEffect } from "react";
import { ActionIcon } from "./ui/ActionIcons";
import { useSecureAuth } from "../hooks/useSecureAuth";
import { securityService } from "../services/security.service";

interface SessionTimeoutWarningProps {
  warningThreshold?: number; // Minutos antes de expirar para mostrar warning
  className?: string;
}

export const SessionTimeoutWarning: React.FC<SessionTimeoutWarningProps> = ({
  warningThreshold = 3, // 3 minutos por defecto
  className = "",
}) => {
  const { isAuthenticated, logout, extendSession } = useSecureAuth();

  const [showWarning, setShowWarning] = useState(false);
  const [currentTimeFormatted, setCurrentTimeFormatted] = useState("");

  // Función para formatear tiempo
  const formatTime = (timeMs: number) => {
    if (timeMs <= 0) return "Expirada";
    const minutes = Math.floor(timeMs / 60000);
    const seconds = Math.floor((timeMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Efecto para actualizar el tiempo en tiempo real
  useEffect(() => {
    if (!isAuthenticated) {
      setShowWarning(false);
      setCurrentTimeFormatted("");
      return;
    }

    // Actualizar inmediatamente
    const updateTime = () => {
      const timeRemaining = securityService.getTimeUntilInactivityTimeout();
      setCurrentTimeFormatted(formatTime(timeRemaining));

      // Si no hay tiempo de sesión disponible (sesión ya expirada), no mostrar advertencias
      if (timeRemaining <= 0) {
        setShowWarning(false);
        return;
      }

      const remainingMinutes = timeRemaining / (60 * 1000);

      // Warning amarillo: cuando queden 5 minutos o menos
      const willShowWarning =
        remainingMinutes <= warningThreshold && remainingMinutes > 0;

      setShowWarning(willShowWarning);
    };

    // Actualizar inmediatamente
    updateTime();

    // Actualizar cada segundo para tiempo en vivo
    const intervalId = setInterval(updateTime, 1000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, warningThreshold]);

  const handleExtendSession = () => {
    // Extender la sesión usando el SecurityService
    const success = extendSession();

    if (success) {
      // Ocultar warnings si se extendió exitosamente
      setShowWarning(false);
    } else {
      // Si no se pudo extender, cerrar sesión
      logout();
    }
  };

  if (!isAuthenticated) return null;

  // Warning: cuando queden 2 minutos o menos
  if (showWarning) {
    return (
      <div className={`fixed top-4 right-4 z-50 ${className}`}>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg shadow-lg p-4 max-w-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <ActionIcon action="time" size="md" color="yellow" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                🕐 Sesión por Expirar
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>Tu sesión expira en {currentTimeFormatted}</p>
                <p className="mt-1 text-xs">¿Deseas continuar trabajando?</p>
              </div>
              <div className="mt-3 flex space-x-2">
                <button
                  onClick={handleExtendSession}
                  className="text-xs bg-yellow-600 hover:bg-yellow-700 text-white font-medium px-3 py-1 rounded transition-colors"
                >
                  Continuar
                </button>
                <button
                  onClick={() => setShowWarning(false)}
                  className="text-xs text-yellow-700 dark:text-yellow-300 hover:text-yellow-900 dark:hover:text-yellow-100 font-medium transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

/**
 * Componente compacto para mostrar en la barra de navegación
 */
export const SessionTimeDisplay: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  const { isAuthenticated } = useSecureAuth();
  const [currentTime, setCurrentTime] = useState("");
  const [status, setStatus] = useState<"normal" | "warning" | "critical">(
    "normal"
  );

  // Formatear tiempo
  const formatTime = (timeMs: number) => {
    if (timeMs <= 0) return "Expirada";
    const minutes = Math.floor(timeMs / 60000);
    const seconds = Math.floor((timeMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentTime("");
      setStatus("normal");
      return;
    }

    const updateTime = () => {
      const timeRemaining = securityService.getTimeUntilInactivityTimeout();
      setCurrentTime(formatTime(timeRemaining));

      const remainingMinutes = timeRemaining / (60 * 1000);
      if (remainingMinutes <= 3) {
        setStatus("warning"); // Warning amarillo cuando quedan 3 minutos o menos
      } else {
        setStatus("normal");
      }
    };

    updateTime();
    const intervalId = setInterval(updateTime, 1000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <ActionIcon
        action="time"
        size="sm"
        color={status === "warning" ? "yellow" : "neutral"}
      />
      <span
        className={`text-xs font-mono ${
          status === "warning"
            ? "text-yellow-600 dark:text-yellow-400"
            : "text-gray-600 dark:text-gray-400"
        }`}
        title="Tiempo restante de sesión"
      >
        {currentTime}
      </span>
    </div>
  );
};
