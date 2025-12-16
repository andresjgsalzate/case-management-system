import { UserProfile } from "./UserProfile";
import { AuditEntityChange } from "./AuditEntityChange";
export declare enum AuditAction {
    CREATE = "CREATE",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
    RESTORE = "RESTORE",
    ARCHIVE = "ARCHIVE",
    READ = "READ",
    DOWNLOAD = "DOWNLOAD",
    VIEW = "VIEW",
    EXPORT = "EXPORT",
    LOGIN = "LOGIN",
    LOGOUT = "LOGOUT",
    LOGOUT_ALL = "LOGOUT_ALL",
    FORCE_LOGOUT = "FORCE_LOGOUT"
}
export declare class AuditLog {
    id: string;
    userId?: string;
    userEmail: string;
    userName?: string;
    userRole?: string;
    action: AuditAction;
    entityType: string;
    entityId: string;
    entityName?: string;
    module: string;
    operationContext?: any;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    requestPath?: string;
    requestMethod?: string;
    operationSuccess: boolean;
    errorMessage?: string;
    createdAt: Date;
    user?: UserProfile;
    changes: AuditEntityChange[];
    getEntityDisplayName(): string;
    getActionDescription(): string;
    getFullDescription(): string;
}
