import React, { useState, useEffect } from "react";
import { ActionIcon } from "../../components/ui/ActionIcons";
import { securityService } from "../../services/security.service";
import { authService } from "../../services/auth.service";

interface SecurityDebugInfo {
  isSessionValid: boolean;
  hasValidTokens: boolean;
  fingerprint: string;
  lastActivity: string;
  sessionStartTime: string;
  inactivityTimeRemaining: string;
  tokensCount: number;
  encryptedTokensPreview: string;
}

/**
 * Página de administración para debug de seguridad
 * Solo accesible para administradores del sistema
 */
export const SecurityDebugPage: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<SecurityDebugInfo | null>(null);
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Función para formatear tiempo en milisegundos a MM:SS
  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const refreshDebugInfo = async () => {
    setIsRefreshing(true);
    try {
      const debugData = securityService.getDebugInfo();

      if (!debugData) {
        setDebugInfo({
          isSessionValid: false,
          hasValidTokens: false,
          fingerprint: "N/A",
          lastActivity: "N/A",
          sessionStartTime: "N/A",
          inactivityTimeRemaining: "0:00",
          tokensCount: 0,
          encryptedTokensPreview: "No data",
        });
        return;
      }

      setDebugInfo({
        isSessionValid: debugData.isSessionValid,
        hasValidTokens: debugData.hasValidTokens,
        fingerprint: debugData.fingerprint.substring(0, 16) + "...",
        lastActivity: new Date(debugData.lastActivity).toLocaleString(),
        sessionStartTime: new Date(debugData.sessionStartTime).toLocaleString(),
        inactivityTimeRemaining: formatTime(debugData.inactivityTimeRemaining),
        tokensCount: debugData.tokensCount,
        encryptedTokensPreview: showSensitiveData
          ? debugData.encryptedTokensPreview
          : debugData.encryptedTokensPreview.substring(0, 20) + "...",
      });
    } catch (error) {
      console.error("Error al obtener información de debug:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleManualLogout = async () => {
    if (
      window.confirm("¿Estás seguro de que quieres cerrar sesión manualmente?")
    ) {
      try {
        await authService.logout();
        window.location.href = "/login";
      } catch (error) {
        console.error("Error al cerrar sesión:", error);
      }
    }
  };

  const clearSecurityData = () => {
    if (
      window.confirm(
        "¿Estás seguro de que quieres limpiar todos los datos de seguridad?"
      )
    ) {
      securityService.clearSession();
      refreshDebugInfo();
    }
  };

  // Cargar información al montar el componente
  useEffect(() => {
    refreshDebugInfo();

    // Auto-actualizar cada 10 segundos
    const interval = setInterval(refreshDebugInfo, 10000);
    return () => clearInterval(interval);
  }, [showSensitiveData]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Debug de Seguridad
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Panel de depuración para monitorear el estado del sistema de seguridad
          y autenticación.
        </p>
      </div>

      {/* Controles */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={refreshDebugInfo}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md transition-colors"
        >
          <ActionIcon
            action="settings"
            size="sm"
            className={`text-white ${isRefreshing ? "animate-spin" : ""}`}
          />
          {isRefreshing ? "Actualizando..." : "Actualizar"}
        </button>

        <button
          onClick={() => setShowSensitiveData(!showSensitiveData)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md transition-colors"
        >
          <ActionIcon
            action={showSensitiveData ? "hide" : "view"}
            size="sm"
            className="text-white"
          />
          {showSensitiveData ? "Ocultar Datos" : "Mostrar Datos"}
        </button>

        <button
          onClick={clearSecurityData}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
        >
          <ActionIcon action="delete" size="sm" className="text-white" />
          Limpiar Datos
        </button>

        <button
          onClick={handleManualLogout}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
        >
          <ActionIcon action="logout" size="sm" className="text-white" />
          Logout Manual
        </button>
      </div>

      {/* Panel de información */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        {debugInfo ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Estado de Seguridad
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Sesión Válida:
                  </span>
                  <span
                    className={`font-semibold ${
                      debugInfo.isSessionValid
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {debugInfo.isSessionValid ? "Sí" : "No"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Tokens Válidos:
                  </span>
                  <span
                    className={`font-semibold ${
                      debugInfo.hasValidTokens
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {debugInfo.hasValidTokens ? "Sí" : "No"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Fingerprint:
                  </span>
                  <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
                    {debugInfo.fingerprint}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Cantidad de Tokens:
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {debugInfo.tokensCount}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Última Actividad:
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {debugInfo.lastActivity}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Inicio de Sesión:
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {debugInfo.sessionStartTime}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Tiempo Restante:
                  </span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {debugInfo.inactivityTimeRemaining}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <span className="font-medium text-gray-700 dark:text-gray-300 block mb-2">
                    Tokens Encriptados:
                  </span>
                  <pre className="text-xs text-gray-600 dark:text-gray-400 font-mono break-all">
                    {debugInfo.encryptedTokensPreview}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <ActionIcon
              action="loading"
              size="lg"
              className="text-gray-400 animate-spin mx-auto mb-4"
            />
            <p className="text-gray-500 dark:text-gray-400">
              Cargando información de seguridad...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityDebugPage;
