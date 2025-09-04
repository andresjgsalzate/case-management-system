import React, { useState, useEffect } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import {
  ExclamationTriangleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

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
  const [countdown, setCountdown] = useState(remainingMinutes);

  useEffect(() => {
    if (!isOpen) return;

    setCountdown(remainingMinutes);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 60000); // Actualizar cada minuto

    return () => clearInterval(interval);
  }, [isOpen, remainingMinutes, onLogout]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onExtendSession}
      title="Sesión por Expirar"
      size="md"
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <ExclamationTriangleIcon className="h-10 w-10 text-yellow-500" />
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Su sesión está por expirar
          </h3>

          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Por razones de seguridad, su sesión se cerrará automáticamente
              debido a inactividad.
            </p>

            <div className="flex items-center space-x-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <ClockIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Tiempo restante:{" "}
                <span className="font-bold">
                  {countdown} minuto{countdown !== 1 ? "s" : ""}
                </span>
              </span>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              ¿Qué puedes hacer?
            </h4>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <li>
                • <strong>Continuar trabajando:</strong> Haz clic en "Extender
                Sesión"
              </li>
              <li>
                • <strong>Guardar tu trabajo:</strong> Asegúrate de guardar
                cambios importantes
              </li>
              <li>
                • <strong>Cerrar sesión:</strong> Si has terminado, puedes
                cerrar manualmente
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <Button variant="secondary" onClick={onLogout} size="sm">
          Cerrar Sesión
        </Button>

        <Button
          variant="primary"
          onClick={onExtendSession}
          size="sm"
          className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
        >
          Extender Sesión (30 min más)
        </Button>
      </div>

      <div className="mt-3 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Esta medida de seguridad protege tu cuenta en caso de que olvides
          cerrar sesión
        </p>
      </div>
    </Modal>
  );
};
