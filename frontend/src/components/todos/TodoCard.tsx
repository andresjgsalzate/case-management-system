import React, { useState, useEffect } from "react";
import { Todo } from "../../types/todo.types";
import { TodoTimeModal } from "./TodoTimeModal";
import { Button } from "../ui/Button";
import { ActionIcon } from "../ui/ActionIcons";
import { useToast } from "../../contexts/ToastContext";
import { useConfirmationModal } from "../../hooks/useConfirmationModal";
import { ConfirmationModal } from "../ui/ConfirmationModal";

interface TodoCardProps {
  todo: Todo;
  onStartTimer?: (todoId: string) => Promise<void>;
  onPauseTimer?: (todoId: string) => Promise<void>;
  onComplete?: (todoId: string) => Promise<void>;
  onEdit?: (todo: Todo) => void;
  onDelete?: (todoId: string) => Promise<void>;
  onArchive?: (todo: Todo) => Promise<void>;
  showActions?: boolean;
}

export const TodoCard: React.FC<TodoCardProps> = ({
  todo,
  onStartTimer,
  onPauseTimer,
  onComplete,
  onEdit,
  onDelete,
  onArchive,
  showActions = true,
}) => {
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [currentSessionTime, setCurrentSessionTime] =
    useState<string>("00:00:00");

  const { success, error: showErrorToast } = useToast();
  const { confirmDelete, modalState, modalHandlers } = useConfirmationModal();

  // El estado del timer viene directamente del backend
  const isTimerRunning = todo.control?.isTimerActive || false;

  // Timer en tiempo real para la sesión actual
  useEffect(() => {
    let interval: number;

    if (isTimerRunning && todo.control?.timerStartAt) {
      interval = window.setInterval(() => {
        const start = new Date(todo.control!.timerStartAt!);
        const now = new Date();
        const diff = Math.floor((now.getTime() - start.getTime()) / 1000);

        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;

        setCurrentSessionTime(
          `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        );
      }, 1000);
    } else {
      setCurrentSessionTime("00:00:00");
    }

    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [isTimerRunning, todo.control?.timerStartAt]);

  const getPriorityColor = (level: number): string => {
    switch (level) {
      case 1:
        return "#10B981"; // Verde - Muy Baja
      case 2:
        return "#06B6D4"; // Cian - Baja
      case 3:
        return "#F59E0B"; // Amarillo - Media
      case 4:
        return "#EF4444"; // Rojo - Alta
      case 5:
        return "#DC2626"; // Rojo oscuro - Muy Alta
      default:
        return "#6B7280"; // Gris
    }
  };

  const getBorderColor = (): string => {
    if (todo.isCompleted) return "border-l-green-500";
    if (isTimerRunning) return "border-l-yellow-500";
    if (isOverdue()) return "border-l-red-500";
    return `border-l-[${getPriorityColor(todo.priority?.level || 1)}]`;
  };

  const isOverdue = (): boolean => {
    if (!todo.dueDate || todo.isCompleted) return false;
    return new Date(todo.dueDate) < new Date();
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleStartTimer = async () => {
    if (onStartTimer) {
      await onStartTimer(todo.id);
    }
  };

  const handlePauseTimer = async () => {
    if (onPauseTimer) {
      await onPauseTimer(todo.id);
    }
  };

  const handleComplete = async () => {
    if (onComplete) {
      await onComplete(todo.id);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirmDelete("TODO");
    if (confirmed) {
      if (onDelete) {
        try {
          await onDelete(todo.id);
          success("TODO eliminado exitosamente");
        } catch (error) {
          showErrorToast("Error al eliminar el TODO");
        }
      }
    }
  };

  return (
    <div
      className={`
        bg-white dark:bg-gray-800 rounded-lg border-l-4 shadow-sm hover:shadow-md transition-shadow
        ${todo.isCompleted ? "opacity-75" : ""}
        ${getBorderColor()}
      `}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3
                className={`font-medium text-gray-900 dark:text-white ${
                  todo.isCompleted ? "line-through" : ""
                }`}
              >
                {todo.title}
              </h3>
            </div>
            {todo.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {todo.description}
              </p>
            )}
          </div>

          {/* Status Badge */}
          <span
            className={`
              px-2 py-1 text-xs font-medium rounded-full
              ${
                todo.isCompleted
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : isTimerRunning
                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
              }
            `}
          >
            {todo.isCompleted
              ? "Completado"
              : isTimerRunning
              ? "En curso"
              : "Pendiente"}
          </span>
        </div>

        {/* Metadata */}
        <div className="space-y-2 mb-4">
          {/* Prioridad */}
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <div
              className="w-3 h-3 rounded-full mr-2"
              style={{
                backgroundColor: getPriorityColor(todo.priority?.level || 1),
              }}
            />
            <span>{todo.priority?.name || "Sin prioridad"}</span>
            {todo.priority?.level && (
              <span className="ml-1 text-xs">
                (Nivel {todo.priority.level})
              </span>
            )}
          </div>

          {/* Usuario asignado */}
          {todo.assignedUser && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <ActionIcon action="user" size="sm" className="mr-2" />
              <span>
                {todo.assignedUser.fullName || todo.assignedUser.email}
              </span>
            </div>
          )}

          {/* Fecha límite */}
          {todo.dueDate && (
            <div
              className={`flex items-center text-sm ${
                isOverdue()
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              <ActionIcon action="calendar" size="sm" className="mr-2" />
              <span>{formatDate(todo.dueDate)}</span>
              {isOverdue() && (
                <ActionIcon
                  action="warning"
                  size="sm"
                  color="danger"
                  className="ml-1"
                />
              )}
            </div>
          )}

          {/* Tiempo */}
          {todo.control && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <ActionIcon action="time" size="sm" className="mr-2" />
              <span>
                {formatTime(todo.control.totalTimeMinutes || 0)}
                {todo.estimatedMinutes && todo.estimatedMinutes > 0 && (
                  <span className="text-xs ml-1">
                    / {formatTime(todo.estimatedMinutes)} estimado
                  </span>
                )}
              </span>
              {isTimerRunning && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border border-green-200 dark:border-green-700">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse" />
                  <span className="font-mono">+{currentSessionTime}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2">
              {/* Timer Controls */}
              {todo.control && !todo.isCompleted && (
                <>
                  {isTimerRunning ? (
                    <Button
                      onClick={handlePauseTimer}
                      variant="secondary"
                      size="sm"
                    >
                      <ActionIcon action="pause" size="sm" className="mr-1" />
                      Pausar
                    </Button>
                  ) : (
                    <Button
                      onClick={handleStartTimer}
                      variant="secondary"
                      size="sm"
                    >
                      <ActionIcon action="play" size="sm" className="mr-1" />
                      Reanudar
                    </Button>
                  )}
                </>
              )}

              {/* Complete Button */}
              {todo.control && !todo.isCompleted && (
                <Button onClick={handleComplete} variant="success" size="sm">
                  <ActionIcon action="check" size="sm" className="mr-1" />
                  Completar
                </Button>
              )}

              {/* Create Control Button */}
              {!todo.control && !todo.isCompleted && (
                <Button
                  onClick={handleStartTimer}
                  variant="primary"
                  size="sm"
                  className="inline-flex items-center"
                >
                  <ActionIcon action="play" size="sm" className="mr-1" />
                  Comenzar
                </Button>
              )}
            </div>

            {/* Menu Actions */}
            <div className="flex space-x-1">
              {/* Ver detalles de tiempo */}
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setShowTimeModal(true)}
                className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-1"
                title="Ver detalles de tiempo"
              >
                <ActionIcon action="view" size="sm" />
              </Button>

              {/* Editar */}
              {onEdit && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => onEdit(todo)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                  title="Editar TODO"
                >
                  <ActionIcon action="edit" size="sm" />
                </Button>
              )}

              {/* Eliminar */}
              {onDelete && !todo.isCompleted && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={handleDelete}
                  className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1"
                  title="Eliminar TODO"
                >
                  <ActionIcon action="delete" size="sm" />
                </Button>
              )}

              {/* Archivar */}
              {onArchive && todo.isCompleted && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => onArchive(todo)}
                  className="text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 p-1"
                  title="Archivar TODO"
                >
                  <ActionIcon action="archive" size="sm" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Time Details Modal */}
      {showTimeModal && (
        <TodoTimeModal
          isOpen={showTimeModal}
          onClose={() => setShowTimeModal(false)}
          todoId={todo.id}
          todoTitle={todo.title}
        />
      )}

      {/* Modal de confirmación */}
      <ConfirmationModal
        isOpen={modalState.isOpen}
        onClose={modalHandlers.onClose}
        onConfirm={modalHandlers.onConfirm}
        title={modalState.options?.title || ""}
        message={modalState.options?.message || ""}
        confirmText={modalState.options?.confirmText}
        cancelText={modalState.options?.cancelText}
        type={modalState.options?.type}
      />
    </div>
  );
};
