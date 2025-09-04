import React, { useState, useEffect } from "react";
import {
  XMarkIcon,
  PlusIcon,
  TagIcon,
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { NoteFormData } from "../../types/note.types";

interface NoteFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NoteFormData) => void;
  initialData?: Partial<NoteFormData>;
  isEdit?: boolean;
  loading?: boolean;
  users?: Array<{ id: string; fullName?: string; email: string }>;
  cases?: Array<{ id: string; numeroCaso: string; descripcion: string }>;
}

export const NoteForm: React.FC<NoteFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEdit = false,
  loading = false,
  users = [],
  cases = [],
}) => {
  const [formData, setFormData] = useState<NoteFormData>({
    title: "",
    content: "",
    tags: [],
    caseId: "",
    assignedTo: "",
    isImportant: false,
    reminderDate: "",
  });

  const [newTag, setNewTag] = useState("");
  const [caseSearch, setCaseSearch] = useState("");
  const [showCaseDropdown, setShowCaseDropdown] = useState(false);
  const [reminderDateOnly, setReminderDateOnly] = useState("");
  const [reminderTimeOnly, setReminderTimeOnly] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          title: initialData.title || "",
          content: initialData.content || "",
          tags: initialData.tags || [],
          caseId: initialData.caseId || "",
          assignedTo: initialData.assignedTo || "",
          isImportant: initialData.isImportant || false,
          reminderDate: initialData.reminderDate || "",
        });

        // Inicializar búsqueda de casos
        if (initialData.caseId) {
          const selectedCase = cases.find((c) => c.id === initialData.caseId);
          setCaseSearch(selectedCase?.numeroCaso || "");
        }

        // Separar fecha y hora del recordatorio
        if (initialData.reminderDate) {
          const reminderDateTime = new Date(initialData.reminderDate);
          setReminderDateOnly(reminderDateTime.toISOString().slice(0, 10));
          setReminderTimeOnly(reminderDateTime.toISOString().slice(11, 16));
        }
      } else {
        // Limpiar formulario para nueva nota
        setFormData({
          title: "",
          content: "",
          tags: [],
          caseId: "",
          assignedTo: "",
          isImportant: false,
          reminderDate: "",
        });
        setCaseSearch("");
        setReminderDateOnly("");
        setReminderTimeOnly("");
      }
    }
  }, [isOpen, initialData, cases]);

  // Actualizar reminderDate cuando cambie fecha u hora
  useEffect(() => {
    if (reminderDateOnly && reminderTimeOnly) {
      const combinedDateTime = `${reminderDateOnly}T${reminderTimeOnly}:00.000Z`;
      setFormData((prev) => ({ ...prev, reminderDate: combinedDateTime }));
    } else if (!reminderDateOnly && !reminderTimeOnly) {
      setFormData((prev) => ({ ...prev, reminderDate: "" }));
    }
  }, [reminderDateOnly, reminderTimeOnly]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      return;
    }
    onSubmit(formData);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleCaseSearch = (value: string) => {
    setCaseSearch(value);
    setShowCaseDropdown(value.length > 0);

    // Si el valor está vacío, limpiar la selección
    if (!value) {
      setFormData((prev) => ({ ...prev, caseId: "" }));
    }
  };

  const handleCaseSelect = (selectedCase: {
    id: string;
    numeroCaso: string;
    descripcion: string;
  }) => {
    setFormData((prev) => ({ ...prev, caseId: selectedCase.id }));
    setCaseSearch(selectedCase.numeroCaso);
    setShowCaseDropdown(false);
  };

  const filteredCases = cases.filter(
    (caseItem) =>
      caseItem.numeroCaso.toLowerCase().includes(caseSearch.toLowerCase()) ||
      caseItem.descripcion.toLowerCase().includes(caseSearch.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEdit ? "Editar Nota" : "Nueva Nota"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Título *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Título de la nota"
              required
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contenido *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, content: e.target.value }))
              }
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Contenido de la nota..."
              required
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <TagIcon className="h-4 w-4 inline mr-1" />
              Etiquetas
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), handleAddTag())
                }
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Agregar etiqueta"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Case Selection */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <DocumentTextIcon className="h-4 w-4 inline mr-1" />
              Caso Asociado
            </label>
            <input
              type="text"
              value={caseSearch}
              onChange={(e) => handleCaseSearch(e.target.value)}
              onFocus={() => setShowCaseDropdown(caseSearch.length > 0)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Buscar caso por número o descripción"
            />
            {showCaseDropdown && filteredCases.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {filteredCases.slice(0, 10).map((caseItem) => (
                  <button
                    key={caseItem.id}
                    type="button"
                    onClick={() => handleCaseSelect(caseItem)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {caseItem.numeroCaso}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {caseItem.descripcion}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Assigned User */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <UserIcon className="h-4 w-4 inline mr-1" />
              Asignar a Usuario
            </label>
            <select
              value={formData.assignedTo}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, assignedTo: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Seleccionar usuario (opcional)</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName || user.email}
                </option>
              ))}
            </select>
          </div>

          {/* Reminder Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <ClockIcon className="h-4 w-4 inline mr-1" />
              Recordatorio
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  value={reminderDateOnly}
                  onChange={(e) => setReminderDateOnly(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Hora
                </label>
                <input
                  type="time"
                  value={reminderTimeOnly}
                  onChange={(e) => setReminderTimeOnly(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Important */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isImportant"
              checked={formData.isImportant}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  isImportant: e.target.checked,
                }))
              }
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
            <label
              htmlFor="isImportant"
              className="ml-2 text-sm text-gray-700 dark:text-gray-300"
            >
              Marcar como importante
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={
                loading || !formData.title.trim() || !formData.content.trim()
              }
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Guardando..." : isEdit ? "Actualizar" : "Crear Nota"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
