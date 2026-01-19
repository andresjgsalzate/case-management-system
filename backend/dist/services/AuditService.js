"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const typeorm_1 = require("typeorm");
const database_1 = require("../config/database");
const AuditLog_1 = require("../entities/AuditLog");
const AuditEntityChange_1 = require("../entities/AuditEntityChange");
const audit_dto_1 = require("../dto/audit.dto");
class AuditService {
    constructor() {
        try {
            console.log("Iniciando AuditService...");
            this.auditLogRepository = database_1.AppDataSource.getRepository(AuditLog_1.AuditLog);
            this.auditChangeRepository =
                database_1.AppDataSource.getRepository(AuditEntityChange_1.AuditEntityChange);
            console.log("AuditService inicializado correctamente");
        }
        catch (error) {
            console.error("Error inicializando AuditService:", error);
            throw error;
        }
    }
    async getAuditLogs(filters) {
        try {
            console.log("getAuditLogs - Iniciando con filtros:", filters);
            console.log("getAuditLogs - Construyendo query...");
            const queryBuilder = this.buildAuditQuery(filters);
            console.log("getAuditLogs - Query construida exitosamente");
            const page = Math.max(1, filters.page || 1);
            const limit = Math.min(filters.limit || audit_dto_1.AUDIT_VALIDATION_RULES.DEFAULT_PAGE_SIZE, audit_dto_1.AUDIT_VALIDATION_RULES.MAX_PAGE_SIZE);
            const offset = (page - 1) * limit;
            queryBuilder.take(limit).skip(offset);
            console.log("getAuditLogs - Paginación aplicada:", {
                page,
                limit,
                offset,
            });
            const sortBy = filters.sortBy || "createdAt";
            const sortOrder = filters.sortOrder || "DESC";
            queryBuilder.orderBy(`auditLog.${sortBy}`, sortOrder);
            console.log("getAuditLogs - Ordenamiento aplicado:", {
                sortBy,
                sortOrder,
            });
            console.log("getAuditLogs - Ejecutando consulta...");
            const [auditLogs, total] = await queryBuilder.getManyAndCount();
            console.log("getAuditLogs - Consulta ejecutada:", {
                count: auditLogs.length,
                total,
            });
            let logsWithChanges = auditLogs;
            if (filters.includeChanges) {
                console.log("getAuditLogs - Cargando cambios...");
                logsWithChanges = await this.loadChangesForLogs(auditLogs);
                console.log("getAuditLogs - Cambios cargados");
            }
            console.log("getAuditLogs - Transformando a DTO...");
            const data = logsWithChanges.map((log) => this.mapAuditLogToDto(log));
            console.log("getAuditLogs - DTO transformado exitosamente");
            return {
                data,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1,
            };
        }
        catch (error) {
            console.error("Error obteniendo logs de auditoría - Detalles:", {
                error: error,
                message: error instanceof Error ? error.message : "Error desconocido",
                stack: error instanceof Error ? error.stack : "No stack available",
                filters: filters,
            });
            throw new Error(`Error al consultar logs de auditoría: ${error instanceof Error ? error.message : "Error desconocido"}`);
        }
    }
    async getAuditLogById(id) {
        try {
            const auditLog = await this.auditLogRepository.findOne({
                where: { id },
                relations: ["changes", "user"],
            });
            if (!auditLog) {
                return null;
            }
            return this.mapAuditLogToDto(auditLog);
        }
        catch (error) {
            console.error("Error obteniendo log de auditoría por ID:", error);
            throw new Error("Error al consultar log de auditoría");
        }
    }
    async getEntityHistory(entityType, entityId, includeChanges = true) {
        try {
            const queryBuilder = this.auditLogRepository
                .createQueryBuilder("auditLog")
                .where("auditLog.entityType = :entityType", { entityType })
                .andWhere("auditLog.entityId = :entityId", { entityId })
                .orderBy("auditLog.createdAt", "ASC");
            if (includeChanges) {
                queryBuilder.leftJoinAndSelect("auditLog.changes", "changes");
            }
            const history = await queryBuilder.getMany();
            const totalChanges = history.length;
            const firstChange = history[0]?.createdAt.toISOString();
            const lastChange = history[history.length - 1]?.createdAt.toISOString();
            const uniqueUsers = new Set(history.map((log) => log.userId).filter(Boolean)).size;
            const entityName = history[history.length - 1]?.entityName;
            return {
                entityType,
                entityId,
                entityName,
                history: history.map((log) => this.mapAuditLogToDto(log)),
                totalChanges,
                firstChange,
                lastChange,
                uniqueUsers,
            };
        }
        catch (error) {
            console.error("Error obteniendo historial de entidad:", error);
            throw new Error("Error al consultar historial de entidad");
        }
    }
    async getAuditStatistics(days = 30) {
        try {
            const fromDate = new Date();
            fromDate.setDate(fromDate.getDate() - days);
            const basicStats = await this.auditLogRepository
                .createQueryBuilder("auditLog")
                .select([
                "COUNT(*) as totalActions",
                "COUNT(*) FILTER (WHERE action = 'CREATE') as createActions",
                "COUNT(*) FILTER (WHERE action = 'UPDATE') as updateActions",
                "COUNT(*) FILTER (WHERE action = 'DELETE') as deleteActions",
                "COUNT(*) FILTER (WHERE action = 'ARCHIVE') as archiveActions",
                "COUNT(*) FILTER (WHERE action = 'RESTORE') as restoreActions",
                "COUNT(DISTINCT user_id) as uniqueUsers",
                "COUNT(DISTINCT entity_id) as uniqueEntities",
            ])
                .where("auditLog.createdAt >= :fromDate", { fromDate })
                .getRawOne();
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const thisWeek = new Date();
            thisWeek.setDate(thisWeek.getDate() - 7);
            const thisMonth = new Date();
            thisMonth.setMonth(thisMonth.getMonth() - 1);
            const [actionsToday, actionsThisWeek, actionsThisMonth] = await Promise.all([
                this.auditLogRepository.count({
                    where: { createdAt: { $gte: today } },
                }),
                this.auditLogRepository.count({
                    where: { createdAt: { $gte: thisWeek } },
                }),
                this.auditLogRepository.count({
                    where: { createdAt: { $gte: thisMonth } },
                }),
            ]);
            const mostActiveUser = await this.auditLogRepository
                .createQueryBuilder("auditLog")
                .select("auditLog.userEmail")
                .where("auditLog.createdAt >= :fromDate", { fromDate })
                .groupBy("auditLog.userEmail")
                .orderBy("COUNT(*)", "DESC")
                .limit(1)
                .getRawOne();
            const mostModifiedEntityType = await this.auditLogRepository
                .createQueryBuilder("auditLog")
                .select("auditLog.entityType")
                .where("auditLog.createdAt >= :fromDate", { fromDate })
                .groupBy("auditLog.entityType")
                .orderBy("COUNT(*)", "DESC")
                .limit(1)
                .getRawOne();
            const moduleStats = await this.auditLogRepository
                .createQueryBuilder("auditLog")
                .select(["auditLog.module as module", "COUNT(*) as count"])
                .where("auditLog.createdAt >= :fromDate", { fromDate })
                .groupBy("auditLog.module")
                .orderBy("count", "DESC")
                .getRawMany();
            const totalModuleActions = moduleStats.reduce((sum, stat) => sum + parseInt(stat.count), 0);
            const moduleStatsWithPercentage = moduleStats.map((stat) => ({
                module: stat.module,
                count: parseInt(stat.count),
                percentage: totalModuleActions > 0
                    ? (parseInt(stat.count) / totalModuleActions) * 100
                    : 0,
            }));
            const userActivity = await this.auditLogRepository
                .createQueryBuilder("auditLog")
                .select([
                "auditLog.userId as userId",
                "auditLog.userEmail as userEmail",
                "auditLog.userName as userName",
                "COUNT(*) as actionCount",
            ])
                .where("auditLog.createdAt >= :fromDate", { fromDate })
                .groupBy("auditLog.userId, auditLog.userEmail, auditLog.userName")
                .orderBy("actionCount", "DESC")
                .limit(10)
                .getRawMany();
            const entityActivity = await this.auditLogRepository
                .createQueryBuilder("auditLog")
                .select([
                "auditLog.entityType as entityType",
                "auditLog.entityId as entityId",
                "auditLog.entityName as entityName",
                "COUNT(*) as actionCount",
            ])
                .where("auditLog.createdAt >= :fromDate", { fromDate })
                .groupBy("auditLog.entityType, auditLog.entityId, auditLog.entityName")
                .orderBy("actionCount", "DESC")
                .limit(10)
                .getRawMany();
            return {
                totalActions: parseInt(basicStats.totalActions) || 0,
                createActions: parseInt(basicStats.createActions) || 0,
                updateActions: parseInt(basicStats.updateActions) || 0,
                deleteActions: parseInt(basicStats.deleteActions) || 0,
                archiveActions: parseInt(basicStats.archiveActions) || 0,
                restoreActions: parseInt(basicStats.restoreActions) || 0,
                uniqueUsers: parseInt(basicStats.uniqueUsers) || 0,
                uniqueEntities: parseInt(basicStats.uniqueEntities) || 0,
                mostActiveUser: mostActiveUser?.userEmail,
                mostModifiedEntityType: mostModifiedEntityType?.entityType,
                actionsToday,
                actionsThisWeek,
                actionsThisMonth,
                moduleStats: moduleStatsWithPercentage,
                userActivity: userActivity.map((activity) => ({
                    userId: activity.userId,
                    userEmail: activity.userEmail,
                    userName: activity.userName,
                    actionCount: parseInt(activity.actionCount),
                })),
                entityActivity: entityActivity.map((activity) => ({
                    entityType: activity.entityType,
                    entityId: activity.entityId,
                    entityName: activity.entityName,
                    actionCount: parseInt(activity.actionCount),
                })),
            };
        }
        catch (error) {
            console.error("Error obteniendo estadísticas de auditoría:", error);
            throw new Error("Error al consultar estadísticas de auditoría");
        }
    }
    async createAuditLog(data) {
        try {
            const auditLog = new AuditLog_1.AuditLog();
            Object.assign(auditLog, {
                userId: data.userId,
                userEmail: data.userEmail,
                userName: data.userName,
                userRole: data.userRole,
                action: data.action,
                entityType: data.entityType,
                entityId: data.entityId,
                entityName: data.entityName,
                module: data.module,
                operationContext: data.operationContext,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                sessionId: data.sessionId,
                requestPath: data.requestPath,
                requestMethod: data.requestMethod,
            });
            const savedLog = await this.auditLogRepository.save(auditLog);
            if (data.changes && data.changes.length > 0) {
                const changes = data.changes.map((change) => {
                    const auditChange = new AuditEntityChange_1.AuditEntityChange();
                    auditChange.auditLogId = savedLog.id;
                    auditChange.fieldName = change.fieldName;
                    auditChange.fieldType = change.fieldType;
                    auditChange.oldValue = change.oldValue;
                    auditChange.newValue = change.newValue;
                    auditChange.changeType = change.changeType;
                    auditChange.isSensitive = change.isSensitive || false;
                    return auditChange;
                });
                savedLog.changes = await this.auditChangeRepository.save(changes);
            }
            return this.mapAuditLogToDto(savedLog);
        }
        catch (error) {
            console.error("Error creando log de auditoría:", error);
            throw new Error("Error al crear log de auditoría");
        }
    }
    async exportAuditLogs(filters) {
        try {
            const queryBuilder = this.buildAuditQuery(filters);
            const auditLogs = await queryBuilder.getMany();
            let logsWithChanges = auditLogs;
            if (filters.includeChanges) {
                logsWithChanges = await this.loadChangesForLogs(auditLogs);
            }
            const data = logsWithChanges.map((log) => this.mapAuditLogToDto(log));
            switch (filters.format) {
                case "csv":
                    return this.exportToCsv(data, filters);
                case "xlsx":
                    return this.exportToXlsx(data, filters);
                case "json":
                default:
                    return this.exportToJson(data, filters);
            }
        }
        catch (error) {
            console.error("Error exportando logs de auditoría:", error);
            throw new Error("Error al exportar logs de auditoría");
        }
    }
    async cleanOldAuditLogs(daysToKeep = audit_dto_1.AUDIT_VALIDATION_RULES.DEFAULT_RETENTION_DAYS) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            const result = await this.auditLogRepository
                .createQueryBuilder()
                .delete()
                .where("createdAt < :cutoffDate", { cutoffDate })
                .execute();
            return result.affected || 0;
        }
        catch (error) {
            console.error("Error limpiando logs antiguos:", error);
            throw new Error("Error al limpiar logs antiguos");
        }
    }
    buildAuditQuery(filters) {
        const queryBuilder = this.auditLogRepository
            .createQueryBuilder("auditLog")
            .leftJoinAndSelect("auditLog.user", "user");
        if (filters.userId) {
            queryBuilder.andWhere("auditLog.userId = :userId", {
                userId: filters.userId,
            });
        }
        if (filters.userEmail) {
            queryBuilder.andWhere("auditLog.userEmail ILIKE :userEmail", {
                userEmail: `%${filters.userEmail}%`,
            });
        }
        if (filters.userRole) {
            queryBuilder.andWhere("auditLog.userRole = :userRole", {
                userRole: filters.userRole,
            });
        }
        if (filters.action) {
            if (Array.isArray(filters.action)) {
                queryBuilder.andWhere("auditLog.action IN (:...actions)", {
                    actions: filters.action,
                });
            }
            else {
                queryBuilder.andWhere("auditLog.action = :action", {
                    action: filters.action,
                });
            }
        }
        if (filters.module) {
            if (Array.isArray(filters.module)) {
                queryBuilder.andWhere("auditLog.module IN (:...modules)", {
                    modules: filters.module,
                });
            }
            else {
                queryBuilder.andWhere("auditLog.module = :module", {
                    module: filters.module,
                });
            }
        }
        if (filters.entityType) {
            if (Array.isArray(filters.entityType)) {
                queryBuilder.andWhere("auditLog.entityType IN (:...entityTypes)", {
                    entityTypes: filters.entityType,
                });
            }
            else {
                queryBuilder.andWhere("auditLog.entityType = :entityType", {
                    entityType: filters.entityType,
                });
            }
        }
        if (filters.entityId) {
            queryBuilder.andWhere("auditLog.entityId = :entityId", {
                entityId: filters.entityId,
            });
        }
        if (filters.startDate) {
            const startDate = typeof filters.startDate === "string"
                ? new Date(filters.startDate)
                : filters.startDate;
            queryBuilder.andWhere("auditLog.createdAt >= :startDate", { startDate });
        }
        if (filters.endDate) {
            const endDate = typeof filters.endDate === "string"
                ? new Date(filters.endDate)
                : filters.endDate;
            queryBuilder.andWhere("auditLog.createdAt <= :endDate", { endDate });
        }
        if (filters.ipAddress) {
            queryBuilder.andWhere("auditLog.ipAddress = :ipAddress", {
                ipAddress: filters.ipAddress,
            });
        }
        if (filters.sessionId) {
            queryBuilder.andWhere("auditLog.sessionId = :sessionId", {
                sessionId: filters.sessionId,
            });
        }
        if (filters.search) {
            queryBuilder.andWhere(new typeorm_1.Brackets((qb) => {
                qb.where("auditLog.entityName ILIKE :search", {
                    search: `%${filters.search}%`,
                })
                    .orWhere("auditLog.userName ILIKE :search", {
                    search: `%${filters.search}%`,
                })
                    .orWhere("auditLog.userEmail ILIKE :search", {
                    search: `%${filters.search}%`,
                })
                    .orWhere("auditLog.module ILIKE :search", {
                    search: `%${filters.search}%`,
                });
            }));
        }
        return queryBuilder;
    }
    async loadChangesForLogs(logs) {
        if (logs.length === 0)
            return logs;
        const logIds = logs.map((log) => log.id);
        const changes = await this.auditChangeRepository.find({
            where: { auditLogId: { $in: logIds } },
        });
        const changesByLogId = changes.reduce((acc, change) => {
            if (!acc[change.auditLogId]) {
                acc[change.auditLogId] = [];
            }
            acc[change.auditLogId].push(change);
            return acc;
        }, {});
        logs.forEach((log) => {
            log.changes = changesByLogId[log.id] || [];
        });
        return logs;
    }
    mapAuditLogToDto(auditLog) {
        return {
            id: auditLog.id,
            userId: auditLog.userId,
            userEmail: auditLog.userEmail,
            userName: auditLog.userName,
            userRole: auditLog.userRole,
            action: auditLog.action,
            entityType: auditLog.entityType,
            entityId: auditLog.entityId,
            entityName: auditLog.entityName,
            module: auditLog.module,
            operationContext: auditLog.operationContext,
            ipAddress: auditLog.ipAddress,
            ipGeolocation: auditLog.ipCity || auditLog.ipCountry
                ? {
                    city: auditLog.ipCity,
                    country: auditLog.ipCountry,
                    countryCode: auditLog.ipCountryCode,
                    timezone: auditLog.ipTimezone,
                    latitude: auditLog.ipLatitude
                        ? Number(auditLog.ipLatitude)
                        : undefined,
                    longitude: auditLog.ipLongitude
                        ? Number(auditLog.ipLongitude)
                        : undefined,
                    networkCidr: auditLog.ipNetworkCidr,
                    asn: auditLog.ipAsn,
                    isp: auditLog.ipIsp,
                    organization: auditLog.ipOrganization,
                    enrichmentSource: auditLog.ipEnrichmentSource,
                    isPrivateIp: auditLog.ipIsPrivate,
                }
                : undefined,
            userAgent: auditLog.userAgent,
            sessionId: auditLog.sessionId,
            requestPath: auditLog.requestPath,
            requestMethod: auditLog.requestMethod,
            operationSuccess: auditLog.operationSuccess,
            errorMessage: auditLog.errorMessage,
            createdAt: auditLog.createdAt.toISOString(),
            changes: auditLog.changes?.map((change) => this.mapAuditChangeToDto(change)),
            actionDescription: auditLog.getActionDescription(),
            entityDisplayName: auditLog.getEntityDisplayName(),
            fullDescription: auditLog.getFullDescription(),
            changeCount: auditLog.changes?.length || 0,
        };
    }
    mapAuditChangeToDto(change) {
        return {
            id: change.id,
            auditLogId: change.auditLogId,
            fieldName: change.fieldName,
            fieldType: change.fieldType,
            oldValue: change.oldValue,
            newValue: change.newValue,
            changeType: change.changeType,
            isSensitive: change.isSensitive,
            createdAt: change.createdAt.toISOString(),
            changeDescription: change.getChangeDescription(),
            fieldDisplayName: change.getFieldDisplayName(),
            oldDisplayValue: change.getOldDisplayValue(),
            newDisplayValue: change.getNewDisplayValue(),
            fullChangeDescription: change.getFullChangeDescription(),
        };
    }
    exportToCsv(data, filters) {
        const headers = [
            "Fecha",
            "Usuario",
            "Acción",
            "Tipo de Entidad",
            "Nombre de Entidad",
            "Módulo",
            "IP",
            "Descripción Completa",
        ];
        const rows = data.map((log) => [
            log.createdAt,
            log.userName || log.userEmail,
            log.action,
            log.entityType,
            log.entityName || "",
            log.module,
            log.ipAddress || "",
            log.fullDescription || "",
        ]);
        return [headers, ...rows]
            .map((row) => row.map((cell) => `"${cell}"`).join(","))
            .join("\n");
    }
    exportToXlsx(data, filters) {
        return {
            format: "xlsx",
            data,
            message: "XLSX export would be implemented with a proper library",
        };
    }
    exportToJson(data, filters) {
        return {
            metadata: {
                exportDate: new Date().toISOString(),
                totalRecords: data.length,
                filters,
            },
            data,
        };
    }
}
exports.AuditService = AuditService;
