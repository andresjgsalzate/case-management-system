import React from "react";
import { useServerStatus } from "../../hooks/useServerStatus";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

interface ServerStatusIndicatorProps {
  position?: "top-right" | "bottom-right" | "top-left" | "bottom-left";
  showDetails?: boolean;
}

export const ServerStatusIndicator: React.FC<ServerStatusIndicatorProps> = ({
  position = "top-right",
  showDetails = false,
}) => {
  const { isOnline, lastChecked, responseTime, error, manualCheck } =
    useServerStatus();

  const positionClasses = {
    "top-right": "top-4 right-4",
    "bottom-right": "bottom-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-left": "bottom-4 left-4",
  };

  const handleManualCheck = async () => {
    await manualCheck();
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <div className="flex items-center gap-2">
        {/* Indicador principal */}
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg backdrop-blur-sm transition-all duration-300 ${
            isOnline
              ? "bg-green-50/90 border border-green-200 text-green-800"
              : "bg-red-50/90 border border-red-200 text-red-800"
          }`}
          title={`Servidor ${isOnline ? "Online" : "Offline"}`}
        >
          {isOnline ? (
            <CheckCircleIcon className="h-4 w-4 text-green-600" />
          ) : (
            <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
          )}

          <span className="text-sm font-medium">
            {isOnline ? "Backend Online" : "Backend Offline"}
          </span>

          {responseTime && (
            <span className="text-xs opacity-75">({responseTime}ms)</span>
          )}

          {/* Botón de refresh manual */}
          <button
            onClick={handleManualCheck}
            className="ml-1 p-1 rounded-md hover:bg-white/50 transition-colors"
            title="Verificar estado del servidor"
          >
            <ArrowPathIcon className="h-3 w-3" />
          </button>
        </div>

        {/* Detalles expandidos */}
        {showDetails && (
          <div
            className={`px-3 py-2 rounded-lg shadow-lg backdrop-blur-sm border text-xs ${
              isOnline
                ? "bg-green-50/90 border-green-200 text-green-700"
                : "bg-red-50/90 border-red-200 text-red-700"
            }`}
          >
            <div>Última verificación: {lastChecked.toLocaleTimeString()}</div>
            {error && <div className="mt-1 text-red-600">Error: {error}</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServerStatusIndicator;
