import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/database";
import { AuditLog, AuditAction } from "../entities/AuditLog";
import { AuditEntityChange, ChangeType } from "../entities/AuditEntityChange";
import {
  AuditContext,
  AuditMetadata,
  EntityChange,
  AuditModule,
  AuditEntityType,
} from "../dto/audit.dto";

// Interface para requests con información de auditoría
export interface AuditableRequest extends Request {
  user?: any;
  auditContext?: AuditContext;
  auditMetadata?: AuditMetadata;
  originalBody?: any;
  originalParams?: any;
}

/**
 * Middleware principal de auditoría que registra automáticamente todas las operaciones CRUD
 */
export class AuditMiddleware {
  /**
   * Espera hasta que el DataSource esté inicializado
   */
  private static async waitForDataSource(
    maxWaitMs: number = 10000
  ): Promise<boolean> {
    const startTime = Date.now();

    while (!AppDataSource.isInitialized && Date.now() - startTime < maxWaitMs) {
      await new Promise((resolve) => setTimeout(resolve, 100)); // Esperar 100ms
    }

    return AppDataSource.isInitialized;
  }

  /**
   * Obtiene el repositorio de AuditLog dinámicamente con espera
   */
  private static async getAuditLogRepository() {
    const isReady = await AuditMiddleware.waitForDataSource();
    if (!isReady) {
      console.error(
        "DataSource no está inicializado para obtener el repositorio de AuditLog después de esperar"
      );
      return null;
    }
    return AppDataSource.getRepository(AuditLog);
  }

  /**
   * Obtiene el repositorio de AuditEntityChange dinámicamente con espera
   */
  private static async getAuditChangeRepository() {
    const isReady = await AuditMiddleware.waitForDataSource();
    if (!isReady) {
      console.error(
        "DataSource no está inicializado para obtener el repositorio de AuditEntityChange después de esperar"
      );
      return null;
    }
    return AppDataSource.getRepository(AuditEntityChange);
  }

  /**
   * Campos sensibles que no deben ser registrados en texto plano
   */
  private static readonly SENSITIVE_FIELDS = [
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

  /**
   * Mapeo de rutas a tipos de entidad
   */
  private static readonly ROUTE_ENTITY_MAPPING: Record<string, string> = {
    "/api/cases": AuditEntityType.CASE,
    "/api/todos": AuditEntityType.TODO,
    "/api/users": AuditEntityType.USER_PROFILE,
    "/api/roles": AuditEntityType.ROLE,
    "/api/permissions": AuditEntityType.PERMISSION,
    "/api/notes": AuditEntityType.NOTE,
    "/api/time-entries": AuditEntityType.TIME_ENTRY,
    "/api/manual-time-entries": "manual_time_entries",
    "/api/applications": AuditEntityType.APPLICATION,
    "/api/origins": AuditEntityType.ORIGIN,
    "/api/dispositions": AuditEntityType.DISPOSITION,
    "/api/case-statuses": "case_status_control",
    "/api/admin/case-statuses": "case_status_control",
    "/api/admin/todo-priorities": "todo_priorities",
    "/api/knowledge": AuditEntityType.KNOWLEDGE_DOCUMENT,
    "/api/knowledge/tags": "knowledge_tags",
    "/api/document-types": "document_types",
    "/api/archive/cases": AuditEntityType.ARCHIVED_CASE,
    "/api/archive/todos": AuditEntityType.ARCHIVED_TODO,
    "/api/files": "file_operations",
    "/api/metrics": "report_access",
  };

  /**
   * Inicializar contexto de auditoría desde la request
   */
  static initializeAuditContext = (
    req: AuditableRequest,
    res: Response,
    next: NextFunction
  ): void => {
    try {
      // Extraer información del usuario de la request
      const user = req.user;

      // Crear contexto de auditoría
      req.auditContext = {
        userId: user?.id || "sistema",
        userEmail: user?.email || "sistema@unknown.com",
        userName: user?.fullName || user?.name || "Usuario del Sistema",
        userRole: user?.roleName || user?.role || "unknown",
        module: AuditMiddleware.extractModuleFromPath(
          req.originalUrl || req.path
        ),
        ipAddress: AuditMiddleware.extractIpAddress(req),
        userAgent: req.get("User-Agent"),
        sessionId: (req as any).sessionID || req.get("x-session-id"),
        requestPath: req.originalUrl || req.path,
        requestMethod: req.method,
      };

      // Almacenar datos originales para comparación
      if (req.method === "PUT" || req.method === "PATCH") {
        req.originalBody = { ...req.body };
        req.originalParams = { ...req.params };
      }

      next();
    } catch (error) {
      console.error("Error inicializando contexto de auditoría:", error);
      next();
    }
  };

  /**
   * Middleware para registrar operaciones CREATE
   */
  static auditCreate = (entityType?: string) => {
    return async (
      req: AuditableRequest,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      // Interceptar la respuesta para obtener el ID de la entidad creada
      const originalSend = res.send;

      res.send = function (data: any) {
        // Restaurar el método original
        res.send = originalSend;

        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            // Parsear respuesta para extraer información de la entidad
            let responseData;
            try {
              responseData = typeof data === "string" ? JSON.parse(data) : data;
            } catch {
              responseData = data;
            }

            // Extraer información de la entidad creada
            const entity = responseData.data || responseData;
            if (entity && entity.id) {
              const auditEntityType =
                entityType || AuditMiddleware.getEntityTypeFromRoute(req.path);
              const entityName = AuditMiddleware.extractEntityName(entity);

              // Generar cambios basados en los datos enviados
              const changes = AuditMiddleware.generateChangesForCreate(
                req.body
              );

              // Registrar auditoría de forma asíncrona
              AuditMiddleware.logAudit({
                context: req.auditContext!,
                action: AuditAction.CREATE,
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
        } catch (error) {
          console.error("Error en auditoría CREATE:", error);
        }

        return originalSend.call(this, data);
      };

      next();
    };
  };

  /**
   * Middleware para registrar operaciones UPDATE
   */
  static auditUpdate = (entityType?: string) => {
    return async (
      req: AuditableRequest,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      // Almacenar datos originales antes de la actualización
      let originalEntity: any = null;

      try {
        // Intentar obtener la entidad original antes de la actualización
        const entityId = req.params.id;
        if (entityId) {
          originalEntity = await AuditMiddleware.getOriginalEntity(
            entityType || AuditMiddleware.getEntityTypeFromRoute(req.path),
            entityId
          );
        }
      } catch (error) {
        console.error(
          "Error obteniendo entidad original para auditoría:",
          error
        );
      }

      // Interceptar la respuesta
      const originalSend = res.send;

      res.send = function (data: any) {
        res.send = originalSend;

        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            let responseData;
            try {
              responseData = typeof data === "string" ? JSON.parse(data) : data;
            } catch {
              responseData = data;
            }

            const entity = responseData.data || responseData;
            if (entity && entity.id) {
              const auditEntityType =
                entityType || AuditMiddleware.getEntityTypeFromRoute(req.path);
              const entityName = AuditMiddleware.extractEntityName(entity);

              // Generar cambios comparando original con nuevo
              const changes = AuditMiddleware.generateChangesForUpdate(
                originalEntity,
                req.body
              );

              // Solo registrar si hay cambios reales
              if (changes.length > 0) {
                AuditMiddleware.logAudit({
                  context: req.auditContext!,
                  action: AuditAction.UPDATE,
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
        } catch (error) {
          console.error("Error en auditoría UPDATE:", error);
        }

        return originalSend.call(this, data);
      };

      next();
    };
  };

  /**
   * Middleware para registrar operaciones DELETE
   */
  static auditDelete = (entityType?: string) => {
    return async (
      req: AuditableRequest,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      // Obtener entidad antes de eliminar
      let originalEntity: any = null;

      try {
        const entityId = req.params.id;
        if (entityId) {
          originalEntity = await AuditMiddleware.getOriginalEntity(
            entityType || AuditMiddleware.getEntityTypeFromRoute(req.path),
            entityId
          );
        }
      } catch (error) {
        console.error("Error obteniendo entidad para DELETE:", error);
      }

      // Interceptar respuesta
      const originalSend = res.send;

      res.send = function (data: any) {
        res.send = originalSend;

        try {
          if (res.statusCode >= 200 && res.statusCode < 300 && originalEntity) {
            const auditEntityType =
              entityType || AuditMiddleware.getEntityTypeFromRoute(req.path);
            const entityName =
              AuditMiddleware.extractEntityName(originalEntity);

            // Generar cambios para eliminación
            const changes =
              AuditMiddleware.generateChangesForDelete(originalEntity);

            AuditMiddleware.logAudit({
              context: req.auditContext!,
              action: AuditAction.DELETE,
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
        } catch (error) {
          console.error("Error en auditoría DELETE:", error);
        }

        return originalSend.call(this, data);
      };

      next();
    };
  };

  /**
   * Middleware para registrar operaciones de DESCARGA
   */
  static auditDownload = (entityType?: string) => {
    return (req: AuditableRequest, res: Response, next: NextFunction) => {
      try {
        const originalSend = res.send;

        res.send = function (data: any) {
          try {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              // Solo auditar descargas exitosas
              const auditContext = req.auditContext;
              if (!auditContext) return originalSend.call(this, data);

              const fileName = req.params.fileName || "archivo_desconocido";

              const changes = [
                {
                  field: "fileName",
                  newValue: fileName,
                  oldValue: null,
                },
              ];

              AuditMiddleware.logManualAudit(
                auditContext,
                AuditAction.DOWNLOAD,
                entityType || "file_downloads",
                fileName,
                fileName,
                changes,
                {
                  requestBody: req.params,
                  responseStatus: res.statusCode,
                  downloadUrl: req.originalUrl,
                }
              ).catch((error) => {
                console.error("Error registrando auditoría DOWNLOAD:", error);
              });
            }
          } catch (error) {
            console.error("Error en auditoría DOWNLOAD:", error);
          }

          return originalSend.call(this, data);
        };

        next();
      } catch (error) {
        console.error("Error en middleware DOWNLOAD:", error);
        next();
      }
    };
  };

  /**
   * Middleware para registrar operaciones de VISUALIZACIÓN
   */
  static auditView = (entityType?: string) => {
    return (req: AuditableRequest, res: Response, next: NextFunction) => {
      try {
        const originalSend = res.send;

        res.send = function (data: any) {
          try {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              // Solo auditar visualizaciones exitosas
              const auditContext = req.auditContext;
              if (!auditContext) return originalSend.call(this, data);

              const fileName = req.params.fileName || "archivo_desconocido";

              const changes = [
                {
                  field: "fileName",
                  newValue: fileName,
                  oldValue: null,
                },
              ];

              AuditMiddleware.logManualAudit(
                auditContext,
                AuditAction.VIEW,
                entityType || "file_views",
                fileName,
                fileName,
                changes,
                {
                  requestBody: req.params,
                  responseStatus: res.statusCode,
                  viewUrl: req.originalUrl,
                }
              ).catch((error) => {
                console.error("Error registrando auditoría VIEW:", error);
              });
            }
          } catch (error) {
            console.error("Error en auditoría VIEW:", error);
          }

          return originalSend.call(this, data);
        };

        next();
      } catch (error) {
        console.error("Error en middleware VIEW:", error);
        next();
      }
    };
  };

  /**
   * Middleware para registrar acceso a REPORTES/MÉTRICAS
   */
  static auditReportAccess = (entityType?: string) => {
    return (req: AuditableRequest, res: Response, next: NextFunction) => {
      try {
        const originalSend = res.send;

        res.send = function (data: any) {
          try {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              // Solo auditar accesos exitosos a reportes
              const auditContext = req.auditContext;
              if (!auditContext) return originalSend.call(this, data);

              const reportType =
                req.path.split("/").pop() || "reporte_desconocido";

              const changes = [
                {
                  field: "reportType",
                  newValue: reportType,
                  oldValue: null,
                },
              ];

              AuditMiddleware.logManualAudit(
                auditContext,
                AuditAction.READ,
                entityType || "report_access",
                reportType,
                `Reporte: ${reportType}`,
                changes,
                {
                  requestBody: req.query,
                  responseStatus: res.statusCode,
                  reportPath: req.originalUrl,
                }
              ).catch((error) => {
                console.error("Error registrando auditoría REPORT:", error);
              });
            }
          } catch (error) {
            console.error("Error en auditoría REPORT:", error);
          }

          return originalSend.call(this, data);
        };

        next();
      } catch (error) {
        console.error("Error en middleware REPORT:", error);
        next();
      }
    };
  };

  /**
   * Registrar auditoría manual (para operaciones especiales)
   */
  static async logManualAudit(
    context: AuditContext,
    action: AuditAction,
    entityType: string,
    entityId: string,
    entityName?: string,
    changes: EntityChange[] = [],
    operationContext?: any
  ): Promise<void> {
    try {
      await AuditMiddleware.logAudit({
        context,
        action,
        entityType,
        entityId,
        entityName,
        changes,
        operationContext,
      });
    } catch (error) {
      console.error("Error en auditoría manual:", error);
      throw error;
    }
  }

  // ===========================
  // MÉTODOS PRIVADOS/HELPERS
  // ===========================

  /**
   * Registrar auditoría en la base de datos
   */
  private static async logAudit(metadata: {
    context: AuditContext;
    action: AuditAction;
    entityType: string;
    entityId: string;
    entityName?: string;
    changes: EntityChange[];
    operationContext?: any;
  }): Promise<void> {
    try {
      const {
        context,
        action,
        entityType,
        entityId,
        entityName,
        changes,
        operationContext,
      } = metadata;

      // Validar datos requeridos
      if (!context.userId || !entityId || !entityType) {
        console.warn("Auditoría saltada por datos faltantes:", {
          userId: context.userId,
          entityId,
          entityType,
          action,
        });
        return;
      }

      // Crear log de auditoría principal
      const auditLog = new AuditLog();
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

      // Determinar el éxito de la operación basándose en el responseStatus
      const responseStatus = operationContext?.responseStatus;
      auditLog.operationSuccess = responseStatus >= 200 && responseStatus < 300;

      // Si hay error, intentar extraer mensaje
      if (!auditLog.operationSuccess) {
        auditLog.errorMessage =
          operationContext?.error?.message ||
          operationContext?.errorMessage ||
          `HTTP ${responseStatus}`;
      }

      const auditLogRepository = await AuditMiddleware.getAuditLogRepository();
      if (!auditLogRepository) {
        console.error("No se pudo obtener el repositorio de AuditLog");
        return;
      }

      const savedAuditLog = await auditLogRepository.save(auditLog);
      console.log(
        `✅ Auditoría registrada: ${action} en ${entityType} (${entityId}) por ${context.userName}`
      );

      // Crear registros de cambios detallados
      if (changes && changes.length > 0) {
        const auditChanges = changes.map((change) => {
          const auditChange = new AuditEntityChange();
          auditChange.auditLogId = savedAuditLog.id;
          auditChange.fieldName = change.field;
          auditChange.fieldType =
            change.type ||
            AuditMiddleware.inferFieldType(change.newValue || change.oldValue);
          auditChange.oldValue =
            AuditMiddleware.serializeValue(change.oldValue) || undefined;
          auditChange.newValue =
            AuditMiddleware.serializeValue(change.newValue) || undefined;
          auditChange.changeType = AuditMiddleware.determineChangeType(change);
          auditChange.isSensitive =
            change.isSensitive ||
            AuditMiddleware.isSensitiveField(change.field);
          return auditChange;
        });

        const auditChangeRepository =
          await AuditMiddleware.getAuditChangeRepository();
        if (!auditChangeRepository) {
          console.error(
            "No se pudo obtener el repositorio de AuditEntityChange"
          );
          return;
        }

        await auditChangeRepository.save(auditChanges);
        // Audit changes saved
      }
    } catch (error) {
      console.error("❌ Error guardando auditoría:", error);
      // No relanzar el error para no afectar la operación principal
    }
  }

  /**
   * Extraer módulo desde la ruta
   */
  private static extractModuleFromPath(path: string): string {
    const segments = path.split("/").filter(Boolean);

    if (segments.includes("admin")) return AuditModule.ADMIN;
    if (segments.includes("archive")) return AuditModule.ARCHIVE;
    if (segments.includes("auth")) return AuditModule.AUTH;
    if (segments.includes("dashboard")) return AuditModule.DASHBOARD;
    if (segments.includes("cases")) return AuditModule.CASES;
    if (segments.includes("todos")) return AuditModule.TODOS;
    if (segments.includes("users")) return AuditModule.USERS;
    if (segments.includes("roles")) return AuditModule.ROLES;
    if (segments.includes("permissions")) return AuditModule.PERMISSIONS;
    if (segments.includes("notes")) return AuditModule.NOTES;
    if (segments.includes("manual-time-entries"))
      return AuditModule.MANUAL_TIME_ENTRIES;
    if (segments.includes("time-entries")) return AuditModule.TIME_TRACKING;
    if (segments.includes("time")) return AuditModule.TIME_TRACKING;
    if (segments.includes("knowledge")) return "knowledge";
    if (segments.includes("applications")) return "applications";
    if (segments.includes("origins")) return "origins";
    if (segments.includes("case-statuses")) return "case_statuses";
    if (segments.includes("todo-priorities")) return "todo_priorities";
    if (segments.includes("document-types")) return "document_types";
    if (segments.includes("files")) return "files";
    if (segments.includes("metrics")) return "reports";

    // Intentar extraer desde el segundo segmento (después de 'api')
    if (segments[0] === "api" && segments[1]) {
      const module = segments[1];
      if (module === "manual-time-entries")
        return AuditModule.MANUAL_TIME_ENTRIES;
      if (module === "time-entries") return AuditModule.TIME_TRACKING;
      if (module === "applications") return "applications";
      if (module === "origins") return "origins";
      if (module === "case-statuses") return "case_statuses";
      if (module === "knowledge") return "knowledge";
      if (module === "document-types") return "document_types";
      if (module === "files") return "files";
      if (module === "metrics") return "reports";
      return module;
    }

    return segments[1] || "unknown";
  }

  /**
   * Extraer IP del request
   */
  private static extractIpAddress(req: Request): string {
    return (
      req.ip ||
      req.get("x-forwarded-for")?.split(",")[0] ||
      req.get("x-real-ip") ||
      req.connection.remoteAddress ||
      "unknown"
    );
  }

  /**
   * Obtener tipo de entidad desde la ruta
   */
  private static getEntityTypeFromRoute(path: string): string {
    for (const [route, entityType] of Object.entries(
      AuditMiddleware.ROUTE_ENTITY_MAPPING
    )) {
      if (path.includes(route.replace("/api/", ""))) {
        return entityType;
      }
    }

    // Fallback: extraer de la ruta
    const segments = path.split("/").filter(Boolean);
    return segments[segments.length - 1] || "unknown";
  }

  /**
   * Extraer nombre descriptivo de una entidad
   */
  private static extractEntityName(entity: any): string {
    if (!entity) return "unknown";

    return (
      entity.title ||
      entity.name ||
      entity.fullName ||
      entity.email ||
      entity.description ||
      entity.caseNumber ||
      `ID: ${entity.id}`
    );
  }

  /**
   * Obtener entidad original (para comparar cambios)
   */
  private static async getOriginalEntity(
    entityType: string,
    entityId: string
  ): Promise<any> {
    try {
      // Mapeo de tipos de entidad a repositorios
      const entityRepositoryMap: Record<string, any> = {
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

      // Importar dinámicamente la entidad
      let EntityClass;
      try {
        switch (entityName) {
          case "ManualTimeEntry":
            const { ManualTimeEntry } = await import(
              "../entities/ManualTimeEntry"
            );
            EntityClass = ManualTimeEntry;
            break;
          case "Case":
            const { Case } = await import("../entities/Case");
            EntityClass = Case;
            break;
          case "Todo":
            const { Todo } = await import("../entities/Todo");
            EntityClass = Todo;
            break;
          case "UserProfile":
            const { UserProfile } = await import("../entities/UserProfile");
            EntityClass = UserProfile;
            break;
          case "Role":
            const { Role } = await import("../entities/Role");
            EntityClass = Role;
            break;
          case "TimeEntry":
            const { TimeEntry } = await import("../entities/TimeEntry");
            EntityClass = TimeEntry;
            break;
          default:
            console.warn(`Entidad no implementada: ${entityName}`);
            return null;
        }

        const repository = AppDataSource.getRepository(EntityClass);
        const entity = await repository.findOne({
          where: { id: entityId },
        });

        return entity;
      } catch (importError) {
        console.error(`Error importando entidad ${entityName}:`, importError);
        return null;
      }
    } catch (error) {
      console.error("Error obteniendo entidad original:", error);
      return null;
    }
  }

  /**
   * Generar cambios para operación CREATE
   */
  private static generateChangesForCreate(data: any): EntityChange[] {
    if (!data || typeof data !== "object") return [];

    return Object.entries(data)
      .filter(([key, value]) => value !== undefined && value !== null)
      .map(([key, value]) => ({
        field: key,
        oldValue: null,
        newValue: value,
        type: AuditMiddleware.inferFieldType(value),
        isSensitive: AuditMiddleware.isSensitiveField(key),
      }));
  }

  /**
   * Generar cambios para operación UPDATE
   */
  private static generateChangesForUpdate(
    originalData: any,
    updateData: any
  ): EntityChange[] {
    if (!updateData || typeof updateData !== "object") return [];

    const changes: EntityChange[] = [];

    for (const [key, newValue] of Object.entries(updateData)) {
      const oldValue = originalData?.[key];

      if (AuditMiddleware.valuesAreDifferent(oldValue, newValue)) {
        changes.push({
          field: key,
          oldValue,
          newValue,
          type: AuditMiddleware.inferFieldType(newValue),
          isSensitive: AuditMiddleware.isSensitiveField(key),
        });
      }
    }

    return changes;
  }

  /**
   * Generar cambios para operación DELETE
   */
  private static generateChangesForDelete(data: any): EntityChange[] {
    if (!data || typeof data !== "object") return [];

    return Object.entries(data)
      .filter(([key, value]) => value !== undefined && value !== null)
      .map(([key, value]) => ({
        field: key,
        oldValue: value,
        newValue: null,
        type: AuditMiddleware.inferFieldType(value),
        isSensitive: AuditMiddleware.isSensitiveField(key),
      }));
  }

  /**
   * Determinar tipo de cambio
   */
  private static determineChangeType(change: EntityChange): ChangeType {
    if (change.oldValue === null && change.newValue !== null) {
      return ChangeType.ADDED;
    }
    if (change.oldValue !== null && change.newValue === null) {
      return ChangeType.REMOVED;
    }
    return ChangeType.MODIFIED;
  }

  /**
   * Verificar si los valores son diferentes
   */
  private static valuesAreDifferent(oldValue: any, newValue: any): boolean {
    // Comparación profunda para objetos
    if (typeof oldValue === "object" && typeof newValue === "object") {
      return JSON.stringify(oldValue) !== JSON.stringify(newValue);
    }

    return oldValue !== newValue;
  }

  /**
   * Inferir tipo de campo
   */
  private static inferFieldType(value: any): string {
    if (value === null || value === undefined) return "null";
    if (typeof value === "boolean") return "boolean";
    if (typeof value === "number") return "number";
    if (typeof value === "string") {
      // Detectar fechas
      if (/^\d{4}-\d{2}-\d{2}/.test(value)) return "date";
      return "string";
    }
    if (Array.isArray(value)) return "array";
    if (typeof value === "object") return "json";

    return "unknown";
  }

  /**
   * Verificar si un campo es sensible
   */
  private static isSensitiveField(fieldName: string): boolean {
    const lowerFieldName = fieldName.toLowerCase();
    return AuditMiddleware.SENSITIVE_FIELDS.some((sensitive) =>
      lowerFieldName.includes(sensitive)
    );
  }

  /**
   * Serializar valor para almacenamiento
   */
  private static serializeValue(value: any): string | null {
    if (value === null || value === undefined) return null;

    if (typeof value === "string") return value;

    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  /**
   * Middleware principal para capturar automáticamente operaciones CRUD
   * Este middleware se ejecuta antes de las rutas para interceptar las operaciones
   */
  static captureOperations() {
    return async (req: AuditableRequest, res: Response, next: NextFunction) => {
      try {
        // Solo procesar rutas de API que no sean del sistema de auditoría
        if (
          !req.path.startsWith("/api/") ||
          req.path.startsWith("/api/audit/")
        ) {
          return next();
        }

        // Inicializar contexto de auditoría
        AuditMiddleware.initializeAuditContext(req, res, () => {});

        // Interceptar las operaciones según el método HTTP
        switch (req.method) {
          case "POST":
            // Crear
            if (!req.path.includes("/login") && !req.path.includes("/auth")) {
              const entityType = AuditMiddleware.getEntityTypeFromRoute(
                req.path
              );
              AuditMiddleware.auditCreate(entityType)(req, res, () => {});
            }
            break;

          case "PUT":
          case "PATCH":
            // Actualizar
            const entityTypeUpdate = AuditMiddleware.getEntityTypeFromRoute(
              req.path
            );
            AuditMiddleware.auditUpdate(entityTypeUpdate)(req, res, () => {});
            break;

          case "DELETE":
            // Eliminar
            const entityTypeDelete = AuditMiddleware.getEntityTypeFromRoute(
              req.path
            );
            AuditMiddleware.auditDelete(entityTypeDelete)(req, res, () => {});
            break;
        }

        next();
      } catch (error) {
        console.error("Error in audit middleware:", error);
        // No fallar la request por errores de auditoría
        next();
      }
    };
  }
}
