import React, { useState } from "react";
import {
  PlusIcon,
  ChartBarIcon,
  ArchiveBoxIcon,
} from "@heroicons/react/24/outline";
import { Note, NoteFilters } from "../../types/note.types";
import {
  useNotes,
  useNotesStats,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
  useToggleArchiveNote,
} from "../../hooks/useNotes";
import { NoteCard } from "../../components/notes/NoteCard";
import { NoteFormModal } from "../../components/notes/NoteFormModal";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../contexts/ToastContext";
import { useConfirmationModal } from "../../hooks/useConfirmationModal";
import { ConfirmationModal } from "../../components/ui/ConfirmationModal";

export const NotesPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [currentFilters, setCurrentFilters] = useState<NoteFilters>({
    isArchived: false, // Por defecto excluir notas archivadas
  });
  const [viewMode, setViewMode] = useState<
    "all" | "my" | "assigned" | "important" | "archived"
  >("all");

  // Usar hooks para obtener datos
  const {
    data: notes = [],
    isLoading: notesLoading,
    error: notesError,
  } = useNotes(currentFilters);
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useNotesStats();
  const createNoteMutation = useCreateNote();
  const updateNoteMutation = useUpdateNote();
  const deleteNoteMutation = useDeleteNote();
  const toggleArchiveMutation = useToggleArchiveNote();

  const { success, error: showErrorToast } = useToast();
  const { confirmDelete, modalState, modalHandlers } = useConfirmationModal();

  // Mock data for users and cases - In real app, these would come from API calls

  // Extraer tags únicos cuando las notas cambian

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setShowForm(true);
  };

  const handleCreateNote = async (noteData: Partial<Note>) => {
    try {
      await createNoteMutation.mutateAsync({
        ...noteData,
        // TODO: Obtener el ID del usuario actual desde el contexto de autenticación
        authorId: "7c1b05d7-d98e-4543-ac27-dd1c797517e6", // Placeholder
      } as Note);
      success("Nota creada exitosamente");
      handleCloseForm();
    } catch (error) {
      showErrorToast("Error al crear la nota");
    }
  };

  const handleUpdateNote = async (noteData: Partial<Note>) => {
    if (!editingNote) return;
    try {
      await updateNoteMutation.mutateAsync({
        id: editingNote.id,
        data: {
          id: editingNote.id,
          title: noteData.title,
          content: noteData.content,
        },
      });
      success("Nota actualizada exitosamente");
      handleCloseForm();
    } catch (error) {
      showErrorToast("Error al actualizar la nota");
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingNote(null);
  };

  const handleViewModeChange = async (mode: typeof viewMode) => {
    setViewMode(mode);

    let filters: NoteFilters = {};

    // TODO: Obtener el ID del usuario actual desde el contexto de autenticación
    const currentUserId = "7c1b05d7-d98e-4543-ac27-dd1c797517e6"; // Placeholder

    switch (mode) {
      case "all":
        filters = { isArchived: false };
        break;
      case "my":
        filters = { isArchived: false, createdBy: currentUserId };
        break;
      case "assigned":
        filters = { isArchived: false, assignedTo: currentUserId };
        break;
      case "important":
        filters = { isArchived: false, isImportant: true };
        break;
      case "archived":
        filters = { isArchived: true };
        break;
    }

    setCurrentFilters(filters);
  };

  const handleDeleteNote = async (note: Note) => {
    const confirmed = await confirmDelete("nota");
    if (!confirmed) {
      return;
    }

    try {
      await deleteNoteMutation.mutateAsync(note.id);
      success("Nota eliminada exitosamente");
    } catch (error) {
      console.error("Error deleting note:", error);
      showErrorToast("Error al eliminar la nota");
    }
  };

  const handleArchiveNote = async (note: Note) => {
    try {
      await toggleArchiveMutation.mutateAsync(note.id);
      success(
        note.isArchived
          ? "Nota desarchivada exitosamente"
          : "Nota archivada exitosamente"
      );
    } catch (error) {
      console.error("Error archiving note:", error);
      showErrorToast(
        "Error al " +
          (note.isArchived ? "desarchivar" : "archivar") +
          " la nota"
      );
    }
  };

  const handleUnarchiveNote = async (note: Note) => {
    try {
      await toggleArchiveMutation.mutateAsync(note.id);
      success("Nota desarchivada exitosamente");
    } catch (error) {
      console.error("Error unarchiving note:", error);
      showErrorToast("Error al desarchivar la nota");
    }
  };

  // Loading state
  if (notesLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-6"></div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6 mb-8">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 bg-gray-300 dark:bg-gray-700 rounded"
                ></div>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-32 bg-gray-300 dark:bg-gray-700 rounded"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (notesError || statsError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
              Error al cargar las notas
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {(notesError as Error)?.message ||
                (statsError as Error)?.message ||
                "Ha ocurrido un error inesperado"}
            </p>
            <Button onClick={() => window.location.reload()} variant="primary">
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Gestión de Notas
            </h1>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              Administra y organiza todas las notas del sistema
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button onClick={() => setShowForm(true)} variant="primary">
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Nueva Nota
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6 mb-8">
            <div
              className={`bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                viewMode === "all" ? "ring-2 ring-indigo-500" : ""
              }`}
              onClick={() => handleViewModeChange("all")}
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Total
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-white">
                        {stats.totalNotes || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                viewMode === "my" ? "ring-2 ring-indigo-500" : ""
              }`}
              onClick={() => handleViewModeChange("my")}
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Mis Notas
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-white">
                        {stats.myNotes || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                viewMode === "assigned" ? "ring-2 ring-indigo-500" : ""
              }`}
              onClick={() => handleViewModeChange("assigned")}
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-6 w-6 text-purple-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Asignadas
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-white">
                        {stats.assignedNotes || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                viewMode === "important" ? "ring-2 ring-indigo-500" : ""
              }`}
              onClick={() => handleViewModeChange("important")}
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-6 w-6 text-red-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Importantes
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-white">
                        {stats.importantNotes || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                viewMode === "all" ? "ring-2 ring-indigo-500" : ""
              }`}
              onClick={() => handleViewModeChange("all")}
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Recordatorios
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-white">
                        {stats.withReminders || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                viewMode === "archived" ? "ring-2 ring-indigo-500" : ""
              }`}
              onClick={() => handleViewModeChange("archived")}
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ArchiveBoxIcon className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Archivadas
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-white">
                        {stats.archivedNotes || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6">
          <div className="flex space-x-2 mb-4">
            <Button
              onClick={() => handleViewModeChange("all")}
              variant={viewMode === "all" ? "primary" : "secondary"}
              size="sm"
            >
              Todas las notas
            </Button>
            <Button
              onClick={() => handleViewModeChange("my")}
              variant={viewMode === "my" ? "primary" : "secondary"}
              size="sm"
            >
              Mis notas
            </Button>
            <Button
              onClick={() => handleViewModeChange("assigned")}
              variant={viewMode === "assigned" ? "primary" : "secondary"}
              size="sm"
            >
              Asignadas a mí
            </Button>
            <Button
              onClick={() => handleViewModeChange("important")}
              variant={viewMode === "important" ? "primary" : "secondary"}
              size="sm"
            >
              Importantes
            </Button>
            <Button
              onClick={() => handleViewModeChange("archived")}
              variant={viewMode === "archived" ? "primary" : "secondary"}
              size="sm"
            >
              Archivadas
            </Button>
          </div>

          {/* TODO: Implementar componente NotesSearch */}
          {/* <NotesSearch
            onSearch={handleSearch}
            onReset={handleResetSearch}
            availableTags={existingTags}
            users={users}
            cases={cases}
          /> */}
        </div>

        {/* Notes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={handleEditNote}
              onDelete={handleDeleteNote}
              onArchive={handleArchiveNote}
              onUnarchive={handleUnarchiveNote}
              currentUserId={undefined}
              canEdit={true}
              canDelete={true}
              canArchive={true}
            />
          ))}
        </div>

        {/* Empty state */}
        {notes.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 text-gray-400 dark:text-gray-500">
              <ChartBarIcon className="h-24 w-24" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No hay notas
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Comienza creando una nueva nota.
            </p>
            <div className="mt-6">
              <Button onClick={() => setShowForm(true)} variant="primary">
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Nueva Nota
              </Button>
            </div>
          </div>
        )}

        {/* Note Form Modal */}
        <NoteFormModal
          isOpen={showForm}
          onClose={handleCloseForm}
          onSave={editingNote ? handleUpdateNote : handleCreateNote}
          note={editingNote}
          isLoading={
            createNoteMutation.isPending || updateNoteMutation.isPending
          }
        />

        {/* Modal de confirmación */}
        <ConfirmationModal
          isOpen={modalState.isOpen}
          onClose={modalHandlers.onClose}
          onConfirm={modalHandlers.onConfirm}
          title={modalState.options?.title || ""}
          message={modalState.options?.message || ""}
          confirmText={modalState.options?.confirmText}
          cancelText={modalState.options?.cancelText}
          type={modalState.options?.type}
        />
      </div>
    </div>
  );
};
