import { AuditLogFiltersDto, AuditLogResponseDto, AuditLogListResponseDto, AuditStatisticsResponseDto, AuditEntityHistoryResponseDto, CreateAuditLogDto, AuditExportFiltersDto } from "../dto/audit.dto";
export declare class AuditService {
    private auditLogRepository;
    private auditChangeRepository;
    constructor();
    getAuditLogs(filters: AuditLogFiltersDto): Promise<AuditLogListResponseDto>;
    getAuditLogById(id: string): Promise<AuditLogResponseDto | null>;
    getEntityHistory(entityType: string, entityId: string, includeChanges?: boolean): Promise<AuditEntityHistoryResponseDto>;
    getAuditStatistics(days?: number): Promise<AuditStatisticsResponseDto>;
    createAuditLog(data: CreateAuditLogDto): Promise<AuditLogResponseDto>;
    exportAuditLogs(filters: AuditExportFiltersDto): Promise<any>;
    cleanOldAuditLogs(daysToKeep?: number): Promise<number>;
    private buildAuditQuery;
    private loadChangesForLogs;
    private mapAuditLogToDto;
    private mapAuditChangeToDto;
    private exportToCsv;
    private exportToXlsx;
    private exportToJson;
}
