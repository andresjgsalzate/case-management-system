import React from "react";
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { Modal } from "./Modal";
import { Button } from "./Button";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "success" | "info";
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  type = "info",
}) => {
  const getIcon = () => {
    switch (type) {
      case "danger":
        return <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />;
      case "success":
        return <CheckCircleIcon className="h-6 w-6 text-green-600" />;
      default:
        return <InformationCircleIcon className="h-6 w-6 text-blue-600" />;
    }
  };

  const getButtonVariant = () => {
    switch (type) {
      case "danger":
        return "danger";
      case "success":
        return "success";
      default:
        return "primary";
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex items-center space-x-3 mb-4">
        {getIcon()}
        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
          {title}
        </h3>
      </div>

      <div className="mb-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
      </div>

      <div className="flex space-x-3 justify-end">
        <Button variant="secondary" onClick={onClose}>
          {cancelText}
        </Button>
        <Button variant={getButtonVariant()} onClick={onConfirm}>
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
};
