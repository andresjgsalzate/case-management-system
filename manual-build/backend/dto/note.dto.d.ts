export declare class CreateNoteDto {
    title: string;
    content: string;
    noteType?: string;
    priority?: string;
    difficultyLevel?: number;
    tags?: string[];
    caseId?: string;
    assignedTo?: string;
    isImportant?: boolean;
    isTemplate?: boolean;
    isPublished?: boolean;
    reminderDate?: string;
    complexityNotes?: string;
    prerequisites?: string;
    estimatedSolutionTime?: number;
}
export declare class UpdateNoteDto {
    title?: string;
    content?: string;
    noteType?: string;
    priority?: string;
    difficultyLevel?: number;
    tags?: string[];
    caseId?: string;
    assignedTo?: string;
    isImportant?: boolean;
    isTemplate?: boolean;
    isPublished?: boolean;
    reminderDate?: string;
    complexityNotes?: string;
    prerequisites?: string;
    estimatedSolutionTime?: number;
    isArchived?: boolean;
    isDeprecated?: boolean;
    deprecationReason?: string;
}
export declare class NoteFiltersDto {
    search?: string;
    tags?: string[];
    createdBy?: string;
    assignedTo?: string;
    caseId?: string;
    noteType?: string;
    priority?: string;
    difficultyLevel?: number;
    isImportant?: boolean;
    isTemplate?: boolean;
    isPublished?: boolean;
    isArchived?: boolean;
    isDeprecated?: boolean;
    hasReminder?: boolean;
    dateFrom?: string;
    dateTo?: string;
}
export declare class ArchiveNoteDto {
    isArchived: boolean;
}
export interface NoteResponseDto {
    id: string;
    title: string;
    content: string;
    noteType: string;
    priority: string;
    difficultyLevel: number;
    tags: string[];
    caseId?: string;
    createdBy: string;
    assignedTo?: string;
    isImportant: boolean;
    isTemplate: boolean;
    isPublished: boolean;
    isArchived: boolean;
    isDeprecated: boolean;
    deprecationReason?: string;
    archivedAt?: string;
    archivedBy?: string;
    reminderDate?: string;
    isReminderSent: boolean;
    viewCount: number;
    helpfulCount: number;
    notHelpfulCount: number;
    version: number;
    complexityNotes?: string;
    prerequisites?: string;
    estimatedSolutionTime?: number;
    createdAt: string;
    updatedAt: string;
    case?: {
        id: string;
        numeroCaso: string;
        descripcion: string;
    };
    createdByUser?: {
        id: string;
        fullName?: string;
        email: string;
    };
    assignedToUser?: {
        id: string;
        fullName?: string;
        email: string;
    };
    archivedByUser?: {
        id: string;
        fullName?: string;
        email: string;
    };
}
export interface NoteStatsDto {
    totalNotes: number;
    myNotes: number;
    assignedNotes: number;
    importantNotes: number;
    withReminders: number;
    archivedNotes: number;
    deprecatedNotes: number;
    templatesCount: number;
    publishedNotes: number;
    notesByType: {
        note: number;
        solution: number;
        guide: number;
        faq: number;
        template: number;
        procedure: number;
    };
    notesByPriority: {
        low: number;
        medium: number;
        high: number;
        urgent: number;
    };
    notesByDifficulty: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
    };
    totalViews: number;
    totalHelpful: number;
}
export interface NoteSearchResultDto {
    id: string;
    title: string;
    content: string;
    tags: string[];
    caseId?: string;
    createdBy: string;
    assignedTo?: string;
    isImportant: boolean;
    isArchived: boolean;
    createdAt: string;
    updatedAt: string;
    caseNumber?: string;
    creatorName?: string;
    assignedName?: string;
}
