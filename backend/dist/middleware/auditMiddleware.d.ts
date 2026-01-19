import { Request, Response, NextFunction } from "express";
import { AuditAction } from "../entities/AuditLog";
import { AuditContext, AuditMetadata, EntityChange } from "../dto/audit.dto";
import { EnrichedIpData } from "../services/IpGeolocationService";
export interface AuditableRequest extends Request {
    user?: any;
    auditContext?: AuditContext;
    auditMetadata?: AuditMetadata;
    originalBody?: any;
    originalParams?: any;
    ipGeolocation?: EnrichedIpData;
}
export declare class AuditMiddleware {
    private static waitForDataSource;
    private static getAuditLogRepository;
    private static getAuditChangeRepository;
    private static readonly SENSITIVE_FIELDS;
    private static readonly ROUTE_ENTITY_MAPPING;
    static initializeAuditContext: (req: AuditableRequest, res: Response, next: NextFunction) => Promise<void>;
    static auditCreate: (entityType?: string) => (req: AuditableRequest, res: Response, next: NextFunction) => Promise<void>;
    static auditUpdate: (entityType?: string) => (req: AuditableRequest, res: Response, next: NextFunction) => Promise<void>;
    static auditDelete: (entityType?: string) => (req: AuditableRequest, res: Response, next: NextFunction) => Promise<void>;
    static auditDownload: (entityType?: string) => (req: AuditableRequest, res: Response, next: NextFunction) => void;
    static auditView: (entityType?: string) => (req: AuditableRequest, res: Response, next: NextFunction) => void;
    static auditReportAccess: (entityType?: string) => (req: AuditableRequest, res: Response, next: NextFunction) => void;
    static logManualAudit(context: AuditContext, action: AuditAction, entityType: string, entityId: string, entityName?: string, changes?: EntityChange[], operationContext?: any): Promise<void>;
    private static logAudit;
    private static extractModuleFromPath;
    private static extractIpAddress;
    private static getEntityTypeFromRoute;
    private static extractEntityName;
    private static getOriginalEntity;
    private static generateChangesForCreate;
    private static generateChangesForUpdate;
    private static generateChangesForDelete;
    private static determineChangeType;
    private static valuesAreDifferent;
    private static inferFieldType;
    private static isSensitiveField;
    private static serializeValue;
    static captureOperations(): (req: AuditableRequest, res: Response, next: NextFunction) => Promise<void>;
}
