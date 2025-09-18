import React, { useEffect } from "react";
import { CloseIcon } from "./ActionIcons";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  /**
   * 🔒 OPCIONES DE SEGURIDAD PARA EL MODAL
   *
   * Estas opciones permiten crear modales que requieren interacción humana explícita,
   * previniendo cierre automático por bots o scripts maliciosos.
   *
   * Úsalas cuando necesites validar presencia humana real, como en:
   * - Confirmaciones de sesión críticas
   * - Alertas de seguridad importantes
   * - Procesos que no deben interrumpirse accidentalmente
   *
   * @example
   * // Modal de seguridad crítica (como InactivityWarningModal)
   * <Modal
   *   isOpen={isOpen}
   *   onClose={() => {}} // Función vacía - no se puede cerrar automáticamente
   *   title="🔐 Confirmación Requerida"
   *   security={{
   *     preventBackdropClose: true,
   *     preventEscapeClose: true,
   *     hideCloseButton: true,
   *     criticalMode: true,
   *   }}
   * >
   *   <p>Esta ventana requiere interacción humana explícita</p>
   *   <Button onClick={handleUserAction}>Confirmar Acción</Button>
   * </Modal>
   *
   * @example
   * // Modal normal (comportamiento predeterminado)
   * <Modal isOpen={isOpen} onClose={handleClose} title="Modal Normal">
   *   <p>Este modal se puede cerrar normalmente</p>
   * </Modal>
   */
  security?: {
    /** Previene que el modal se cierre haciendo clic en el backdrop */
    preventBackdropClose?: boolean;
    /** Previene que el modal se cierre con la tecla Escape */
    preventEscapeClose?: boolean;
    /** Oculta el botón X de cierre */
    hideCloseButton?: boolean;
    /** Aplica estilos de modal crítico (borde rojo, fondo más oscuro) */
    criticalMode?: boolean;
  };
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "lg",
  security = {},
}) => {
  const {
    preventBackdropClose = false,
    preventEscapeClose = false,
    hideCloseButton = false,
    criticalMode = false,
  } = security;

  // Manejar tecla Escape
  useEffect(() => {
    if (!isOpen || preventEscapeClose) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, preventEscapeClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    "2xl": "max-w-6xl",
  };

  // Función para manejar clic en backdrop
  const handleBackdropClick = () => {
    if (!preventBackdropClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className={`fixed inset-0 transition-opacity ${
            criticalMode ? "bg-black bg-opacity-75" : "bg-black bg-opacity-50"
          }`}
          onClick={handleBackdropClick}
        />

        {/* Modal Content */}
        <div
          className={`relative bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full ${
            sizeClasses[size]
          } max-h-[90vh] overflow-hidden ${
            criticalMode ? "border-4 border-red-500 dark:border-red-400" : ""
          }`}
        >
          {/* Header */}
          {title && (
            <div
              className={`flex items-center ${
                hideCloseButton ? "justify-center" : "justify-between"
              } p-6 border-b border-gray-200 dark:border-gray-700 ${
                criticalMode ? "bg-red-50 dark:bg-red-900/20" : ""
              }`}
            >
              <h2
                className={`text-xl font-semibold ${
                  criticalMode
                    ? "text-red-800 dark:text-red-200"
                    : "text-gray-900 dark:text-white"
                }`}
              >
                {title}
              </h2>
              {!hideCloseButton && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                >
                  <CloseIcon size="lg" />
                </button>
              )}
            </div>
          )}

          {/* Body */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
