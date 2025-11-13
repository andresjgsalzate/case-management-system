import React, { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { ActionIcon } from "../ui/ActionIcons";

interface TaskDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (description: string) => void;
  title: string;
  isLoading?: boolean;
  timeRegistered?: string;
}

const MIN_CHARACTERS = 100;

export const TaskDescriptionModal: React.FC<TaskDescriptionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  title,
  isLoading = false,
  timeRegistered,
}) => {
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setDescription("");
      setError("");
    }
  }, [isOpen]);

  const handleSave = () => {
    if (description.trim().length < MIN_CHARACTERS) {
      setError(
        `La descripción debe tener al menos ${MIN_CHARACTERS} caracteres`
      );
      return;
    }

    setError("");
    onSave(description.trim());
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    if (error && value.trim().length >= MIN_CHARACTERS) {
      setError("");
    }
  };

  const characterCount = description.trim().length;
  const isValid = characterCount >= MIN_CHARACTERS;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        {timeRegistered && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <ActionIcon action="time" size="sm" />
              <span className="font-medium">
                Tiempo registrado: {timeRegistered}
              </span>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Descripción de las tareas realizadas *
          </label>
          <textarea
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            className={`
              w-full p-3 border rounded-lg resize-none
              dark:bg-gray-700 dark:border-gray-600 dark:text-white
              focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${
                error
                  ? "border-red-500 dark:border-red-400"
                  : "border-gray-300 dark:border-gray-600"
              }
            `}
            rows={4}
            placeholder="Describe detalladamente las actividades, tareas o avances realizados durante este tiempo..."
            disabled={isLoading}
          />

          <div className="flex justify-between items-center mt-2">
            <div
              className={`text-sm ${
                characterCount < MIN_CHARACTERS
                  ? "text-red-500 dark:text-red-400"
                  : "text-green-600 dark:text-green-400"
              }`}
            >
              {characterCount}/{MIN_CHARACTERS} caracteres{" "}
              {characterCount < MIN_CHARACTERS ? "mínimos" : ""}
            </div>

            {isValid && (
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm">
                <ActionIcon action="check" size="sm" />
                <span>Válido</span>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 mt-2 text-red-500 dark:text-red-400 text-sm">
              <ActionIcon action="warning" size="sm" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-700">
          <div className="flex items-start gap-2">
            <ActionIcon
              action="info"
              size="sm"
              className="text-yellow-600 dark:text-yellow-400 mt-0.5"
            />
            <div className="text-yellow-700 dark:text-yellow-300 text-sm">
              <p className="font-medium">¿Por qué es obligatorio?</p>
              <p>
                La descripción de las tareas ayuda a mantener un registro
                detallado del trabajo realizado y facilita el seguimiento del
                progreso del caso.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!isValid || isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <ActionIcon action="loading" size="sm" className="mr-2" />
                Guardando...
              </>
            ) : (
              <>
                <ActionIcon action="save" size="sm" className="mr-2" />
                Guardar Tiempo
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
