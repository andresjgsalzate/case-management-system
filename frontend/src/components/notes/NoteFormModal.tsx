import React, { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Note, NoteType, NotePriority } from "../../types/note.types";
import { ActionIcon } from "../ui/ActionIcons";

interface NoteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (noteData: Partial<Note>) => void;
  note?: Note | null;
  isLoading?: boolean;
}

export const NoteFormModal: React.FC<NoteFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  note,
  isLoading = false,
}) => {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [noteType, setNoteType] = useState<NoteType>(note?.noteType || "note");
  const [priority, setPriority] = useState<NotePriority>(
    note?.priority || "medium"
  );
  const [difficultyLevel, setDifficultyLevel] = useState(
    note?.difficultyLevel || 1
  );
  const [isImportant, setIsImportant] = useState(note?.isImportant || false);
  const [isTemplate, setIsTemplate] = useState(note?.isTemplate || false);
  const [reminderDate, setReminderDate] = useState(
    note?.reminderDate ? note.reminderDate.slice(0, 16) : ""
  );
  const [tags, setTags] = useState(note?.tags?.join(", ") || "");
  const [estimatedSolutionTime, setEstimatedSolutionTime] = useState(
    note?.estimatedSolutionTime || ""
  );
  const [complexityNotes, setComplexityNotes] = useState(
    note?.complexityNotes || ""
  );
  const [prerequisites, setPrerequisites] = useState(note?.prerequisites || "");

  useEffect(() => {
    if (note) {
      setTitle(note.title || "");
      setContent(note.content || "");
      setNoteType(note.noteType || "note");
      setPriority(note.priority || "medium");
      setDifficultyLevel(note.difficultyLevel || 1);
      setIsImportant(note.isImportant || false);
      setIsTemplate(note.isTemplate || false);
      setReminderDate(note.reminderDate ? note.reminderDate.slice(0, 16) : "");
      setTags(note.tags?.join(", ") || "");
      setEstimatedSolutionTime(note.estimatedSolutionTime || "");
      setComplexityNotes(note.complexityNotes || "");
      setPrerequisites(note.prerequisites || "");
    }
  }, [note]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const tagsArray = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    onSave({
      title: title.trim(),
      content: content.trim(),
      noteType,
      priority,
      difficultyLevel,
      isImportant,
      isTemplate,
      reminderDate: reminderDate || undefined,
      tags: tagsArray,
      estimatedSolutionTime: estimatedSolutionTime
        ? Number(estimatedSolutionTime)
        : undefined,
      complexityNotes: complexityNotes.trim() || undefined,
      prerequisites: prerequisites.trim() || undefined,
    });

    if (!note) {
      // Reset form only for new notes
      resetForm();
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setNoteType("note");
    setPriority("medium");
    setDifficultyLevel(1);
    setIsImportant(false);
    setIsTemplate(false);
    setReminderDate("");
    setTags("");
    setEstimatedSolutionTime("");
    setComplexityNotes("");
    setPrerequisites("");
  };

  const handleClose = () => {
    if (!note) {
      resetForm();
    }
    onClose();
  };

  const noteTypeOptions = [
    { value: "note", label: "Nota General", icon: "📝" },
    { value: "solution", label: "Solución", icon: "✅" },
    { value: "guide", label: "Guía", icon: "📖" },
    { value: "faq", label: "FAQ", icon: "❓" },
    { value: "template", label: "Plantilla", icon: "📋" },
    { value: "procedure", label: "Procedimiento", icon: "⚙️" },
  ];

  const priorityOptions = [
    {
      value: "low",
      label: "Baja",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      value: "medium",
      label: "Media",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      value: "high",
      label: "Alta",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      value: "urgent",
      label: "Urgente",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  const difficultyLabels = [
    "Muy Fácil",
    "Fácil",
    "Intermedio",
    "Difícil",
    "Muy Difícil",
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={note ? "Editar Nota" : "Nueva Nota"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Básica */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <ActionIcon action="document" size="sm" className="mr-2" />
            Información Básica
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Título *
              </label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título de la nota"
                required
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Nota
              </label>
              <select
                value={noteType}
                onChange={(e) => setNoteType(e.target.value as NoteType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {noteTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Prioridad
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as NotePriority)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contenido *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-indigo-500 dark:focus:border-indigo-500"
              placeholder="Contenido de la nota"
              required
            />
          </div>
        </div>

        {/* Configuración y Metadatos */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <ActionIcon action="info" size="sm" className="mr-2" />
            Configuración y Metadatos
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nivel de Dificultad: {difficultyLabels[difficultyLevel - 1]}
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={difficultyLevel}
                onChange={(e) => setDifficultyLevel(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tiempo Estimado (minutos)
              </label>
              <Input
                type="number"
                value={estimatedSolutionTime}
                onChange={(e) => setEstimatedSolutionTime(e.target.value)}
                placeholder="Ej: 30"
                min="1"
                className="w-full"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <ActionIcon action="tag" size="sm" className="inline mr-1" />
                Etiquetas (separadas por comas)
              </label>
              <Input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="javascript, frontend, react"
                className="w-full"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <ActionIcon
                  action="calendar"
                  size="sm"
                  className="inline mr-1"
                />
                Fecha de Recordatorio
              </label>
              <Input
                type="datetime-local"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Opciones Avanzadas */}
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Prerrequisitos
              </label>
              <textarea
                value={prerequisites}
                onChange={(e) => setPrerequisites(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Conocimientos o requisitos previos necesarios"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notas de Complejidad
              </label>
              <textarea
                value={complexityNotes}
                onChange={(e) => setComplexityNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Detalles adicionales sobre la complejidad"
              />
            </div>
          </div>

          {/* Estados y Flags */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isImportant"
                checked={isImportant}
                onChange={(e) => setIsImportant(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label
                htmlFor="isImportant"
                className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
              >
                <ActionIcon action="flag" size="sm" className="inline mr-1" />
                Marcar como importante
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isTemplate"
                checked={isTemplate}
                onChange={(e) => setIsTemplate(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label
                htmlFor="isTemplate"
                className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
              >
                <ActionIcon action="time" size="sm" className="inline mr-1" />
                Usar como plantilla
              </label>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!title.trim() || !content.trim() || isLoading}
          >
            {isLoading ? "Guardando..." : note ? "Actualizar" : "Crear Nota"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
