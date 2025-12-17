import { CreateNoteDto, UpdateNoteDto, NoteFiltersDto, NoteResponseDto, NoteStatsDto, NoteSearchResultDto } from "../dto/note.dto";
export declare class NoteService {
    private noteRepository;
    constructor();
    getAllNotes(filters: NoteFiltersDto, userId: string): Promise<NoteResponseDto[]>;
    createNote(createNoteDto: CreateNoteDto, userId: string): Promise<NoteResponseDto>;
    updateNote(id: string, updateNoteDto: UpdateNoteDto, userId: string): Promise<NoteResponseDto | null>;
    deleteNote(id: string, userId: string): Promise<boolean>;
    toggleArchiveNote(id: string, userId: string): Promise<NoteResponseDto | null>;
    searchNotes(searchTerm: string, userId: string, limit?: number): Promise<NoteSearchResultDto[]>;
    getNotesStats(userId: string): Promise<NoteStatsDto>;
    incrementViewCount(noteId: string): Promise<void>;
    markAsHelpful(noteId: string, userId: string, isHelpful: boolean): Promise<void>;
    deprecateNote(noteId: string, reason: string, userId: string): Promise<NoteResponseDto | null>;
    getPublishedNotes(filters: NoteFiltersDto): Promise<NoteResponseDto[]>;
    getTemplates(filters: NoteFiltersDto): Promise<NoteResponseDto[]>;
    getNotesByCase(caseId: string, userId: string): Promise<NoteResponseDto[]>;
    getNoteById(id: string, userId: string): Promise<NoteResponseDto | null>;
    private mapToResponseDto;
}
