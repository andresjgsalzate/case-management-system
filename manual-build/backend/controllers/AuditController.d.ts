import { Request, Response } from "express";
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        fullName?: string;
        roleName: string;
        permissions?: string[];
    };
}
export declare class AuditController {
    private auditService;
    constructor();
    getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void>;
    getAuditLogById(req: AuthenticatedRequest, res: Response): Promise<void>;
    getEntityHistory(req: AuthenticatedRequest, res: Response): Promise<void>;
    getAuditStatistics(req: AuthenticatedRequest, res: Response): Promise<void>;
    exportAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void>;
    createAuditLog(req: AuthenticatedRequest, res: Response): Promise<void>;
    cleanupOldLogs(req: AuthenticatedRequest, res: Response): Promise<void>;
    private hasAuditViewPermission;
    private hasAuditExportPermission;
    private hasAuditAdminPermission;
    private canViewAuditLog;
    private applyScopeFilters;
    private parseActionFilter;
    private parseArrayFilter;
    private validateAuditLogData;
}
export {};
