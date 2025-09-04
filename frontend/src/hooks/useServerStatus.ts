import { useState, useEffect } from "react";

interface ServerStatus {
  isOnline: boolean;
  lastChecked: Date;
  responseTime?: number;
  error?: string;
}

export const useServerStatus = (checkInterval: number = 30000) => {
  const [status, setStatus] = useState<ServerStatus>({
    isOnline: false,
    lastChecked: new Date(),
  });

  const checkServerHealth = async (): Promise<ServerStatus> => {
    const startTime = Date.now();

    try {
      const response = await fetch("http://localhost:3000/api/health", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Timeout de 5 segundos
        signal: AbortSignal.timeout(5000),
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        await response.json(); // Verificar que la respuesta es JSON válido
        return {
          isOnline: true,
          lastChecked: new Date(),
          responseTime,
        };
      } else {
        return {
          isOnline: false,
          lastChecked: new Date(),
          responseTime,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        isOnline: false,
        lastChecked: new Date(),
        responseTime,
        error: error instanceof Error ? error.message : "Error de conexión",
      };
    }
  };

  const manualCheck = async () => {
    const newStatus = await checkServerHealth();
    setStatus(newStatus);
    return newStatus;
  };

  useEffect(() => {
    // Check inicial
    checkServerHealth().then(setStatus);

    // Check periódico
    const interval = setInterval(async () => {
      const newStatus = await checkServerHealth();
      setStatus(newStatus);
    }, checkInterval);

    return () => clearInterval(interval);
  }, [checkInterval]);

  return {
    ...status,
    manualCheck,
  };
};
