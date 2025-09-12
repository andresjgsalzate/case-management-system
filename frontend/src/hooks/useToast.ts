import { useState, useCallback } from "react";

export interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

let toastCounter = 0;

const toasts: Toast[] = [];
const listeners: ((toasts: Toast[]) => void)[] = [];

const notifyListeners = () => {
  listeners.forEach((listener) => listener([...toasts]));
};

const addToast = (toast: Omit<Toast, "id">) => {
  const id = `toast-${++toastCounter}`;
  const newToast: Toast = {
    ...toast,
    id,
    duration: toast.duration || 5000,
  };

  toasts.push(newToast);
  notifyListeners();

  // Auto-remove toast after duration
  setTimeout(() => {
    removeToast(id);
  }, newToast.duration);
};

const removeToast = (id: string) => {
  const index = toasts.findIndex((toast) => toast.id === id);
  if (index > -1) {
    toasts.splice(index, 1);
    notifyListeners();
  }
};

export const useToast = (): ToastContextType => {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([...toasts]);

  const subscribe = useCallback((listener: (toasts: Toast[]) => void) => {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  // Subscribe to toast changes
  useState(() => {
    const unsubscribe = subscribe(setCurrentToasts);
    return unsubscribe;
  });

  return {
    toasts: currentToasts,
    addToast,
    removeToast,
  };
};

// Export helper functions for use outside of React components
export const toast = {
  success: (title: string, message: string, duration?: number) =>
    addToast({ type: "success", title, message, duration }),

  error: (title: string, message: string, duration?: number) =>
    addToast({ type: "error", title, message, duration }),

  warning: (title: string, message: string, duration?: number) =>
    addToast({ type: "warning", title, message, duration }),

  info: (title: string, message: string, duration?: number) =>
    addToast({ type: "info", title, message, duration }),
};
