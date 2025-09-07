// DEPRECATED: Usar useToast del ToastContext en su lugar
// Este archivo se mantiene por compatibilidad temporal

import { useToast as useToastContext } from "../contexts/ToastContext";

type ToastProps = {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
};

const useToast = () => {
  const toastContext = useToastContext();

  const toast = ({ title, description, variant = "default" }: ToastProps) => {
    if (variant === "destructive") {
      toastContext.error(title, description);
    } else {
      toastContext.success(title, description);
    }
  };

  return { toast };
};

export { useToast };
