import { AuditLog } from "./AuditLog";
export declare enum ChangeType {
    ADDED = "ADDED",
    MODIFIED = "MODIFIED",
    REMOVED = "REMOVED"
}
export declare class AuditEntityChange {
    id: string;
    auditLogId: string;
    fieldName: string;
    fieldType: string;
    oldValue?: string;
    newValue?: string;
    changeType: ChangeType;
    isSensitive: boolean;
    createdAt: Date;
    auditLog: AuditLog;
    getChangeDescription(): string;
    getDisplayValue(value?: string): string;
    getOldDisplayValue(): string;
    getNewDisplayValue(): string;
    getFieldDisplayName(): string;
    getFullChangeDescription(): string;
}
