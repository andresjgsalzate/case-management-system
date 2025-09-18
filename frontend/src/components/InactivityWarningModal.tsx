import React, { useState, useEffect } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { ActionIcon } from "./ui/ActionIcons";

/**
 * MEJORA DE SEGURIDAD - Modal de Inactividad sin Auto-cierre
 *
 * Este modal implementa las siguientes medidas de seguridad para validar presencia humana:
 *
 * 🔒 CARACTERÍSTICAS DE SEGURIDAD:
 * - Utiliza el Modal estándar del sistema con opciones de seguridad avanzadas
 * - NO se puede cerrar haciendo clic fuera del modal (preventBackdropClose: true)
 * - NO se puede cerrar con la tecla Escape (preventEscapeClose: true)
 * - NO tiene botón X de cierre automático (hideCloseButton: true)
 * - Modo crítico activado con indicadores visuales especiales (criticalMode: true)
 * - Requiere interacción humana explícita: elegir "Extender Sesión" o "Cerrar Sesión"
 *
 * 🎯 PROPÓSITO:
 * - Prevenir que bots o scripts automatizados renueven sesiones
 * - Validar que hay un usuario humano real presente
 * - Cumplir con mejores prácticas de seguridad de sesiones
 * - Mantener consistencia con el sistema de UI estándar
 *
 * 📊 INDICADORES VISUALES:
 * - Borde rojo para indicar criticidad (criticalMode)
 * - Fondo más oscuro (75% opacidad)
 * - Header con fondo rojizo y título centrado
 * - Mensajes explicativos sobre las restricciones
 * - Iconos y colores que indican la importancia de la acción
 *
 * 🛠️ IMPLEMENTACIÓN:
 * - Extiende el componente Modal estándar con opciones de seguridad
 * - Mantiene la consistencia visual y funcional del sistema
 * - Todas las mejoras de seguridad están encapsuladas en el Modal base
 */

interface InactivityWarningModalProps {
  isOpen: boolean;
  remainingMinutes: number;
  onExtendSession: () => void;
  onLogout: () => void;
}

export const InactivityWarningModal: React.FC<InactivityWarningModalProps> = ({
  isOpen,
  remainingMinutes,
  onExtendSession,
  onLogout,
}) => {
  const [timeLeft, setTimeLeft] = useState(0);

  // Contador en vivo con actualización cada segundo
  useEffect(() => {
    if (!isOpen) return;

    setTimeLeft(remainingMinutes * 60); // Convertir a segundos

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000); // Actualizar cada segundo

    return () => clearInterval(interval);
  }, [isOpen, remainingMinutes, onLogout]);

  // Formatear tiempo en MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}} // Función vacía - el modal no se puede cerrar automáticamente
      title="⚠️ Sesión por Expirar"
      size="sm"
      security={{
        preventBackdropClose: true,
        preventEscapeClose: true,
        hideCloseButton: true,
        criticalMode: true,
      }}
    >
      {/* Contador Principal */}
      <div className="text-center mb-8">
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-700 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-center mb-4">
            <ActionIcon action="time" size="xl" color="red" />
          </div>

          <h3 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-2">
            Tiempo Restante
          </h3>

          {/* Contador en Vivo */}
          <div className="text-6xl font-mono font-bold text-red-600 dark:text-red-400 mb-2">
            {formatTime(timeLeft)}
          </div>

          <p className="text-sm text-red-700 dark:text-red-300">
            Su sesión se cerrará automáticamente por inactividad
          </p>
        </div>

        {/* Mensaje Simple */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
            🔒 Esta ventana requiere confirmación manual
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
            No se cierra automáticamente para validar su presencia
          </p>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex justify-center space-x-4">
        <Button
          variant="secondary"
          onClick={onLogout}
          size="md"
          className="min-w-[120px] bg-red-100 hover:bg-red-200 text-red-800 border-red-300 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-200 dark:border-red-700"
        >
          <ActionIcon action="logout" size="sm" className="mr-2" />
          Cerrar Sesión
        </Button>

        <Button
          variant="primary"
          onClick={onExtendSession}
          size="md"
          className="min-w-[120px] bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white font-semibold animate-pulse"
        >
          <ActionIcon action="check" size="sm" className="mr-2" />
          Continuar Trabajando
        </Button>
      </div>
    </Modal>
  );
};
