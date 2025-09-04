import React, { useState, useEffect } from "react";
import {
  PlusIcon,
  ChartBarIcon,
  ArchiveBoxIcon,
} from "@heroicons/react/24/outline";
import {
  Note,
  NoteFilters,
  NoteStats,
  CreateNoteData,
  UpdateNoteData,
  NoteFormData,
} from "../../types/note.types";
import { notesApi } from "../../services/notesApi";
import { NoteCard } from "../../components/notes/NoteCard";
import { NoteForm } from "../../components/notes/NoteForm";
import { NotesSearch } from "../../components/notes/NotesSearch";

export const NotesPage: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [stats, setStats] = useState<NoteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<NoteFilters>({
    isArchived: false, // Por defecto excluir notas archivadas
  });
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<
    "all" | "my" | "assigned" | "important" | "archived"
  >("all");

  // Mock data for users and cases - In real app, these would come from API calls
  const [users] = useState([
    {
      id: "7c1b05d7-d98e-4543-ac27-dd1c797517e6",
      fullName: "Juan Pérez",
      email: "juan@example.com",
    },
    { id: "2", fullName: "María García", email: "maria@example.com" },
  ]);

  const [cases] = useState([
    { id: "1", numeroCaso: "CASO-001", descripcion: "Caso de prueba 1" },
    { id: "2", numeroCaso: "CASO-002", descripcion: "Caso de prueba 2" },
  ]);

  const [existingTags, setExistingTags] = useState<string[]>([]);

  // Mock current user ID - In real app, this would come from auth context
  // Using the UUID from the token: 7c1b05d7-d98e-4543-ac27-dd1c797517e6
  const currentUserId = "7c1b05d7-d98e-4543-ac27-dd1c797517e6";

  useEffect(() => {
    // Aplicar filtros por defecto al cargar la página
    const defaultFilters = { isArchived: false };
    setCurrentFilters(defaultFilters);
    loadNotes(defaultFilters);
    loadStats();
  }, []);

  const loadNotes = async (filters?: NoteFilters) => {
    try {
      setLoading(true);
      setError(null);

      // Si no se proporcionan filtros, usar los filtros actuales que excluyen archivadas
      const finalFilters = filters || currentFilters;
      console.log("Loading notes with filters:", finalFilters);

      const data = await notesApi.getAllNotes(finalFilters);
      setNotes(data);

      // Extract unique tags
      const allTags = data.flatMap((note) => note.tags || []);
      const uniqueTags = [...new Set(allTags)];
      setExistingTags(uniqueTags);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar las notas"
      );
      console.error("Error loading notes:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await notesApi.getNotesStats();
      setStats(statsData);
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  };

  const handleSearch = (filters: NoteFilters) => {
    setCurrentFilters(filters);
    loadNotes(filters);
  };

  const handleResetSearch = () => {
    const resetFilters = { isArchived: false }; // Mantener el filtro de archivadas por defecto
    setCurrentFilters(resetFilters);
    loadNotes(resetFilters);
  };

  const handleCreateNote = async (data: NoteFormData) => {
    try {
      setFormLoading(true);
      setError(null);
      const createData: CreateNoteData = data;
      await notesApi.createNote(createData);
      setShowForm(false);
      loadNotes(currentFilters);
      loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la nota");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateNote = async (data: NoteFormData) => {
    if (!editingNote) return;

    try {
      setFormLoading(true);
      setError(null);
      const updateData: UpdateNoteData = { ...data, id: editingNote.id };
      await notesApi.updateNote(editingNote.id, updateData);
      setEditingNote(null);
      loadNotes(currentFilters);
      loadStats();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al actualizar la nota"
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteNote = async (note: Note) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta nota?")) {
      return;
    }

    try {
      setError(null);
      await notesApi.deleteNote(note.id);
      loadNotes(currentFilters);
      loadStats();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al eliminar la nota"
      );
    }
  };

  const handleArchiveNote = async (note: Note) => {
    try {
      setError(null);
      await notesApi.toggleArchiveNote(note.id);
      loadNotes(currentFilters);
      loadStats();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al archivar la nota"
      );
    }
  };

  const handleUnarchiveNote = async (note: Note) => {
    try {
      setError(null);
      await notesApi.toggleArchiveNote(note.id);
      loadNotes(currentFilters);
      loadStats();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al desarchivar la nota"
      );
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingNote(null);
  };

  const handleViewModeChange = async (mode: typeof viewMode) => {
    setViewMode(mode);
    const newFilters = { ...currentFilters };

    // Resetear filtros específicos del modo anterior
    delete newFilters.createdBy;
    delete newFilters.assignedTo;
    delete newFilters.isImportant;
    delete newFilters.isArchived;

    // Aplicar filtros según el nuevo modo
    switch (mode) {
      case "my":
        newFilters.createdBy = currentUserId;
        newFilters.isArchived = false; // Excluir archivadas
        break;
      case "assigned":
        newFilters.assignedTo = currentUserId;
        newFilters.isArchived = false; // Excluir archivadas
        break;
      case "important":
        newFilters.isImportant = true;
        newFilters.isArchived = false; // Excluir archivadas
        break;
      case "archived":
        newFilters.isArchived = true;
        break;
      case "all":
      default:
        newFilters.isArchived = false; // Excluir archivadas
        break;
    }

    setCurrentFilters(newFilters);

    // Recargar notas con los nuevos filtros
    try {
      await loadNotes(newFilters);
    } catch (error) {
      setError("Error al cargar notas");
      console.error("Error loading notes:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Gestión de Notas
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Administra y organiza todas las notas del sistema
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-5 w-5" />
            Nueva Nota
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <ChartBarIcon className="h-5 w-5 text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Total
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.totalNotes}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <ChartBarIcon className="h-5 w-5 text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Mis Notas
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.myNotes}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <ChartBarIcon className="h-5 w-5 text-purple-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Asignadas
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.assignedNotes}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <ChartBarIcon className="h-5 w-5 text-red-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Importantes
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.importantNotes}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <ChartBarIcon className="h-5 w-5 text-yellow-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Recordatorios
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.withReminders}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <ArchiveBoxIcon className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Archivadas
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.archivedNotes}
              </p>
            </div>
          </div>
        )}

        {/* View Mode Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => handleViewModeChange("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "all"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            Todas las notas
          </button>
          <button
            onClick={() => handleViewModeChange("my")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "my"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            Mis notas
          </button>
          <button
            onClick={() => handleViewModeChange("assigned")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "assigned"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            Asignadas a mí
          </button>
          <button
            onClick={() => handleViewModeChange("important")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "important"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            Importantes
          </button>
          <button
            onClick={() => handleViewModeChange("archived")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "archived"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            Archivadas
          </button>
        </div>

        {/* Search */}
        <div className="mb-8">
          <NotesSearch
            onSearch={handleSearch}
            onReset={handleResetSearch}
            users={users}
            cases={cases}
            existingTags={existingTags}
            currentFilters={currentFilters}
          />
        </div>

        {/* Notes List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              {Object.keys(currentFilters).length > 0
                ? "No se encontraron notas que coincidan con los filtros."
                : "No hay notas disponibles."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={handleEditNote}
                onDelete={handleDeleteNote}
                onArchive={handleArchiveNote}
                onUnarchive={handleUnarchiveNote}
                currentUserId={currentUserId}
                canEdit={true}
                canDelete={true}
                canArchive={true}
              />
            ))}
          </div>
        )}

        {/* Form Modal */}
        <NoteForm
          isOpen={showForm || !!editingNote}
          onClose={handleCloseForm}
          onSubmit={editingNote ? handleUpdateNote : handleCreateNote}
          initialData={editingNote || undefined}
          isEdit={!!editingNote}
          loading={formLoading}
          users={users}
          cases={cases}
        />
      </div>
    </div>
  );
};
