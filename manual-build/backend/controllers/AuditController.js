"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditController = void 0;
const AuditService_1 = require("../services/AuditService");
const audit_dto_1 = require("../dto/audit.dto");
const AuditLog_1 = require("../entities/AuditLog");
class AuditController {
    constructor() {
        this.auditService = new AuditService_1.AuditService();
    }
    async getAuditLogs(req, res) {
        try {
            if (!this.hasAuditViewPermission(req.user)) {
                res.status(403).json({
                    success: false,
                    message: "No tienes permisos para ver logs de auditoría",
                    debug: {
                        user: req.user?.email,
                        role: req.user?.roleName,
                        permissions: req.user?.permissions,
                    },
                });
                return;
            }
            const filters = {
                userId: req.query.userId,
                userEmail: req.query.userEmail,
                userRole: req.query.userRole,
                action: this.parseActionFilter(req.query.action),
                module: this.parseArrayFilter(req.query.module),
                entityType: this.parseArrayFilter(req.query.entityType),
                entityId: req.query.entityId,
                startDate: req.query.startDate
                    ? new Date(req.query.startDate)
                    : undefined,
                endDate: req.query.endDate
                    ? new Date(req.query.endDate)
                    : undefined,
                ipAddress: req.query.ipAddress,
                sessionId: req.query.sessionId,
                search: req.query.search,
                page: parseInt(req.query.page) || 1,
                limit: Math.min(parseInt(req.query.limit) ||
                    audit_dto_1.AUDIT_VALIDATION_RULES.DEFAULT_PAGE_SIZE, audit_dto_1.AUDIT_VALIDATION_RULES.MAX_PAGE_SIZE),
                sortBy: req.query.sortBy || "createdAt",
                sortOrder: req.query.sortOrder || "DESC",
                includeChanges: req.query.includeChanges === "true",
            };
            this.applyScopeFilters(filters, req.user);
            const result = await this.auditService.getAuditLogs(filters);
            res.json({
                success: true,
                data: result.data,
                pagination: {
                    total: result.total,
                    page: result.page,
                    limit: result.limit,
                    totalPages: result.totalPages,
                    hasNextPage: result.hasNextPage,
                    hasPrevPage: result.hasPrevPage,
                },
            });
        }
        catch (error) {
            console.error("Error en getAuditLogs:", error);
            res.status(500).json({
                success: false,
                message: "Error interno del servidor",
                error: error instanceof Error ? error.message : "Error desconocido",
            });
        }
    }
    async getAuditLogById(req, res) {
        try {
            if (!this.hasAuditViewPermission(req.user)) {
                res.status(403).json({
                    success: false,
                    message: "No tienes permisos para ver logs de auditoría",
                });
                return;
            }
            const { id } = req.params;
            if (!id) {
                res.status(400).json({
                    success: false,
                    message: "ID de log de auditoría requerido",
                });
                return;
            }
            const auditLog = await this.auditService.getAuditLogById(id);
            if (!auditLog) {
                res.status(404).json({
                    success: false,
                    message: "Log de auditoría no encontrado",
                });
                return;
            }
            if (!this.canViewAuditLog(auditLog, req.user)) {
                res.status(403).json({
                    success: false,
                    message: "No tienes permisos para ver este log de auditoría",
                });
                return;
            }
            res.json({
                success: true,
                data: auditLog,
            });
        }
        catch (error) {
            console.error("Error en getAuditLogById:", error);
            res.status(500).json({
                success: false,
                message: "Error interno del servidor",
                error: error instanceof Error ? error.message : "Error desconocido",
            });
        }
    }
    async getEntityHistory(req, res) {
        try {
            if (!this.hasAuditViewPermission(req.user)) {
                res.status(403).json({
                    success: false,
                    message: "No tienes permisos para ver historial de entidades",
                });
                return;
            }
            const { entityType, entityId } = req.params;
            const includeChanges = req.query.includeChanges === "true";
            if (!entityType || !entityId) {
                res.status(400).json({
                    success: false,
                    message: "Tipo de entidad y ID requeridos",
                });
                return;
            }
            const history = await this.auditService.getEntityHistory(entityType, entityId, includeChanges);
            res.json({
                success: true,
                data: history,
            });
        }
        catch (error) {
            console.error("Error en getEntityHistory:", error);
            res.status(500).json({
                success: false,
                message: "Error interno del servidor",
                error: error instanceof Error ? error.message : "Error desconocido",
            });
        }
    }
    async getAuditStatistics(req, res) {
        try {
            if (!this.hasAuditAdminPermission(req.user)) {
                res.status(403).json({
                    success: false,
                    message: "No tienes permisos para ver estadísticas de auditoría",
                });
                return;
            }
            const days = parseInt(req.query.days) || 30;
            if (days < 1 || days > 365) {
                res.status(400).json({
                    success: false,
                    message: "El número de días debe estar entre 1 y 365",
                });
                return;
            }
            const statistics = await this.auditService.getAuditStatistics(days);
            res.json({
                success: true,
                data: statistics,
            });
        }
        catch (error) {
            console.error("Error en getAuditStatistics:", error);
            res.status(500).json({
                success: false,
                message: "Error interno del servidor",
                error: error instanceof Error ? error.message : "Error desconocido",
            });
        }
    }
    async exportAuditLogs(req, res) {
        try {
            if (!this.hasAuditExportPermission(req.user)) {
                res.status(403).json({
                    success: false,
                    message: "No tienes permisos para exportar logs de auditoría",
                });
                return;
            }
            const filters = {
                ...req.body,
                format: req.body.format || "json",
                includeHeaders: req.body.includeHeaders !== false,
                includeSensitiveData: req.body.includeSensitiveData === true &&
                    this.hasAuditAdminPermission(req.user),
            };
            this.applyScopeFilters(filters, req.user);
            if (!["csv", "xlsx", "json"].includes(filters.format)) {
                res.status(400).json({
                    success: false,
                    message: "Formato de exportación no válido. Use: csv, xlsx, json",
                });
                return;
            }
            const exportData = await this.auditService.exportAuditLogs(filters);
            switch (filters.format) {
                case "csv":
                    res.setHeader("Content-Type", "text/csv");
                    res.setHeader("Content-Disposition", "attachment; filename=audit_logs.csv");
                    res.send(exportData);
                    break;
                case "xlsx":
                    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
                    res.setHeader("Content-Disposition", "attachment; filename=audit_logs.xlsx");
                    res.send(exportData);
                    break;
                case "json":
                default:
                    res.setHeader("Content-Type", "application/json");
                    res.setHeader("Content-Disposition", "attachment; filename=audit_logs.json");
                    res.json(exportData);
                    break;
            }
        }
        catch (error) {
            console.error("Error en exportAuditLogs:", error);
            res.status(500).json({
                success: false,
                message: "Error interno del servidor",
                error: error instanceof Error ? error.message : "Error desconocido",
            });
        }
    }
    async createAuditLog(req, res) {
        try {
            if (!this.hasAuditAdminPermission(req.user)) {
                res.status(403).json({
                    success: false,
                    message: "No tienes permisos para crear logs de auditoría manualmente",
                });
                return;
            }
            const auditLogData = {
                ...req.body,
                userId: req.body.userId || req.user.id,
                userEmail: req.body.userEmail || req.user.email,
                userName: req.body.userName || req.user.fullName,
                userRole: req.body.userRole || req.user.roleName,
            };
            const validationError = this.validateAuditLogData(auditLogData);
            if (validationError) {
                res.status(400).json({
                    success: false,
                    message: validationError,
                });
                return;
            }
            const createdLog = await this.auditService.createAuditLog(auditLogData);
            res.status(201).json({
                success: true,
                data: createdLog,
                message: "Log de auditoría creado exitosamente",
            });
        }
        catch (error) {
            console.error("Error en createAuditLog:", error);
            res.status(500).json({
                success: false,
                message: "Error interno del servidor",
                error: error instanceof Error ? error.message : "Error desconocido",
            });
        }
    }
    async cleanupOldLogs(req, res) {
        try {
            if (!this.hasAuditAdminPermission(req.user)) {
                res.status(403).json({
                    success: false,
                    message: "No tienes permisos para limpiar logs de auditoría",
                });
                return;
            }
            const daysToKeep = parseInt(req.body.daysToKeep) ||
                audit_dto_1.AUDIT_VALIDATION_RULES.DEFAULT_RETENTION_DAYS;
            if (daysToKeep < 30 ||
                daysToKeep > audit_dto_1.AUDIT_VALIDATION_RULES.MAX_RETENTION_DAYS) {
                res.status(400).json({
                    success: false,
                    message: `Los días a conservar deben estar entre 30 y ${audit_dto_1.AUDIT_VALIDATION_RULES.MAX_RETENTION_DAYS}`,
                });
                return;
            }
            const deletedCount = await this.auditService.cleanOldAuditLogs(daysToKeep);
            res.json({
                success: true,
                data: {
                    deletedCount,
                    daysToKeep,
                },
                message: `Se eliminaron ${deletedCount} logs de auditoría antiguos`,
            });
        }
        catch (error) {
            console.error("Error en cleanupOldLogs:", error);
            res.status(500).json({
                success: false,
                message: "Error interno del servidor",
                error: error instanceof Error ? error.message : "Error desconocido",
            });
        }
    }
    hasAuditViewPermission(user) {
        if (!user)
            return false;
        return (user.permissions?.includes("audit.view.own") ||
            user.permissions?.includes("audit.view.team") ||
            user.permissions?.includes("audit.view.all") ||
            user.roleName === "Administrador");
    }
    hasAuditExportPermission(user) {
        if (!user)
            return false;
        return (user.permissions?.includes("audit.export.own") ||
            user.permissions?.includes("audit.export.team") ||
            user.permissions?.includes("audit.export.all") ||
            user.roleName === "Administrador");
    }
    hasAuditAdminPermission(user) {
        if (!user)
            return false;
        return (user.permissions?.includes("audit.admin.all") ||
            user.permissions?.includes("audit.config.all") ||
            user.roleName === "Administrador");
    }
    canViewAuditLog(auditLog, user) {
        if (user.roleName === "Administrador" ||
            user.permissions?.includes("audit.view.all")) {
            return true;
        }
        if (user.permissions?.includes("audit.view.own")) {
            return auditLog.userId === user.id;
        }
        if (user.permissions?.includes("audit.view.team")) {
            return true;
        }
        return false;
    }
    applyScopeFilters(filters, user) {
        if (user.roleName === "Administrador" ||
            user.permissions?.includes("audit.view.all")) {
            return;
        }
        if (user.permissions?.includes("audit.view.own")) {
            filters.userId = user.id;
            return;
        }
        if (user.permissions?.includes("audit.view.team")) {
            return;
        }
        filters.userId = user.id;
    }
    parseActionFilter(action) {
        if (!action)
            return undefined;
        if (typeof action === "string") {
            if (action.includes(",")) {
                return action.split(",");
            }
            return action;
        }
        if (Array.isArray(action)) {
            return action;
        }
        return undefined;
    }
    parseArrayFilter(filter) {
        if (!filter)
            return undefined;
        if (typeof filter === "string") {
            if (filter.includes(",")) {
                return filter.split(",");
            }
            return filter;
        }
        if (Array.isArray(filter)) {
            return filter;
        }
        return undefined;
    }
    validateAuditLogData(data) {
        if (!data.userEmail) {
            return "Email de usuario requerido";
        }
        if (!data.action) {
            return "Acción requerida";
        }
        if (!Object.values(AuditLog_1.AuditAction).includes(data.action)) {
            return "Acción no válida";
        }
        if (!data.entityType) {
            return "Tipo de entidad requerido";
        }
        if (!data.entityId) {
            return "ID de entidad requerido";
        }
        if (!data.module) {
            return "Módulo requerido";
        }
        if (data.entityName &&
            data.entityName.length > audit_dto_1.AUDIT_VALIDATION_RULES.MAX_ENTITY_NAME_LENGTH) {
            return `Nombre de entidad demasiado largo (máximo ${audit_dto_1.AUDIT_VALIDATION_RULES.MAX_ENTITY_NAME_LENGTH} caracteres)`;
        }
        if (data.userName &&
            data.userName.length > audit_dto_1.AUDIT_VALIDATION_RULES.MAX_USER_NAME_LENGTH) {
            return `Nombre de usuario demasiado largo (máximo ${audit_dto_1.AUDIT_VALIDATION_RULES.MAX_USER_NAME_LENGTH} caracteres)`;
        }
        if (data.module.length > audit_dto_1.AUDIT_VALIDATION_RULES.MAX_MODULE_LENGTH) {
            return `Nombre de módulo demasiado largo (máximo ${audit_dto_1.AUDIT_VALIDATION_RULES.MAX_MODULE_LENGTH} caracteres)`;
        }
        return null;
    }
}
exports.AuditController = AuditController;
