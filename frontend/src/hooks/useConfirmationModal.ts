import { useState, useCallback } from "react";

export interface UseConfirmationModalOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "success" | "info";
}

export interface ConfirmationModalState {
  isOpen: boolean;
  options: UseConfirmationModalOptions | null;
}

export const useConfirmationModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<UseConfirmationModalOptions | null>(
    null
  );
  const [resolvePromise, setResolvePromise] = useState<
    ((value: boolean) => void) | null
  >(null);

  const showConfirmation = useCallback(
    (modalOptions: UseConfirmationModalOptions): Promise<boolean> => {
      return new Promise((resolve) => {
        setOptions(modalOptions);
        setResolvePromise(() => resolve);
        setIsOpen(true);
      });
    },
    []
  );

  const handleConfirm = useCallback(() => {
    if (resolvePromise) {
      resolvePromise(true);
    }
    setIsOpen(false);
    setOptions(null);
    setResolvePromise(null);
  }, [resolvePromise]);

  const handleClose = useCallback(() => {
    if (resolvePromise) {
      resolvePromise(false);
    }
    setIsOpen(false);
    setOptions(null);
    setResolvePromise(null);
  }, [resolvePromise]);

  // Funciones de conveniencia
  const confirmDelete = useCallback(
    (itemName?: string): Promise<boolean> => {
      return showConfirmation({
        title: "Confirmar eliminación",
        message: itemName
          ? `¿Estás seguro de que deseas eliminar "${itemName}"? Esta acción no se puede deshacer.`
          : "¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer.",
        confirmText: "Eliminar",
        cancelText: "Cancelar",
        type: "danger",
      });
    },
    [showConfirmation]
  );

  const confirmAction = useCallback(
    (title: string, message: string): Promise<boolean> => {
      return showConfirmation({
        title,
        message,
        confirmText: "Confirmar",
        cancelText: "Cancelar",
        type: "info",
      });
    },
    [showConfirmation]
  );

  const confirmDangerAction = useCallback(
    (title: string, message: string): Promise<boolean> => {
      return showConfirmation({
        title,
        message,
        confirmText: "Continuar",
        cancelText: "Cancelar",
        type: "danger",
      });
    },
    [showConfirmation]
  );

  return {
    showConfirmation,
    confirmDelete,
    confirmAction,
    confirmDangerAction,
    // Estado del modal para que los componentes puedan renderizar el modal
    modalState: {
      isOpen,
      options,
    } as ConfirmationModalState,
    modalHandlers: {
      onConfirm: handleConfirm,
      onClose: handleClose,
    },
  };
};
