import React, { useState, useEffect } from "react";
import { ActionIcon } from "./ui/ActionIcons";
import { useSecureAuth } from "../hooks/useSecureAuth";

interface SessionTimeoutWarningProps {
  warningThreshold?: number; // Minutos antes de expirar para mostrar warning
  className?: string;
}

export const SessionTimeoutWarning: React.FC<SessionTimeoutWarningProps> = ({
  warningThreshold = 5, // 5 minutos por defecto
  className = "",
}) => {
  const {
    isAuthenticated,
    sessionTimeRemaining,
    sessionTimeRemainingFormatted,
    logout,
  } = useSecureAuth();

  const [showWarning, setShowWarning] = useState(false);
  const [showCritical, setShowCritical] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowWarning(false);
      setShowCritical(false);
      return;
    }

    const remainingMinutes = sessionTimeRemaining / (60 * 1000);

    // Mostrar warning cuando quedan menos de X minutos
    setShowWarning(
      remainingMinutes <= warningThreshold && remainingMinutes > 2
    );

    // Mostrar crítico cuando quedan menos de 2 minutos
    setShowCritical(remainingMinutes <= 2 && remainingMinutes > 0);
  }, [sessionTimeRemaining, warningThreshold, isAuthenticated]);

  const handleExtendSession = () => {
    // En una implementación real, esto haría una llamada al backend
    // para extender la sesión o refrescar el token

    // Por ahora, simplemente ocultamos el warning
    setShowWarning(false);
    setShowCritical(false);
  };

  const handleLogoutNow = () => {
    logout();
  };

  if (!isAuthenticated) return null;

  // Crítico: menos de 2 minutos
  if (showCritical) {
    return (
      <div className={`fixed top-4 right-4 z-50 ${className}`}>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg shadow-lg p-4 max-w-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <ActionIcon action="warning" size="md" color="red" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                ⚠️ Sesión Crítica
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>Tu sesión expira en:</p>
                <p className="font-mono text-lg font-bold text-red-900 dark:text-red-100">
                  {sessionTimeRemainingFormatted}
                </p>
              </div>
              <div className="mt-3 flex space-x-2">
                <button
                  onClick={handleExtendSession}
                  className="text-xs bg-red-600 hover:bg-red-700 text-white font-medium px-3 py-1 rounded transition-colors"
                >
                  Extender
                </button>
                <button
                  onClick={handleLogoutNow}
                  className="text-xs bg-gray-600 hover:bg-gray-700 text-white font-medium px-3 py-1 rounded transition-colors"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Warning: entre 2-5 minutos
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
                <p>Tu sesión expira en {sessionTimeRemainingFormatted}</p>
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
  const {
    isAuthenticated,
    sessionTimeRemaining,
    sessionTimeRemainingFormatted,
  } = useSecureAuth();

  if (!isAuthenticated) return null;

  const remainingMinutes = sessionTimeRemaining / (60 * 1000);
  const isWarning = remainingMinutes <= 5;
  const isCritical = remainingMinutes <= 2;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <ActionIcon
        action="time"
        size="sm"
        color={isCritical ? "red" : isWarning ? "yellow" : "neutral"}
      />
      <span
        className={`text-xs font-mono ${
          isCritical
            ? "text-red-600 dark:text-red-400"
            : isWarning
            ? "text-yellow-600 dark:text-yellow-400"
            : "text-gray-600 dark:text-gray-400"
        }`}
        title="Tiempo restante de sesión"
      >
        {sessionTimeRemainingFormatted}
      </span>
    </div>
  );
};
