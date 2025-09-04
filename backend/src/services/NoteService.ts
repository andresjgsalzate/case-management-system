import { Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { Note } from "../entities/Note";
import {
  CreateNoteDto,
  UpdateNoteDto,
  NoteFiltersDto,
  NoteResponseDto,
  NoteStatsDto,
  NoteSearchResultDto,
} from "../dto/note.dto";

export class NoteService {
  private noteRepository: Repository<Note>;

  constructor() {
    this.noteRepository = AppDataSource.getRepository(Note);
  }

  async getAllNotes(
    filters: NoteFiltersDto,
    userId: string
  ): Promise<NoteResponseDto[]> {
    const queryBuilder = this.noteRepository
      .createQueryBuilder("note")
      .where("(note.createdBy = :userId OR note.assignedTo = :userId)", {
        userId,
      });

    if (filters.search) {
      queryBuilder.andWhere(
        "(note.title ILIKE :search OR note.content ILIKE :search OR :search = ANY(note.tags))",
        { search: `%${filters.search}%` }
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      queryBuilder.andWhere("note.tags && :tags", { tags: filters.tags });
    }

    if (filters.noteType) {
      queryBuilder.andWhere("note.noteType = :noteType", {
        noteType: filters.noteType,
      });
    }

    if (filters.priority) {
      queryBuilder.andWhere("note.priority = :priority", {
        priority: filters.priority,
      });
    }

    if (filters.difficultyLevel) {
      queryBuilder.andWhere("note.difficultyLevel = :difficultyLevel", {
        difficultyLevel: filters.difficultyLevel,
      });
    }

    if (filters.isTemplate !== undefined) {
      queryBuilder.andWhere("note.isTemplate = :isTemplate", {
        isTemplate: filters.isTemplate,
      });
    }

    if (filters.isPublished !== undefined) {
      queryBuilder.andWhere("note.isPublished = :isPublished", {
        isPublished: filters.isPublished,
      });
    }

    if (filters.isArchived !== undefined) {
      queryBuilder.andWhere("note.isArchived = :isArchived", {
        isArchived: filters.isArchived,
      });
    }

    if (filters.isImportant !== undefined) {
      queryBuilder.andWhere("note.isImportant = :isImportant", {
        isImportant: filters.isImportant,
      });
    }

    if (filters.isDeprecated !== undefined) {
      queryBuilder.andWhere("note.isDeprecated = :isDeprecated", {
        isDeprecated: filters.isDeprecated,
      });
    }

    if (filters.createdBy) {
      queryBuilder.andWhere("note.createdBy = :createdBy", {
        createdBy: filters.createdBy,
      });
    }

    if (filters.assignedTo) {
      queryBuilder.andWhere("note.assignedTo = :assignedTo", {
        assignedTo: filters.assignedTo,
      });
    }

    if (filters.caseId) {
      queryBuilder.andWhere("note.caseId = :caseId", {
        caseId: filters.caseId,
      });
    }

    if (filters.dateFrom) {
      queryBuilder.andWhere("note.createdAt >= :dateFrom", {
        dateFrom: filters.dateFrom,
      });
    }

    if (filters.dateTo) {
      queryBuilder.andWhere("note.createdAt <= :dateTo", {
        dateTo: filters.dateTo,
      });
    }

    queryBuilder.orderBy("note.updatedAt", "DESC");
    const notes = await queryBuilder.getMany();
    return notes.map((note) => this.mapToResponseDto(note));
  }

  async createNote(
    createNoteDto: CreateNoteDto,
    userId: string
  ): Promise<NoteResponseDto> {
    console.log(
      "🔍 DEBUG createNote - Input DTO:",
      JSON.stringify(createNoteDto, null, 2)
    );

    const noteData = {
      title: createNoteDto.title,
      content: createNoteDto.content,
      createdBy: userId,
      tags: createNoteDto.tags || [],
      noteType: createNoteDto.noteType ?? "note",
      priority: createNoteDto.priority ?? "medium",
      difficultyLevel: createNoteDto.difficultyLevel ?? 1,
      isTemplate: createNoteDto.isTemplate ?? false,
      isPublished: createNoteDto.isPublished ?? false,
      isImportant: createNoteDto.isImportant ?? false,
      caseId: createNoteDto.caseId,
      assignedTo: createNoteDto.assignedTo,
      complexityNotes: createNoteDto.complexityNotes,
      prerequisites: createNoteDto.prerequisites,
      estimatedSolutionTime: createNoteDto.estimatedSolutionTime,
      viewCount: 0,
      helpfulCount: 0,
      notHelpfulCount: 0,
      version: 1,
      isDeprecated: false,
      reminderDate: createNoteDto.reminderDate
        ? new Date(createNoteDto.reminderDate)
        : undefined,
    };

    console.log(
      "🔍 DEBUG createNote - Note data to save:",
      JSON.stringify(noteData, null, 2)
    );

    const note = this.noteRepository.create(noteData);

    const savedNote = await this.noteRepository.save(note);
    const createdNote = await this.getNoteById(savedNote.id, userId);
    return createdNote as NoteResponseDto;
  }

  async updateNote(
    id: string,
    updateNoteDto: UpdateNoteDto,
    userId: string
  ): Promise<NoteResponseDto | null> {
    const existingNote = await this.noteRepository.findOne({ where: { id } });

    if (!existingNote) {
      throw new Error("Nota no encontrada");
    }

    if (existingNote.createdBy !== userId) {
      throw new Error("No tienes permisos para actualizar esta nota");
    }

    const updateData: any = { ...updateNoteDto };

    // Incrementar versión si hay cambios significativos
    if (updateNoteDto.title || updateNoteDto.content) {
      updateData.version = (existingNote.version || 1) + 1;
    }

    if (updateNoteDto.reminderDate) {
      updateData.reminderDate = new Date(updateNoteDto.reminderDate);
    }

    await this.noteRepository.update(id, updateData);
    return await this.getNoteById(id, userId);
  }

  async deleteNote(id: string, userId: string): Promise<boolean> {
    const existingNote = await this.noteRepository.findOne({ where: { id } });

    if (!existingNote) {
      throw new Error("Nota no encontrada");
    }

    if (existingNote.createdBy !== userId) {
      throw new Error("No tienes permisos para eliminar esta nota");
    }

    const result = await this.noteRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async toggleArchiveNote(
    id: string,
    userId: string
  ): Promise<NoteResponseDto | null> {
    const existingNote = await this.noteRepository.findOne({ where: { id } });

    if (!existingNote) {
      throw new Error("Nota no encontrada");
    }

    if (existingNote.createdBy !== userId) {
      throw new Error("No tienes permisos para archivar esta nota");
    }

    const newArchivedState = !existingNote.isArchived;
    await this.noteRepository.update(id, {
      isArchived: newArchivedState,
      archivedAt: newArchivedState ? new Date() : undefined,
      archivedBy: newArchivedState ? userId : undefined,
    });

    return await this.getNoteById(id, userId);
  }

  async searchNotes(
    searchTerm: string,
    userId: string,
    limit: number = 50
  ): Promise<NoteSearchResultDto[]> {
    const results = await this.noteRepository.query(
      "SELECT * FROM search_notes($1, $2, $3)",
      [searchTerm, userId, limit]
    );

    return results.map((row: any) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      tags: row.tags || [],
      caseId: row.case_id,
      createdBy: row.created_by,
      assignedTo: row.assigned_to,
      isImportant: row.is_important,
      isArchived: row.is_archived,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      caseNumber: row.case_number,
      creatorName: row.creator_name,
      assignedName: row.assigned_name,
    }));
  }

  async getNotesStats(userId: string): Promise<NoteStatsDto> {
    const results = await this.noteRepository.query(
      "SELECT get_notes_stats($1) as stats",
      [userId]
    );

    return (
      results[0]?.stats || {
        totalNotes: 0,
        myNotes: 0,
        assignedNotes: 0,
        importantNotes: 0,
        withReminders: 0,
        archivedNotes: 0,
        deprecatedNotes: 0,
        templatesCount: 0,
        publishedNotes: 0,
        notesByType: {
          note: 0,
          solution: 0,
          guide: 0,
          faq: 0,
          template: 0,
          procedure: 0,
        },
        notesByPriority: {
          low: 0,
          medium: 0,
          high: 0,
          urgent: 0,
        },
        notesByDifficulty: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        },
        totalViews: 0,
        totalHelpful: 0,
      }
    );
  }

  // Nuevos métodos para funciones avanzadas
  async incrementViewCount(noteId: string): Promise<void> {
    await this.noteRepository.increment({ id: noteId }, "viewCount", 1);
  }

  async markAsHelpful(
    noteId: string,
    userId: string,
    isHelpful: boolean
  ): Promise<void> {
    // Incrementar o decrementar el contador correspondiente
    const field = isHelpful ? "helpfulCount" : "notHelpfulCount";
    await this.noteRepository.increment({ id: noteId }, field, 1);

    // Aquí podrías agregar lógica para registrar el feedback en una tabla separada
    // para evitar que el mismo usuario vote múltiples veces
  }

  async deprecateNote(
    noteId: string,
    reason: string,
    userId: string
  ): Promise<NoteResponseDto | null> {
    const existingNote = await this.noteRepository.findOne({
      where: { id: noteId },
    });

    if (!existingNote) {
      throw new Error("Nota no encontrada");
    }

    if (existingNote.createdBy !== userId) {
      throw new Error("No tienes permisos para deprecar esta nota");
    }

    await this.noteRepository.update(noteId, {
      isDeprecated: true,
      deprecationReason: reason,
      version: (existingNote.version || 1) + 1,
    });

    return await this.getNoteById(noteId, userId);
  }

  async getPublishedNotes(filters: NoteFiltersDto): Promise<NoteResponseDto[]> {
    const queryBuilder = this.noteRepository
      .createQueryBuilder("note")
      .where("note.isPublished = true")
      .andWhere("note.isArchived = false")
      .andWhere("note.isDeprecated = false");

    if (filters.search) {
      queryBuilder.andWhere(
        "(note.title ILIKE :search OR note.content ILIKE :search OR :search = ANY(note.tags))",
        { search: `%${filters.search}%` }
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      queryBuilder.andWhere("note.tags && :tags", { tags: filters.tags });
    }

    if (filters.noteType) {
      queryBuilder.andWhere("note.noteType = :noteType", {
        noteType: filters.noteType,
      });
    }

    if (filters.priority) {
      queryBuilder.andWhere("note.priority = :priority", {
        priority: filters.priority,
      });
    }

    if (filters.difficultyLevel) {
      queryBuilder.andWhere("note.difficultyLevel = :difficultyLevel", {
        difficultyLevel: filters.difficultyLevel,
      });
    }

    queryBuilder
      .orderBy("note.helpfulCount", "DESC")
      .addOrderBy("note.viewCount", "DESC")
      .addOrderBy("note.updatedAt", "DESC");

    const notes = await queryBuilder.getMany();
    return notes.map((note) => this.mapToResponseDto(note));
  }

  async getTemplates(filters: NoteFiltersDto): Promise<NoteResponseDto[]> {
    const queryBuilder = this.noteRepository
      .createQueryBuilder("note")
      .where("note.isTemplate = true")
      .andWhere("note.isArchived = false")
      .andWhere("note.isDeprecated = false");

    if (filters.search) {
      queryBuilder.andWhere(
        "(note.title ILIKE :search OR note.content ILIKE :search)",
        { search: `%${filters.search}%` }
      );
    }

    if (filters.noteType) {
      queryBuilder.andWhere("note.noteType = :noteType", {
        noteType: filters.noteType,
      });
    }

    queryBuilder.orderBy("note.updatedAt", "DESC");
    const notes = await queryBuilder.getMany();
    return notes.map((note) => this.mapToResponseDto(note));
  }

  async getNotesByCase(
    caseId: string,
    userId: string
  ): Promise<NoteResponseDto[]> {
    const notes = await this.noteRepository
      .createQueryBuilder("note")
      .leftJoinAndSelect("note.case", "case")
      .leftJoinAndSelect("note.createdByUser", "createdByUser")
      .leftJoinAndSelect("note.assignedToUser", "assignedToUser")
      .leftJoinAndSelect("note.archivedByUser", "archivedByUser")
      .where("note.caseId = :caseId", { caseId })
      .andWhere("(note.createdBy = :userId OR note.assignedTo = :userId)", {
        userId,
      })
      .andWhere("note.isArchived = false")
      .orderBy("note.createdAt", "DESC")
      .getMany();

    return notes.map((note) => this.mapToResponseDto(note));
  }

  async getNoteById(
    id: string,
    userId: string
  ): Promise<NoteResponseDto | null> {
    const note = await this.noteRepository
      .createQueryBuilder("note")
      .leftJoinAndSelect("note.case", "case")
      .leftJoinAndSelect("note.createdByUser", "createdByUser")
      .leftJoinAndSelect("note.assignedToUser", "assignedToUser")
      .leftJoinAndSelect("note.archivedByUser", "archivedByUser")
      .where("note.id = :id", { id })
      .andWhere("(note.createdBy = :userId OR note.assignedTo = :userId)", {
        userId,
      })
      .getOne();

    return note ? this.mapToResponseDto(note) : null;
  }

  private mapToResponseDto(note: Note): NoteResponseDto {
    return {
      id: note.id,
      title: note.title,
      content: note.content,
      noteType: note.noteType || "note",
      priority: note.priority || "medium",
      difficultyLevel: note.difficultyLevel || 1,
      tags: note.tags || [],
      caseId: note.caseId,
      createdBy: note.createdBy,
      assignedTo: note.assignedTo,
      isImportant: note.isImportant,
      isTemplate: note.isTemplate || false,
      isPublished: note.isPublished || false,
      isArchived: note.isArchived,
      isDeprecated: note.isDeprecated || false,
      deprecationReason: note.deprecationReason,
      archivedAt: note.archivedAt?.toISOString(),
      archivedBy: note.archivedBy,
      reminderDate: note.reminderDate?.toISOString(),
      isReminderSent: note.isReminderSent,
      viewCount: note.viewCount || 0,
      helpfulCount: note.helpfulCount || 0,
      notHelpfulCount: note.notHelpfulCount || 0,
      version: note.version || 1,
      complexityNotes: note.complexityNotes,
      prerequisites: note.prerequisites,
      estimatedSolutionTime: note.estimatedSolutionTime,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
      case: note.case
        ? {
            id: note.case.id,
            numeroCaso: note.case.numeroCaso,
            descripcion: note.case.descripcion,
          }
        : undefined,
      createdByUser: note.createdByUser
        ? {
            id: note.createdByUser.id,
            fullName: note.createdByUser.fullName,
            email: note.createdByUser.email,
          }
        : undefined,
      assignedToUser: note.assignedToUser
        ? {
            id: note.assignedToUser.id,
            fullName: note.assignedToUser.fullName,
            email: note.assignedToUser.email,
          }
        : undefined,
      archivedByUser: note.archivedByUser
        ? {
            id: note.archivedByUser.id,
            fullName: note.archivedByUser.fullName,
            email: note.archivedByUser.email,
          }
        : undefined,
    };
  }
}
