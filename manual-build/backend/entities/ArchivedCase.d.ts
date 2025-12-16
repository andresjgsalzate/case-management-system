import { UserProfile } from "./UserProfile";
export declare enum ArchivedCaseStatus {
    OPEN = "OPEN",
    IN_PROGRESS = "IN_PROGRESS",
    PENDING = "PENDING",
    RESOLVED = "RESOLVED",
    CLOSED = "CLOSED",
    CANCELLED = "CANCELLED"
}
export declare enum ArchivedCasePriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export declare enum ArchivedCaseClassification {
    INCIDENT = "INCIDENT",
    REQUEST = "REQUEST",
    CHANGE = "CHANGE",
    PROBLEM = "PROBLEM"
}
export declare class ArchivedCase {
    id: string;
    originalCaseId: string;
    caseNumber: string;
    title: string;
    description?: string;
    status: ArchivedCaseStatus;
    priority: ArchivedCasePriority;
    classification: ArchivedCaseClassification;
    assignedTo?: string;
    createdBy: string;
    updatedBy?: string;
    archivedBy: string;
    archivedAt: Date;
    archivedReason?: string;
    originalCreatedAt: Date;
    originalUpdatedAt?: Date;
    timerEntries?: Array<{
        id: string;
        caseControlId: string;
        userId: string;
        userEmail?: string;
        startTime: Date;
        endTime?: Date;
        durationMinutes: number;
        description?: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    manualTimeEntries?: Array<{
        id: string;
        caseControlId: string;
        userId: string;
        userEmail?: string;
        date: Date;
        durationMinutes: number;
        description?: string;
        createdBy: string;
        createdByEmail?: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    metadata?: Record<string, any>;
    isRestored: boolean;
    createdAt: Date;
    updatedAt: Date;
    archivedByUser: UserProfile;
    assignedToUser?: UserProfile;
    createdByUser: UserProfile;
    updatedByUser?: UserProfile;
}
