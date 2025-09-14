import React, { useState } from "react";
import { useServerStatus } from "../../hooks/useServerStatus";
import { ActionIcon } from "../../components/ui/ActionIcons";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

export const SystemStatusPage: React.FC = () => {
  const { isOnline, lastChecked, responseTime, error, manualCheck } =
    useServerStatus(10000); // Check cada 10 segundos
  const [isChecking, setIsChecking] = useState(false);
  const [healthData, setHealthData] = useState<any>(null);

  const handleManualCheck = async () => {
    setIsChecking(true);
    try {
      const status = await manualCheck();

      // Si el servidor está online, obtener datos detallados de health
      if (status.isOnline) {
        const response = await fetch("http://localhost:3000/api/health");
        if (response.ok) {
          const data = await response.json();
          setHealthData(data);
        }
      }
    } catch (error) {
      console.error("Error checking server status:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Estado del Sistema
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitoreo en tiempo real del servidor backend
          </p>
        </div>

        <Button
          onClick={handleManualCheck}
          disabled={isChecking}
          className="flex items-center gap-2"
        >
          <ActionIcon
            action="loading"
            size="sm"
            className={isChecking ? "animate-spin" : ""}
          />
          {isChecking ? "Verificando..." : "Verificar Estado"}
        </Button>
      </div>

      {/* Estado Principal */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div
            className={`p-3 rounded-full ${
              isOnline
                ? "bg-green-100 dark:bg-green-900/20"
                : "bg-red-100 dark:bg-red-900/20"
            }`}
          >
            {isOnline ? (
              <ActionIcon action="success" size="xl" color="green" />
            ) : (
              <ActionIcon action="warning" size="xl" color="red" />
            )}
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Servidor Backend
            </h2>
            <p
              className={`text-lg font-medium ${
                isOnline
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {isOnline
                ? "En línea y funcionando"
                : "Desconectado o con problemas"}
            </p>

            {responseTime && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Tiempo de respuesta: {responseTime}ms
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <h3 className="font-medium text-red-800 dark:text-red-200 mb-1">
              Error de conexión
            </h3>
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
      </Card>

      {/* Detalles del Servidor */}
      {isOnline && healthData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Información del Sistema */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <ActionIcon action="server" size="lg" color="blue" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Información del Sistema
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Estado:
                </span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {healthData.status}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Versión:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {healthData.version}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Entorno:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {healthData.environment}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Timestamp:
                </span>
                <span className="font-medium text-gray-900 dark:text-white text-sm">
                  {new Date(healthData.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          </Card>

          {/* Métricas de Rendimiento */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <ActionIcon action="cpu" size="lg" color="purple" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Rendimiento
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Uptime:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatUptime(healthData.uptime)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Memoria Usada:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {healthData.memory?.used} MB
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Memoria Total:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {healthData.memory?.total} MB
                </span>
              </div>

              {healthData.memory && (
                <div className="mt-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">
                      Uso de memoria
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {Math.round(
                        (healthData.memory.used / healthData.memory.total) * 100
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          (healthData.memory.used / healthData.memory.total) *
                            100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Estado de Conexión */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <ActionIcon action="time" size="lg" color="orange" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Estado de Conexión
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Última verificación
            </p>
            <p className="font-medium text-gray-900 dark:text-white">
              {lastChecked.toLocaleTimeString()}
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              URL del servidor
            </p>
            <p className="font-medium text-gray-900 dark:text-white">
              http://localhost:3000
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Estado</p>
            <p
              className={`font-medium ${
                isOnline
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {isOnline ? "Conectado" : "Desconectado"}
            </p>
          </div>
        </div>
      </Card>

      {/* Ayuda para Solución de Problemas */}
      {!isOnline && (
        <Card className="p-6 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
          <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-3">
            ¿Problemas de conexión?
          </h3>
          <div className="space-y-2 text-sm text-yellow-700 dark:text-yellow-300">
            <p>
              • Verifica que el servidor backend esté corriendo en el puerto
              3000
            </p>
            <p>
              • Ejecuta{" "}
              <code className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
                npm run dev
              </code>{" "}
              en la carpeta del backend
            </p>
            <p>• Revisa la consola del servidor para errores</p>
            <p>• Confirma que no hay otro proceso usando el puerto 3000</p>
          </div>
        </Card>
      )}
    </div>
  );
};
