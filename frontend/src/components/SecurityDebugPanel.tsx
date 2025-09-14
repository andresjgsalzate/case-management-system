import React, { useState, useEffect } from "react";
import { ActionIcon } from "../components/ui/ActionIcons";
import { securityService } from "../services/security.service";
import { authService } from "../services/auth.service";

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

export const SecurityDebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<SecurityDebugInfo | null>(null);
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Solo mostrar en desarrollo
  const isDevelopment =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

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
        lastActivity: debugData.lastActivity
          ? new Date(debugData.lastActivity).toLocaleTimeString()
          : "N/A",
        sessionStartTime: debugData.sessionStartTime
          ? new Date(debugData.sessionStartTime).toLocaleTimeString()
          : "N/A",
        inactivityTimeRemaining: `${Math.floor(
          debugData.inactivityTimeRemaining / 60000
        )}:${String(
          Math.floor((debugData.inactivityTimeRemaining % 60000) / 1000)
        ).padStart(2, "0")}`,
        tokensCount: debugData.tokensCount,
        encryptedTokensPreview: debugData.encryptedTokensPreview,
      });
    } catch (error) {
      console.error("Error refreshing debug info:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleManualLogout = () => {
    if (confirm("¿Estás seguro de que quieres cerrar la sesión manualmente?")) {
      securityService.clearSession();
      authService.logout();
      window.location.href = "/login";
    }
  };

  const handleClearSecureData = () => {
    if (
      confirm(
        "¿Estás seguro de que quieres limpiar todos los datos de seguridad?"
      )
    ) {
      securityService.clearSession();
      refreshDebugInfo();
    }
  };

  const handleVerifySession = async () => {
    setIsRefreshing(true);
    try {
      const tokens = securityService.getValidTokens();
      if (tokens) {
        // Verificar con el servicio de seguridad
        const hasValid = securityService.hasValidSession();
        alert(hasValid ? "Sesión válida ✅" : "Sesión inválida ❌");
      } else {
        alert("No hay tokens válidos ❌");
      }
    } catch (error) {
      alert(`Error verificando sesión: ${error}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen && isDevelopment) {
      refreshDebugInfo();
      const interval = setInterval(refreshDebugInfo, 5000); // Actualizar cada 5 segundos
      return () => clearInterval(interval);
    }
  }, [isOpen, isDevelopment]);

  // No mostrar en producción
  if (!isDevelopment) {
    return null;
  }

  return (
    <>
      {/* Botón flotante para abrir el panel */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg z-50 transition-all duration-200"
        title="Security Debug Panel"
      >
        <ActionIcon action="shield" size="md" className="text-white" />
      </button>

      {/* Modal del panel de debug */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <ActionIcon
                  action="shield"
                  size="lg"
                  className="text-blue-600"
                />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Security Debug Panel
                </h2>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                  DEV ONLY
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <ActionIcon action="close" size="sm" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Status Overview */}
              {debugInfo && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    {debugInfo.isSessionValid ? (
                      <ActionIcon
                        action="success"
                        size="sm"
                        className="text-green-500"
                      />
                    ) : (
                      <ActionIcon
                        action="warning"
                        size="sm"
                        className="text-red-500"
                      />
                    )}
                    <span className="text-sm">
                      Sesión:{" "}
                      <span
                        className={
                          debugInfo.isSessionValid
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {debugInfo.isSessionValid ? "Válida" : "Inválida"}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {debugInfo.hasValidTokens ? (
                      <ActionIcon
                        action="success"
                        size="sm"
                        className="text-green-500"
                      />
                    ) : (
                      <ActionIcon
                        action="warning"
                        size="sm"
                        className="text-red-500"
                      />
                    )}
                    <span className="text-sm">
                      Tokens:{" "}
                      <span
                        className={
                          debugInfo.hasValidTokens
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {debugInfo.hasValidTokens ? "Válidos" : "Inválidos"}
                      </span>
                    </span>
                  </div>
                </div>
              )}

              {/* Session Info */}
              {debugInfo && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Información de Sesión
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <ActionIcon
                        action="changePassword"
                        size="sm"
                        className="text-gray-500"
                      />
                      <span className="text-gray-600 dark:text-gray-300">
                        Huella:
                      </span>
                      <code className="text-xs bg-gray-200 dark:bg-gray-600 px-1 rounded">
                        {debugInfo.fingerprint}
                      </code>
                    </div>

                    <div className="flex items-center space-x-2">
                      <ActionIcon
                        action="time"
                        size="sm"
                        className="text-gray-500"
                      />
                      <span className="text-gray-600 dark:text-gray-300">
                        Última actividad:
                      </span>
                      <span className="font-mono text-xs">
                        {debugInfo.lastActivity}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <ActionIcon
                        action="time"
                        size="sm"
                        className="text-gray-500"
                      />
                      <span className="text-gray-600 dark:text-gray-300">
                        Inicio sesión:
                      </span>
                      <span className="font-mono text-xs">
                        {debugInfo.sessionStartTime}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <ActionIcon
                        action="warning"
                        size="sm"
                        className="text-gray-500"
                      />
                      <span className="text-gray-600 dark:text-gray-300">
                        Tiempo restante:
                      </span>
                      <span className="font-mono text-xs font-semibold">
                        {debugInfo.inactivityTimeRemaining}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Encrypted Data Preview */}
              {debugInfo && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Datos Encriptados
                    </h3>
                    <button
                      onClick={() => setShowSensitiveData(!showSensitiveData)}
                      className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                      {showSensitiveData ? (
                        <ActionIcon action="hide" size="sm" />
                      ) : (
                        <ActionIcon action="view" size="sm" />
                      )}
                      <span>{showSensitiveData ? "Ocultar" : "Mostrar"}</span>
                    </button>
                  </div>

                  <div className="text-sm space-y-2">
                    <div>
                      <span className="text-gray-600 dark:text-gray-300">
                        Tokens almacenados:
                      </span>
                      <span className="ml-2 font-semibold">
                        {debugInfo.tokensCount}
                      </span>
                    </div>

                    {showSensitiveData && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-300">
                          Preview encriptado:
                        </span>
                        <div className="mt-1 p-2 bg-gray-200 dark:bg-gray-600 rounded text-xs font-mono break-all">
                          {debugInfo.encryptedTokensPreview}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={refreshDebugInfo}
                  disabled={isRefreshing}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                >
                  <ActionIcon
                    action="loading"
                    size="sm"
                    className={
                      isRefreshing ? "animate-spin text-white" : "text-white"
                    }
                  />
                  <span>Actualizar</span>
                </button>

                <button
                  onClick={handleVerifySession}
                  disabled={isRefreshing}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
                >
                  <ActionIcon
                    action="success"
                    size="sm"
                    className="text-white"
                  />
                  <span>Verificar Sesión</span>
                </button>

                <button
                  onClick={handleClearSecureData}
                  className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                >
                  <ActionIcon
                    action="delete"
                    size="sm"
                    className="text-white"
                  />
                  <span>Limpiar Datos</span>
                </button>

                <button
                  onClick={handleManualLogout}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <ActionIcon
                    action="logout"
                    size="sm"
                    className="text-white"
                  />
                  <span>Logout Manual</span>
                </button>
              </div>

              {/* Info Footer */}
              <div className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-600 pt-4">
                <p>⚠️ Este panel solo es visible en modo desarrollo.</p>
                <p>
                  🔒 Los datos sensibles están encriptados y no son accesibles
                  desde la consola.
                </p>
                <p>
                  🔄 La información se actualiza automáticamente cada 5
                  segundos.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SecurityDebugPanel;
