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
} from "../../hooks/useNotes";
import { NoteCard } from "../../components/notes/NoteCard";

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

  // Mock data for users and cases - In real app, these would come from API calls

  // Extraer tags únicos cuando las notas cambian

  const handleDeleteNote = async (note: Note) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta nota?")) {
      return;
    }

    try {
      await deleteNoteMutation.mutateAsync(note.id);
    } catch (err) {
      console.error("Error deleting note:", err);
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setShowForm(true);
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
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              Reintentar
            </button>
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
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Nueva Nota
            </button>
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
            <button
              onClick={() => handleViewModeChange("all")}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                viewMode === "all"
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200"
                  : "bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              Todas las notas
            </button>
            <button
              onClick={() => handleViewModeChange("my")}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                viewMode === "my"
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200"
                  : "bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              Mis notas
            </button>
            <button
              onClick={() => handleViewModeChange("assigned")}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                viewMode === "assigned"
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200"
                  : "bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              Asignadas a mí
            </button>
            <button
              onClick={() => handleViewModeChange("important")}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                viewMode === "important"
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200"
                  : "bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              Importantes
            </button>
            <button
              onClick={() => handleViewModeChange("archived")}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                viewMode === "archived"
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200"
                  : "bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              Archivadas
            </button>
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
              onArchive={(note) => console.log("Archive note:", note)}
              onUnarchive={(note) => console.log("Unarchive note:", note)}
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
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Nueva Nota
              </button>
            </div>
          </div>
        )}

        {/* Note Form Modal - Formulario básico temporal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {editingNote ? "Editar Nota" : "Nueva Nota"}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Título
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Título de la nota"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Contenido
                  </label>
                  <textarea
                    rows={4}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Contenido de la nota"
                  />
                </div>
                <div className="flex space-x-2 pt-4">
                  <button
                    onClick={handleCloseForm}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancelar
                  </button>
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                    {createNoteMutation.isPending ||
                    updateNoteMutation.isPending
                      ? "Guardando..."
                      : "Guardar"}
                  </button>
                </div>
              </div>
            </div>
          </div>
          /* TODO: Implementar componente NoteForm completo */
          /* <NoteForm
            note={editingNote}
            onSave={editingNote ? handleUpdateNote : handleCreateNote}
            onCancel={handleCloseForm}
            isLoading={createNoteMutation.isPending || updateNoteMutation.isPending}
            users={users}
            cases={cases}
            availableTags={existingTags}
          /> */
        )}
      </div>
    </div>
  );
};
