import React from "react";
import {
  PencilIcon,
  TrashIcon,
  ArchiveBoxIcon,
  ArchiveBoxXMarkIcon,
  ClockIcon,
  TagIcon,
  UserIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { ExclamationTriangleIcon as ExclamationTriangleSolid } from "@heroicons/react/24/solid";
import { Note } from "../../types/note.types";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

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

  const isReminderActive = (reminderDate: string) => {
    const now = new Date();
    const reminder = new Date(reminderDate);
    return reminder > now && !note.isReminderSent;
  };

  const canUserEdit =
    canEdit && (!currentUserId || note.createdBy === currentUserId);
  const canUserDelete =
    canDelete && (!currentUserId || note.createdBy === currentUserId);

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border ${
        note.isImportant
          ? "border-red-200 dark:border-red-800"
          : "border-gray-200 dark:border-gray-700"
      } hover:shadow-md transition-shadow`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {note.title}
              </h3>
              {note.isImportant && (
                <ExclamationTriangleSolid className="h-5 w-5 text-red-500" />
              )}
              {note.isArchived && (
                <ArchiveBoxIcon className="h-5 w-5 text-gray-400" />
              )}
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <UserIcon className="h-4 w-4" />
                <span>
                  {note.createdByUser?.fullName ||
                    note.createdByUser?.email ||
                    "Usuario desconocido"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <ClockIcon className="h-4 w-4" />
                <span>{formatDate(note.createdAt)}</span>
              </div>
              {note.updatedAt !== note.createdAt && (
                <span className="text-xs text-gray-400">
                  Editado {formatDate(note.updatedAt)}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {canUserEdit && (
              <button
                onClick={() => onEdit(note)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Editar nota"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            )}

            {canArchive && (
              <button
                onClick={() =>
                  note.isArchived ? onUnarchive(note) : onArchive(note)
                }
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title={note.isArchived ? "Desarchivar nota" : "Archivar nota"}
              >
                {note.isArchived ? (
                  <ArchiveBoxXMarkIcon className="h-4 w-4" />
                ) : (
                  <ArchiveBoxIcon className="h-4 w-4" />
                )}
              </button>
            )}

            {canUserDelete && (
              <button
                onClick={() => onDelete(note)}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                title="Eliminar nota"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Content Preview */}
        <div className="mb-4">
          <p className="text-gray-700 dark:text-gray-300 line-clamp-3">
            {note.content}
          </p>
        </div>

        {/* Case Info */}
        {note.case && (
          <div className="flex items-center gap-2 mb-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
            <DocumentTextIcon className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-blue-800 dark:text-blue-200">
              Caso: <span className="font-medium">{note.case.numeroCaso}</span>
              {note.case.descripcion && (
                <span className="text-blue-600 dark:text-blue-300">
                  {" "}
                  - {note.case.descripcion}
                </span>
              )}
            </span>
          </div>
        )}

        {/* Assigned User */}
        {note.assignedToUser && note.assignedToUser.id !== note.createdBy && (
          <div className="flex items-center gap-2 mb-4">
            <UserIcon className="h-4 w-4 text-gray-500" />
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
            <ClockIcon className="h-4 w-4" />
            <span className="text-sm">
              Recordatorio:{" "}
              {new Date(note.reminderDate).toLocaleString("es-ES")}
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
          <div className="flex items-center gap-2 flex-wrap">
            <TagIcon className="h-4 w-4 text-gray-500" />
            {note.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Archive info */}
        {note.isArchived && note.archivedAt && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <ArchiveBoxIcon className="h-4 w-4" />
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
    </div>
  );
};
