"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditMiddleware = void 0;
const database_1 = require("../config/database");
const AuditLog_1 = require("../entities/AuditLog");
const AuditEntityChange_1 = require("../entities/AuditEntityChange");
const audit_dto_1 = require("../dto/audit.dto");
class AuditMiddleware {
    static async waitForDataSource(maxWaitMs = 10000) {
        const startTime = Date.now();
        while (!database_1.AppDataSource.isInitialized && Date.now() - startTime < maxWaitMs) {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
        return database_1.AppDataSource.isInitialized;
    }
    static async getAuditLogRepository() {
        const isReady = await _a.waitForDataSource();
        if (!isReady) {
            console.error("DataSource no está inicializado para obtener el repositorio de AuditLog después de esperar");
            return null;
        }
        return database_1.AppDataSource.getRepository(AuditLog_1.AuditLog);
    }
    static async getAuditChangeRepository() {
        const isReady = await _a.waitForDataSource();
        if (!isReady) {
            console.error("DataSource no está inicializado para obtener el repositorio de AuditEntityChange después de esperar");
            return null;
        }
        return database_1.AppDataSource.getRepository(AuditEntityChange_1.AuditEntityChange);
    }
    static async logManualAudit(context, action, entityType, entityId, entityName, changes = [], operationContext) {
        try {
            await _a.logAudit({
                context,
                action,
                entityType,
                entityId,
                entityName,
                changes,
                operationContext,
            });
        }
        catch (error) {
            console.error("Error en auditoría manual:", error);
            throw error;
        }
    }
    static async logAudit(metadata) {
        try {
            const { context, action, entityType, entityId, entityName, changes, operationContext, } = metadata;
            if (!context.userId || !entityId || !entityType) {
                console.warn("Auditoría saltada por datos faltantes:", {
                    userId: context.userId,
                    entityId,
                    entityType,
                    action,
                });
                return;
            }
            const auditLog = new AuditLog_1.AuditLog();
            auditLog.userId = context.userId;
            auditLog.userEmail = context.userEmail;
            auditLog.userName = context.userName;
            auditLog.userRole = context.userRole;
            auditLog.action = action;
            auditLog.entityType = entityType;
            auditLog.entityId = entityId;
            auditLog.entityName = entityName || `${entityType}:${entityId}`;
            auditLog.module = context.module;
            auditLog.operationContext = operationContext;
            auditLog.ipAddress = context.ipAddress;
            auditLog.userAgent = context.userAgent;
            auditLog.sessionId = context.sessionId;
            auditLog.requestPath = context.requestPath;
            auditLog.requestMethod = context.requestMethod;
            const responseStatus = operationContext?.responseStatus;
            auditLog.operationSuccess = responseStatus >= 200 && responseStatus < 300;
            if (!auditLog.operationSuccess) {
                auditLog.errorMessage =
                    operationContext?.error?.message ||
                        operationContext?.errorMessage ||
                        `HTTP ${responseStatus}`;
            }
            const auditLogRepository = await _a.getAuditLogRepository();
            if (!auditLogRepository) {
                console.error("No se pudo obtener el repositorio de AuditLog");
                return;
            }
            const savedAuditLog = await auditLogRepository.save(auditLog);
            console.log(`✅ Auditoría registrada: ${action} en ${entityType} (${entityId}) por ${context.userName}`);
            if (changes && changes.length > 0) {
                const auditChanges = changes.map((change) => {
                    const auditChange = new AuditEntityChange_1.AuditEntityChange();
                    auditChange.auditLogId = savedAuditLog.id;
                    auditChange.fieldName = change.field;
                    auditChange.fieldType =
                        change.type ||
                            _a.inferFieldType(change.newValue || change.oldValue);
                    auditChange.oldValue =
                        _a.serializeValue(change.oldValue) || undefined;
                    auditChange.newValue =
                        _a.serializeValue(change.newValue) || undefined;
                    auditChange.changeType = _a.determineChangeType(change);
                    auditChange.isSensitive =
                        change.isSensitive ||
                            _a.isSensitiveField(change.field);
                    return auditChange;
                });
                const auditChangeRepository = await _a.getAuditChangeRepository();
                if (!auditChangeRepository) {
                    console.error("No se pudo obtener el repositorio de AuditEntityChange");
                    return;
                }
                await auditChangeRepository.save(auditChanges);
                console.log(`✅ ${auditChanges.length} cambios de auditoría guardados`);
            }
        }
        catch (error) {
            console.error("❌ Error guardando auditoría:", error);
        }
    }
    static extractModuleFromPath(path) {
        const segments = path.split("/").filter(Boolean);
        if (segments.includes("admin"))
            return audit_dto_1.AuditModule.ADMIN;
        if (segments.includes("archive"))
            return audit_dto_1.AuditModule.ARCHIVE;
        if (segments.includes("auth"))
            return audit_dto_1.AuditModule.AUTH;
        if (segments.includes("dashboard"))
            return audit_dto_1.AuditModule.DASHBOARD;
        if (segments.includes("cases"))
            return audit_dto_1.AuditModule.CASES;
        if (segments.includes("todos"))
            return audit_dto_1.AuditModule.TODOS;
        if (segments.includes("users"))
            return audit_dto_1.AuditModule.USERS;
        if (segments.includes("roles"))
            return audit_dto_1.AuditModule.ROLES;
        if (segments.includes("permissions"))
            return audit_dto_1.AuditModule.PERMISSIONS;
        if (segments.includes("notes"))
            return audit_dto_1.AuditModule.NOTES;
        if (segments.includes("manual-time-entries"))
            return audit_dto_1.AuditModule.MANUAL_TIME_ENTRIES;
        if (segments.includes("time-entries"))
            return audit_dto_1.AuditModule.TIME_TRACKING;
        if (segments.includes("time"))
            return audit_dto_1.AuditModule.TIME_TRACKING;
        if (segments.includes("knowledge"))
            return "knowledge";
        if (segments.includes("applications"))
            return "applications";
        if (segments.includes("origins"))
            return "origins";
        if (segments.includes("case-statuses"))
            return "case_statuses";
        if (segments.includes("todo-priorities"))
            return "todo_priorities";
        if (segments.includes("document-types"))
            return "document_types";
        if (segments.includes("files"))
            return "files";
        if (segments.includes("metrics"))
            return "reports";
        if (segments[0] === "api" && segments[1]) {
            const module = segments[1];
            if (module === "manual-time-entries")
                return audit_dto_1.AuditModule.MANUAL_TIME_ENTRIES;
            if (module === "time-entries")
                return audit_dto_1.AuditModule.TIME_TRACKING;
            if (module === "applications")
                return "applications";
            if (module === "origins")
                return "origins";
            if (module === "case-statuses")
                return "case_statuses";
            if (module === "knowledge")
                return "knowledge";
            if (module === "document-types")
                return "document_types";
            if (module === "files")
                return "files";
            if (module === "metrics")
                return "reports";
            return module;
        }
        return segments[1] || "unknown";
    }
    static extractIpAddress(req) {
        return (req.ip ||
            req.get("x-forwarded-for")?.split(",")[0] ||
            req.get("x-real-ip") ||
            req.connection.remoteAddress ||
            "unknown");
    }
    static getEntityTypeFromRoute(path) {
        for (const [route, entityType] of Object.entries(_a.ROUTE_ENTITY_MAPPING)) {
            if (path.includes(route.replace("/api/", ""))) {
                return entityType;
            }
        }
        const segments = path.split("/").filter(Boolean);
        return segments[segments.length - 1] || "unknown";
    }
    static extractEntityName(entity) {
        if (!entity)
            return "unknown";
        return (entity.title ||
            entity.name ||
            entity.fullName ||
            entity.email ||
            entity.description ||
            entity.caseNumber ||
            `ID: ${entity.id}`);
    }
    static async getOriginalEntity(entityType, entityId) {
        try {
            const entityRepositoryMap = {
                manual_time_entries: "ManualTimeEntry",
                cases: "Case",
                todos: "Todo",
                users: "UserProfile",
                roles: "Role",
                permissions: "Permission",
                notes: "Note",
                time_entries: "TimeEntry",
                applications: "Application",
                origins: "Origin",
                dispositions: "Disposition",
            };
            const entityName = entityRepositoryMap[entityType];
            if (!entityName) {
                console.warn(`Tipo de entidad no mapeado: ${entityType}`);
                return null;
            }
            let EntityClass;
            try {
                switch (entityName) {
                    case "ManualTimeEntry":
                        const { ManualTimeEntry } = await Promise.resolve().then(() => __importStar(require("../entities/ManualTimeEntry")));
                        EntityClass = ManualTimeEntry;
                        break;
                    case "Case":
                        const { Case } = await Promise.resolve().then(() => __importStar(require("../entities/Case")));
                        EntityClass = Case;
                        break;
                    case "Todo":
                        const { Todo } = await Promise.resolve().then(() => __importStar(require("../entities/Todo")));
                        EntityClass = Todo;
                        break;
                    case "UserProfile":
                        const { UserProfile } = await Promise.resolve().then(() => __importStar(require("../entities/UserProfile")));
                        EntityClass = UserProfile;
                        break;
                    case "Role":
                        const { Role } = await Promise.resolve().then(() => __importStar(require("../entities/Role")));
                        EntityClass = Role;
                        break;
                    case "TimeEntry":
                        const { TimeEntry } = await Promise.resolve().then(() => __importStar(require("../entities/TimeEntry")));
                        EntityClass = TimeEntry;
                        break;
                    default:
                        console.warn(`Entidad no implementada: ${entityName}`);
                        return null;
                }
                const repository = database_1.AppDataSource.getRepository(EntityClass);
                const entity = await repository.findOne({
                    where: { id: entityId },
                });
                return entity;
            }
            catch (importError) {
                console.error(`Error importando entidad ${entityName}:`, importError);
                return null;
            }
        }
        catch (error) {
            console.error("Error obteniendo entidad original:", error);
            return null;
        }
    }
    static generateChangesForCreate(data) {
        if (!data || typeof data !== "object")
            return [];
        return Object.entries(data)
            .filter(([key, value]) => value !== undefined && value !== null)
            .map(([key, value]) => ({
            field: key,
            oldValue: null,
            newValue: value,
            type: _a.inferFieldType(value),
            isSensitive: _a.isSensitiveField(key),
        }));
    }
    static generateChangesForUpdate(originalData, updateData) {
        if (!updateData || typeof updateData !== "object")
            return [];
        const changes = [];
        for (const [key, newValue] of Object.entries(updateData)) {
            const oldValue = originalData?.[key];
            if (_a.valuesAreDifferent(oldValue, newValue)) {
                changes.push({
                    field: key,
                    oldValue,
                    newValue,
                    type: _a.inferFieldType(newValue),
                    isSensitive: _a.isSensitiveField(key),
                });
            }
        }
        return changes;
    }
    static generateChangesForDelete(data) {
        if (!data || typeof data !== "object")
            return [];
        return Object.entries(data)
            .filter(([key, value]) => value !== undefined && value !== null)
            .map(([key, value]) => ({
            field: key,
            oldValue: value,
            newValue: null,
            type: _a.inferFieldType(value),
            isSensitive: _a.isSensitiveField(key),
        }));
    }
    static determineChangeType(change) {
        if (change.oldValue === null && change.newValue !== null) {
            return AuditEntityChange_1.ChangeType.ADDED;
        }
        if (change.oldValue !== null && change.newValue === null) {
            return AuditEntityChange_1.ChangeType.REMOVED;
        }
        return AuditEntityChange_1.ChangeType.MODIFIED;
    }
    static valuesAreDifferent(oldValue, newValue) {
        if (typeof oldValue === "object" && typeof newValue === "object") {
            return JSON.stringify(oldValue) !== JSON.stringify(newValue);
        }
        return oldValue !== newValue;
    }
    static inferFieldType(value) {
        if (value === null || value === undefined)
            return "null";
        if (typeof value === "boolean")
            return "boolean";
        if (typeof value === "number")
            return "number";
        if (typeof value === "string") {
            if (/^\d{4}-\d{2}-\d{2}/.test(value))
                return "date";
            return "string";
        }
        if (Array.isArray(value))
            return "array";
        if (typeof value === "object")
            return "json";
        return "unknown";
    }
    static isSensitiveField(fieldName) {
        const lowerFieldName = fieldName.toLowerCase();
        return _a.SENSITIVE_FIELDS.some((sensitive) => lowerFieldName.includes(sensitive));
    }
    static serializeValue(value) {
        if (value === null || value === undefined)
            return null;
        if (typeof value === "string")
            return value;
        try {
            return JSON.stringify(value);
        }
        catch {
            return String(value);
        }
    }
    static captureOperations() {
        return async (req, res, next) => {
            try {
                if (!req.path.startsWith("/api/") ||
                    req.path.startsWith("/api/audit/")) {
                    return next();
                }
                _a.initializeAuditContext(req, res, () => { });
                switch (req.method) {
                    case "POST":
                        if (!req.path.includes("/login") && !req.path.includes("/auth")) {
                            const entityType = _a.getEntityTypeFromRoute(req.path);
                            _a.auditCreate(entityType)(req, res, () => { });
                        }
                        break;
                    case "PUT":
                    case "PATCH":
                        const entityTypeUpdate = _a.getEntityTypeFromRoute(req.path);
                        _a.auditUpdate(entityTypeUpdate)(req, res, () => { });
                        break;
                    case "DELETE":
                        const entityTypeDelete = _a.getEntityTypeFromRoute(req.path);
                        _a.auditDelete(entityTypeDelete)(req, res, () => { });
                        break;
                }
                next();
            }
            catch (error) {
                console.error("Error in audit middleware:", error);
                next();
            }
        };
    }
}
exports.AuditMiddleware = AuditMiddleware;
_a = AuditMiddleware;
AuditMiddleware.SENSITIVE_FIELDS = [
    "password",
    "token",
    "secret",
    "key",
    "hash",
    "salt",
    "credit_card",
    "ssn",
    "social_security",
];
AuditMiddleware.ROUTE_ENTITY_MAPPING = {
    "/api/cases": audit_dto_1.AuditEntityType.CASE,
    "/api/todos": audit_dto_1.AuditEntityType.TODO,
    "/api/users": audit_dto_1.AuditEntityType.USER_PROFILE,
    "/api/roles": audit_dto_1.AuditEntityType.ROLE,
    "/api/permissions": audit_dto_1.AuditEntityType.PERMISSION,
    "/api/notes": audit_dto_1.AuditEntityType.NOTE,
    "/api/time-entries": audit_dto_1.AuditEntityType.TIME_ENTRY,
    "/api/manual-time-entries": "manual_time_entries",
    "/api/applications": audit_dto_1.AuditEntityType.APPLICATION,
    "/api/origins": audit_dto_1.AuditEntityType.ORIGIN,
    "/api/dispositions": audit_dto_1.AuditEntityType.DISPOSITION,
    "/api/case-statuses": "case_status_control",
    "/api/admin/case-statuses": "case_status_control",
    "/api/admin/todo-priorities": "todo_priorities",
    "/api/knowledge": audit_dto_1.AuditEntityType.KNOWLEDGE_DOCUMENT,
    "/api/knowledge/tags": "knowledge_tags",
    "/api/document-types": "document_types",
    "/api/archive/cases": audit_dto_1.AuditEntityType.ARCHIVED_CASE,
    "/api/archive/todos": audit_dto_1.AuditEntityType.ARCHIVED_TODO,
    "/api/files": "file_operations",
    "/api/metrics": "report_access",
};
AuditMiddleware.initializeAuditContext = (req, res, next) => {
    try {
        const user = req.user;
        req.auditContext = {
            userId: user?.id || "sistema",
            userEmail: user?.email || "sistema@unknown.com",
            userName: user?.fullName || user?.name || "Usuario del Sistema",
            userRole: user?.roleName || user?.role || "unknown",
            module: _a.extractModuleFromPath(req.originalUrl || req.path),
            ipAddress: _a.extractIpAddress(req),
            userAgent: req.get("User-Agent"),
            sessionId: req.sessionID || req.get("x-session-id"),
            requestPath: req.originalUrl || req.path,
            requestMethod: req.method,
        };
        if (req.method === "PUT" || req.method === "PATCH") {
            req.originalBody = { ...req.body };
            req.originalParams = { ...req.params };
        }
        next();
    }
    catch (error) {
        console.error("Error inicializando contexto de auditoría:", error);
        next();
    }
};
AuditMiddleware.auditCreate = (entityType) => {
    return async (req, res, next) => {
        const originalSend = res.send;
        res.send = function (data) {
            res.send = originalSend;
            try {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    let responseData;
                    try {
                        responseData = typeof data === "string" ? JSON.parse(data) : data;
                    }
                    catch {
                        responseData = data;
                    }
                    const entity = responseData.data || responseData;
                    if (entity && entity.id) {
                        const auditEntityType = entityType || _a.getEntityTypeFromRoute(req.path);
                        const entityName = _a.extractEntityName(entity);
                        const changes = _a.generateChangesForCreate(req.body);
                        _a.logAudit({
                            context: req.auditContext,
                            action: AuditLog_1.AuditAction.CREATE,
                            entityType: auditEntityType,
                            entityId: entity.id,
                            entityName,
                            changes,
                            operationContext: {
                                requestBody: req.body,
                                responseStatus: res.statusCode,
                            },
                        }).catch((error) => {
                            console.error("Error registrando auditoría CREATE:", error);
                        });
                    }
                }
            }
            catch (error) {
                console.error("Error en auditoría CREATE:", error);
            }
            return originalSend.call(this, data);
        };
        next();
    };
};
AuditMiddleware.auditUpdate = (entityType) => {
    return async (req, res, next) => {
        let originalEntity = null;
        try {
            const entityId = req.params.id;
            if (entityId) {
                originalEntity = await _a.getOriginalEntity(entityType || _a.getEntityTypeFromRoute(req.path), entityId);
            }
        }
        catch (error) {
            console.error("Error obteniendo entidad original para auditoría:", error);
        }
        const originalSend = res.send;
        res.send = function (data) {
            res.send = originalSend;
            try {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    let responseData;
                    try {
                        responseData = typeof data === "string" ? JSON.parse(data) : data;
                    }
                    catch {
                        responseData = data;
                    }
                    const entity = responseData.data || responseData;
                    if (entity && entity.id) {
                        const auditEntityType = entityType || _a.getEntityTypeFromRoute(req.path);
                        const entityName = _a.extractEntityName(entity);
                        const changes = _a.generateChangesForUpdate(originalEntity, req.body);
                        if (changes.length > 0) {
                            _a.logAudit({
                                context: req.auditContext,
                                action: AuditLog_1.AuditAction.UPDATE,
                                entityType: auditEntityType,
                                entityId: entity.id,
                                entityName,
                                changes,
                                operationContext: {
                                    originalData: originalEntity,
                                    updateData: req.body,
                                    responseStatus: res.statusCode,
                                },
                            }).catch((error) => {
                                console.error("Error registrando auditoría UPDATE:", error);
                            });
                        }
                    }
                }
            }
            catch (error) {
                console.error("Error en auditoría UPDATE:", error);
            }
            return originalSend.call(this, data);
        };
        next();
    };
};
AuditMiddleware.auditDelete = (entityType) => {
    return async (req, res, next) => {
        let originalEntity = null;
        try {
            const entityId = req.params.id;
            if (entityId) {
                originalEntity = await _a.getOriginalEntity(entityType || _a.getEntityTypeFromRoute(req.path), entityId);
            }
        }
        catch (error) {
            console.error("Error obteniendo entidad para DELETE:", error);
        }
        const originalSend = res.send;
        res.send = function (data) {
            res.send = originalSend;
            try {
                if (res.statusCode >= 200 && res.statusCode < 300 && originalEntity) {
                    const auditEntityType = entityType || _a.getEntityTypeFromRoute(req.path);
                    const entityName = _a.extractEntityName(originalEntity);
                    const changes = _a.generateChangesForDelete(originalEntity);
                    _a.logAudit({
                        context: req.auditContext,
                        action: AuditLog_1.AuditAction.DELETE,
                        entityType: auditEntityType,
                        entityId: originalEntity.id,
                        entityName,
                        changes,
                        operationContext: {
                            deletedData: originalEntity,
                            responseStatus: res.statusCode,
                        },
                    }).catch((error) => {
                        console.error("Error registrando auditoría DELETE:", error);
                    });
                }
            }
            catch (error) {
                console.error("Error en auditoría DELETE:", error);
            }
            return originalSend.call(this, data);
        };
        next();
    };
};
AuditMiddleware.auditDownload = (entityType) => {
    return (req, res, next) => {
        try {
            const originalSend = res.send;
            res.send = function (data) {
                try {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        const auditContext = req.auditContext;
                        if (!auditContext)
                            return originalSend.call(this, data);
                        const fileName = req.params.fileName || "archivo_desconocido";
                        const changes = [
                            {
                                field: "fileName",
                                newValue: fileName,
                                oldValue: null,
                            },
                        ];
                        _a.logManualAudit(auditContext, AuditLog_1.AuditAction.DOWNLOAD, entityType || "file_downloads", fileName, fileName, changes, {
                            requestBody: req.params,
                            responseStatus: res.statusCode,
                            downloadUrl: req.originalUrl,
                        }).catch((error) => {
                            console.error("Error registrando auditoría DOWNLOAD:", error);
                        });
                    }
                }
                catch (error) {
                    console.error("Error en auditoría DOWNLOAD:", error);
                }
                return originalSend.call(this, data);
            };
            next();
        }
        catch (error) {
            console.error("Error en middleware DOWNLOAD:", error);
            next();
        }
    };
};
AuditMiddleware.auditView = (entityType) => {
    return (req, res, next) => {
        try {
            const originalSend = res.send;
            res.send = function (data) {
                try {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        const auditContext = req.auditContext;
                        if (!auditContext)
                            return originalSend.call(this, data);
                        const fileName = req.params.fileName || "archivo_desconocido";
                        const changes = [
                            {
                                field: "fileName",
                                newValue: fileName,
                                oldValue: null,
                            },
                        ];
                        _a.logManualAudit(auditContext, AuditLog_1.AuditAction.VIEW, entityType || "file_views", fileName, fileName, changes, {
                            requestBody: req.params,
                            responseStatus: res.statusCode,
                            viewUrl: req.originalUrl,
                        }).catch((error) => {
                            console.error("Error registrando auditoría VIEW:", error);
                        });
                    }
                }
                catch (error) {
                    console.error("Error en auditoría VIEW:", error);
                }
                return originalSend.call(this, data);
            };
            next();
        }
        catch (error) {
            console.error("Error en middleware VIEW:", error);
            next();
        }
    };
};
AuditMiddleware.auditReportAccess = (entityType) => {
    return (req, res, next) => {
        try {
            const originalSend = res.send;
            res.send = function (data) {
                try {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        const auditContext = req.auditContext;
                        if (!auditContext)
                            return originalSend.call(this, data);
                        const reportType = req.path.split("/").pop() || "reporte_desconocido";
                        const changes = [
                            {
                                field: "reportType",
                                newValue: reportType,
                                oldValue: null,
                            },
                        ];
                        _a.logManualAudit(auditContext, AuditLog_1.AuditAction.READ, entityType || "report_access", reportType, `Reporte: ${reportType}`, changes, {
                            requestBody: req.query,
                            responseStatus: res.statusCode,
                            reportPath: req.originalUrl,
                        }).catch((error) => {
                            console.error("Error registrando auditoría REPORT:", error);
                        });
                    }
                }
                catch (error) {
                    console.error("Error en auditoría REPORT:", error);
                }
                return originalSend.call(this, data);
            };
            next();
        }
        catch (error) {
            console.error("Error en middleware REPORT:", error);
            next();
        }
    };
};
