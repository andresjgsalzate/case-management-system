import React from "react";
import { ActionIcon } from "../ui/ActionIcons";
import { Note } from "../../types/note.types";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "../ui/Button";

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
  onArchive: (note: Note) => void;
  onUnarchive: (note: Note) => void;
  currentUserId?: string;
  canEdit?: boolean;
  canDelete?: boolean;
  canArchive?: boolean;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onEdit,
  onDelete,
  onArchive,
  onUnarchive,
  currentUserId,
  canEdit = true,
  canDelete = true,
  canArchive = true,
}) => {
  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: es,
    });
  };

  const formatReminderDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isReminderActive = (reminderDate: string) => {
    return new Date(reminderDate) <= new Date();
  };

  const canUserEdit =
    canEdit && (!currentUserId || note.createdBy === currentUserId);
  const canUserDelete =
    canDelete && (!currentUserId || note.createdBy === currentUserId);

  return (
    <div
      id={`note-${note.id}`}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border ${
        note.isImportant
          ? "border-red-200 dark:border-red-800"
          : "border-gray-200 dark:border-gray-700"
      } hover:shadow-md transition-shadow`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {note.title}
              </h3>
              {note.isImportant && (
                <ActionIcon
                  action="warning"
                  size="sm"
                  color="danger"
                  className="flex-shrink-0"
                />
              )}
              {note.isArchived && (
                <ActionIcon
                  action="archive"
                  size="sm"
                  color="neutral"
                  className="flex-shrink-0"
                />
              )}
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <ActionIcon action="user" size="sm" className="flex-shrink-0" />
                <span className="truncate">
                  {note.createdByUser?.fullName ||
                    note.createdByUser?.email ||
                    "Usuario desconocido"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <ActionIcon action="time" size="sm" className="flex-shrink-0" />
                <span className="whitespace-nowrap">
                  {formatDate(note.createdAt)}
                </span>
              </div>
              {note.updatedAt !== note.createdAt && (
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  Editado {formatDate(note.updatedAt)}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {canUserEdit && (
              <Button
                onClick={() => onEdit(note)}
                variant="ghost"
                size="xs"
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title="Editar nota"
              >
                <ActionIcon action="edit" size="xs" />
              </Button>
            )}

            {canArchive && (
              <Button
                onClick={() =>
                  note.isArchived ? onUnarchive(note) : onArchive(note)
                }
                variant="ghost"
                size="xs"
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title={note.isArchived ? "Desarchivar nota" : "Archivar nota"}
              >
                {note.isArchived ? (
                  <ActionIcon action="restore" size="xs" />
                ) : (
                  <ActionIcon action="archive" size="xs" />
                )}
              </Button>
            )}

            {canUserDelete && (
              <Button
                onClick={() => onDelete(note)}
                variant="ghost"
                size="xs"
                className="p-1.5 text-gray-400 hover:text-red-500"
                title="Eliminar nota"
              >
                <ActionIcon action="delete" size="xs" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Content Preview */}
        <div className="mb-4">
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap line-clamp-3">
            {note.content}
          </p>
        </div>

        {/* Case Info */}
        {note.case && (
          <div className="flex items-center gap-2 mb-4 p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <ActionIcon action="document" size="sm" color="neutral" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Caso: <span className="font-medium">{note.case.numeroCaso}</span>
              {note.case.descripcion && <span> - {note.case.descripcion}</span>}
            </span>
          </div>
        )}

        {/* Assigned User */}
        {note.assignedToUser && note.assignedToUser.id !== note.createdBy && (
          <div className="flex items-center gap-2 mb-4">
            <ActionIcon action="user" size="sm" color="neutral" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Asignado a:{" "}
              <span className="font-medium">
                {note.assignedToUser.fullName || note.assignedToUser.email}
              </span>
            </span>
          </div>
        )}

        {/* Reminder */}
        {note.reminderDate && (
          <div
            className={`flex items-center gap-2 p-2 rounded mb-4 ${
              isReminderActive(note.reminderDate)
                ? "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200"
                : "bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
            }`}
          >
            <ActionIcon action="time" size="sm" />
            <span className="text-sm">
              Recordatorio: {formatReminderDate(note.reminderDate)}
              {isReminderActive(note.reminderDate) && (
                <span className="ml-2 font-medium">¡Activo!</span>
              )}
              {note.isReminderSent && (
                <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                  (Enviado)
                </span>
              )}
            </span>
          </div>
        )}

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {note.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              >
                <ActionIcon action="tag" size="xs" className="mr-1" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer - Archived info */}
      {note.isArchived && note.archivedAt && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-b-lg border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <ActionIcon action="archive" size="sm" />
            <span>
              Archivado {formatDate(note.archivedAt)}
              {note.archivedByUser && (
                <span>
                  {" "}
                  por{" "}
                  {note.archivedByUser.fullName || note.archivedByUser.email}
                </span>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
