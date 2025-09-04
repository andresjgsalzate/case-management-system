import {
  Note,
  CreateNoteData,
  UpdateNoteData,
  NoteFilters,
  NoteStats,
  NoteSearchResult,
} from "../types/note.types";
import { authService } from "./auth.service";

class NotesApi {
  private baseUrl = "/notes";

  /**
   * Obtener todas las notas con filtros
   */
  async getAllNotes(filters?: NoteFilters): Promise<Note[]> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            params.append(key, value.join(","));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }

    const response = await authService.authenticatedRequest<Note[]>(
      `${this.baseUrl}${params.toString() ? `?${params.toString()}` : ""}`
    );
    return response.data || [];
  }

  /**
   * Obtener una nota por ID
   */
  async getNoteById(id: string): Promise<Note> {
    const response = await authService.authenticatedRequest<Note>(
      `${this.baseUrl}/${id}`
    );
    if (!response.data) {
      throw new Error("Note not found");
    }
    return response.data;
  }

  /**
   * Crear una nueva nota
   */
  async createNote(noteData: CreateNoteData): Promise<Note> {
    const response = await authService.authenticatedRequest<Note>(
      this.baseUrl,
      {
        method: "POST",
        body: JSON.stringify(noteData),
      }
    );
    if (!response.data) {
      throw new Error("Failed to create note");
    }
    return response.data;
  }

  /**
   * Actualizar una nota
   */
  async updateNote(
    id: string,
    noteData: Partial<UpdateNoteData>
  ): Promise<Note> {
    const response = await authService.authenticatedRequest<Note>(
      `${this.baseUrl}/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(noteData),
      }
    );
    if (!response.data) {
      throw new Error("Failed to update note");
    }
    return response.data;
  }

  /**
   * Eliminar una nota
   */
  async deleteNote(id: string): Promise<void> {
    await authService.authenticatedRequest(`${this.baseUrl}/${id}`, {
      method: "DELETE",
    });
  }

  /**
   * Archivar/desarchivar una nota
   */
  async toggleArchiveNote(id: string): Promise<Note> {
    const response = await authService.authenticatedRequest<Note>(
      `${this.baseUrl}/${id}/archive`,
      {
        method: "PATCH",
      }
    );
    if (!response.data) {
      throw new Error("Failed to toggle archive status");
    }
    return response.data;
  }

  /**
   * Buscar notas
   */
  async searchNotes(
    searchTerm: string,
    limit?: number
  ): Promise<NoteSearchResult[]> {
    const params = new URLSearchParams({
      q: searchTerm,
    });

    if (limit) {
      params.append("limit", String(limit));
    }

    const response = await authService.authenticatedRequest<NoteSearchResult[]>(
      `${this.baseUrl}/search?${params.toString()}`
    );
    return response.data || [];
  }

  /**
   * Obtener estadísticas de notas
   */
  async getNotesStats(): Promise<NoteStats> {
    const response = await authService.authenticatedRequest<NoteStats>(
      `${this.baseUrl}/stats`
    );
    if (!response.data) {
      throw new Error("Failed to load stats");
    }
    return response.data;
  }

  /**
   * Obtener notas por caso
   */
  async getNotesByCase(caseId: string): Promise<Note[]> {
    const response = await authService.authenticatedRequest<Note[]>(
      `${this.baseUrl}/case/${caseId}`
    );
    return response.data || [];
  }
}

export const notesApi = new NotesApi();
