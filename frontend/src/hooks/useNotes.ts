import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notesApi } from "../services/notesApi";
import {
  CreateNoteData,
  UpdateNoteData,
  NoteFilters,
} from "../types/note.types";

// Hook para obtener todas las notas
export function useNotes(filters?: NoteFilters) {
  return useQuery({
    queryKey: ["notes", filters],
    queryFn: () => notesApi.getAllNotes(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para obtener estadísticas de notas
export function useNotesStats() {
  return useQuery({
    queryKey: ["notes-stats"],
    queryFn: () => notesApi.getNotesStats(),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

// Hook para obtener una nota por ID
export function useNote(id: string) {
  return useQuery({
    queryKey: ["note", id],
    queryFn: () => notesApi.getNoteById(id),
    enabled: !!id,
  });
}

// Hook para crear una nueva nota
export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateNoteData) => notesApi.createNote(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["notes-stats"] });
    },
  });
}

// Hook para actualizar una nota
export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateNoteData }) =>
      notesApi.updateNote(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["note", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["notes-stats"] });
    },
  });
}

// Hook para eliminar una nota
export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notesApi.deleteNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["notes-stats"] });
    },
  });
}

// Hook para archivar/desarchivar una nota
export function useToggleArchiveNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notesApi.toggleArchiveNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["notes-stats"] });
    },
  });
}

// Hook para buscar notas
export function useSearchNotes(query: string) {
  return useQuery({
    queryKey: ["search-notes", query],
    queryFn: () => notesApi.searchNotes(query),
    enabled: query.length > 2, // Solo buscar si hay al menos 3 caracteres
    staleTime: 30 * 1000, // 30 segundos
  });
}

// Hook para obtener notas por caso
export function useNotesByCase(caseId: string) {
  return useQuery({
    queryKey: ["notes-by-case", caseId],
    queryFn: () => notesApi.getNotesByCase(caseId),
    enabled: !!caseId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
