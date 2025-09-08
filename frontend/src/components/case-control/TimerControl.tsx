import React, { useState, useEffect } from "react";
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "../ui/Button";

interface TimerControlProps {
  isActive: boolean;
  startTime: string | null;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export const TimerControl: React.FC<TimerControlProps> = ({
  isActive,
  startTime,
  onStart,
  onPause,
  onStop,
  isLoading = false,
  disabled = false,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Actualizar el tiempo cada segundo cuando el timer esté activo
  useEffect(() => {
    if (!isActive || !startTime) return;

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, startTime]);

  // Calcular duración transcurrida
  const getElapsedTime = () => {
    if (!isActive || !startTime) return "00:00:00";

    const start = new Date(startTime);
    const now = currentTime;
    const diff = now.getTime() - start.getTime();

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-2">
      {/* Tiempo transcurrido */}
      {isActive && (
        <div className="flex items-center text-sm font-mono bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-md">
          <ClockIcon className="h-4 w-4 mr-1" />
          {getElapsedTime()}
        </div>
      )}

      {/* Controles del timer */}
      <div className="flex items-center gap-1">
        {!isActive ? (
          <Button
            onClick={onStart}
            disabled={disabled || isLoading}
            variant="success"
            size="sm"
            title="Iniciar timer"
          >
            <PlayIcon className="h-4 w-4" />
          </Button>
        ) : (
          <>
            <Button
              onClick={onPause}
              disabled={disabled || isLoading}
              variant="warning"
              size="sm"
              title="Pausar timer"
            >
              <PauseIcon className="h-4 w-4" />
            </Button>

            <Button
              onClick={onStop}
              disabled={disabled || isLoading}
              variant="danger"
              size="sm"
              title="Detener timer"
            >
              <StopIcon className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Indicador de carga */}
      {isLoading && (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
      )}

      {/* Información adicional cuando está inactivo */}
      {!isActive && startTime && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Pausado{" "}
          {formatDistanceToNow(new Date(startTime), {
            addSuffix: true,
            locale: es,
          })}
        </div>
      )}
    </div>
  );
};
