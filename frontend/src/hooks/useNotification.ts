import { useToast as useToastContext } from "../contexts/ToastContext";

/**
 * Hook unificado para notificaciones en todo el sistema
 * Usa el ToastContext nativo del sistema para mantener consistencia UI
 */
export const useNotification = () => {
  const toastContext = useToastContext();

  return {
    success: (message: string, description?: string) =>
      toastContext.success(message, description),
    error: (message: string, description?: string) =>
      toastContext.error(message, description),
    info: (message: string, description?: string) =>
      toastContext.info(message, description),
    warning: (message: string, description?: string) =>
      toastContext.warning(message, description),
  };
};

// Para compatibilidad con el código existente que usa useToast
export const useToast = () => {
  const notification = useNotification();

  return {
    success: notification.success,
    error: notification.error,
    info: notification.info,
    warning: notification.warning,
  };
};
