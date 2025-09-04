import React, { useState, useEffect } from "react";
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

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

  const buttonClass =
    "inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

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
          <button
            onClick={onStart}
            disabled={disabled || isLoading}
            className={`${buttonClass} bg-green-600 hover:bg-green-700 text-white focus:ring-green-500`}
            title="Iniciar timer"
          >
            <PlayIcon className="h-4 w-4" />
          </button>
        ) : (
          <>
            <button
              onClick={onPause}
              disabled={disabled || isLoading}
              className={`${buttonClass} bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500`}
              title="Pausar timer"
            >
              <PauseIcon className="h-4 w-4" />
            </button>

            <button
              onClick={onStop}
              disabled={disabled || isLoading}
              className={`${buttonClass} bg-red-600 hover:bg-red-700 text-white focus:ring-red-500`}
              title="Detener timer"
            >
              <StopIcon className="h-4 w-4" />
            </button>
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
