import { Request, Response } from "express";
import { AuditService } from "../services/AuditService";
import {
  AuditLogFiltersDto,
  AuditExportFiltersDto,
  CreateAuditLogDto,
  AUDIT_VALIDATION_RULES,
} from "../dto/audit.dto";
import { AuditAction } from "../entities/AuditLog";

// Interface para requests autenticados
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    fullName?: string;
    roleName: string;
    permissions?: string[];
  };
}

export class AuditController {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  // ===========================
  // ENDPOINTS DE CONSULTA
  // ===========================

  /**
   * GET /api/audit/logs
   * Obtener logs de auditoría con filtros y paginación
   */
  async getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Validar permisos
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

      // Extraer filtros de la query
      const filters: AuditLogFiltersDto = {
        // Filtros de usuario
        userId: req.query.userId as string,
        userEmail: req.query.userEmail as string,
        userRole: req.query.userRole as string,

        // Filtros de acción
        action: this.parseActionFilter(req.query.action),
        module: this.parseArrayFilter(req.query.module),
        entityType: this.parseArrayFilter(req.query.entityType),
        entityId: req.query.entityId as string,

        // Filtros de fecha
        startDate: req.query.startDate
          ? new Date(req.query.startDate as string)
          : undefined,
        endDate: req.query.endDate
          ? new Date(req.query.endDate as string)
          : undefined,

        // Filtros técnicos
        ipAddress: req.query.ipAddress as string,
        sessionId: req.query.sessionId as string,

        // Búsqueda general
        search: req.query.search as string,

        // Paginación y ordenamiento
        page: parseInt(req.query.page as string) || 1,
        limit: Math.min(
          parseInt(req.query.limit as string) ||
            AUDIT_VALIDATION_RULES.DEFAULT_PAGE_SIZE,
          AUDIT_VALIDATION_RULES.MAX_PAGE_SIZE
        ),
        sortBy: (req.query.sortBy as any) || "createdAt",
        sortOrder: (req.query.sortOrder as "ASC" | "DESC") || "DESC",

        // Incluir cambios detallados
        includeChanges: req.query.includeChanges === "true",
      };

      // Aplicar filtros de scope basados en permisos del usuario
      this.applyScopeFilters(filters, req.user!);

      // Obtener logs
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
    } catch (error) {
      console.error("Error en getAuditLogs:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  /**
   * GET /api/audit/logs/:id
   * Obtener un log de auditoría específico
   */
  async getAuditLogById(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
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

      // Verificar permisos de scope para este log específico
      if (!this.canViewAuditLog(auditLog, req.user!)) {
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
    } catch (error) {
      console.error("Error en getAuditLogById:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  /**
   * GET /api/audit/entity/:entityType/:entityId/history
   * Obtener historial completo de una entidad
   */
  async getEntityHistory(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
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

      const history = await this.auditService.getEntityHistory(
        entityType,
        entityId,
        includeChanges
      );

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      console.error("Error en getEntityHistory:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  /**
   * GET /api/audit/statistics
   * Obtener estadísticas de auditoría
   */
  async getAuditStatistics(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!this.hasAuditAdminPermission(req.user)) {
        res.status(403).json({
          success: false,
          message: "No tienes permisos para ver estadísticas de auditoría",
        });
        return;
      }

      const days = parseInt(req.query.days as string) || 30;

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
    } catch (error) {
      console.error("Error en getAuditStatistics:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // ===========================
  // ENDPOINTS DE EXPORTACIÓN
  // ===========================

  /**
   * POST /api/audit/export
   * Exportar logs de auditoría
   */
  async exportAuditLogs(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!this.hasAuditExportPermission(req.user)) {
        res.status(403).json({
          success: false,
          message: "No tienes permisos para exportar logs de auditoría",
        });
        return;
      }

      const filters: AuditExportFiltersDto = {
        ...req.body,
        format: req.body.format || "json",
        includeHeaders: req.body.includeHeaders !== false,
        includeSensitiveData:
          req.body.includeSensitiveData === true &&
          this.hasAuditAdminPermission(req.user),
      };

      // Aplicar filtros de scope
      this.applyScopeFilters(filters, req.user!);

      // Validar formato de exportación
      if (!["csv", "xlsx", "json"].includes(filters.format!)) {
        res.status(400).json({
          success: false,
          message: "Formato de exportación no válido. Use: csv, xlsx, json",
        });
        return;
      }

      const exportData = await this.auditService.exportAuditLogs(filters);

      // Configurar headers de respuesta según el formato
      switch (filters.format) {
        case "csv":
          res.setHeader("Content-Type", "text/csv");
          res.setHeader(
            "Content-Disposition",
            "attachment; filename=audit_logs.csv"
          );
          res.send(exportData);
          break;
        case "xlsx":
          res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          );
          res.setHeader(
            "Content-Disposition",
            "attachment; filename=audit_logs.xlsx"
          );
          res.send(exportData);
          break;
        case "json":
        default:
          res.setHeader("Content-Type", "application/json");
          res.setHeader(
            "Content-Disposition",
            "attachment; filename=audit_logs.json"
          );
          res.json(exportData);
          break;
      }
    } catch (error) {
      console.error("Error en exportAuditLogs:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // ===========================
  // ENDPOINTS DE CREACIÓN MANUAL
  // ===========================

  /**
   * POST /api/audit/logs
   * Crear un log de auditoría manual
   */
  async createAuditLog(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!this.hasAuditAdminPermission(req.user)) {
        res.status(403).json({
          success: false,
          message:
            "No tienes permisos para crear logs de auditoría manualmente",
        });
        return;
      }

      const auditLogData: CreateAuditLogDto = {
        ...req.body,
        // Asegurar que el usuario actual esté registrado como el creador
        userId: req.body.userId || req.user!.id,
        userEmail: req.body.userEmail || req.user!.email,
        userName: req.body.userName || req.user!.fullName,
        userRole: req.body.userRole || req.user!.roleName,
      };

      // Validar datos requeridos
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
    } catch (error) {
      console.error("Error en createAuditLog:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // ===========================
  // ENDPOINTS DE MANTENIMIENTO
  // ===========================

  /**
   * DELETE /api/audit/cleanup
   * Limpiar logs antiguos
   */
  async cleanupOldLogs(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!this.hasAuditAdminPermission(req.user)) {
        res.status(403).json({
          success: false,
          message: "No tienes permisos para limpiar logs de auditoría",
        });
        return;
      }

      const daysToKeep =
        parseInt(req.body.daysToKeep) ||
        AUDIT_VALIDATION_RULES.DEFAULT_RETENTION_DAYS;

      if (
        daysToKeep < 30 ||
        daysToKeep > AUDIT_VALIDATION_RULES.MAX_RETENTION_DAYS
      ) {
        res.status(400).json({
          success: false,
          message: `Los días a conservar deben estar entre 30 y ${AUDIT_VALIDATION_RULES.MAX_RETENTION_DAYS}`,
        });
        return;
      }

      const deletedCount = await this.auditService.cleanOldAuditLogs(
        daysToKeep
      );

      res.json({
        success: true,
        data: {
          deletedCount,
          daysToKeep,
        },
        message: `Se eliminaron ${deletedCount} logs de auditoría antiguos`,
      });
    } catch (error) {
      console.error("Error en cleanupOldLogs:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // ===========================
  // MÉTODOS PRIVADOS/HELPERS
  // ===========================

  /**
   * Verificar permisos de visualización de auditoría
   */
  private hasAuditViewPermission(user?: any): boolean {
    if (!user) return false;

    return (
      user.permissions?.includes("audit.view.own") ||
      user.permissions?.includes("audit.view.team") ||
      user.permissions?.includes("audit.view.all") ||
      user.roleName === "Administrador"
    );
  }
  /**
   * Verificar permisos de exportación de auditoría
   */
  private hasAuditExportPermission(user?: any): boolean {
    if (!user) return false;

    return (
      user.permissions?.includes("audit.export.own") ||
      user.permissions?.includes("audit.export.team") ||
      user.permissions?.includes("audit.export.all") ||
      user.roleName === "Administrador"
    );
  }

  /**
   * Verificar permisos de administración de auditoría
   */
  private hasAuditAdminPermission(user?: any): boolean {
    if (!user) return false;

    return (
      user.permissions?.includes("audit.admin.all") ||
      user.permissions?.includes("audit.config.all") ||
      user.roleName === "Administrador"
    );
  }

  /**
   * Verificar si el usuario puede ver un log específico
   */
  private canViewAuditLog(auditLog: any, user: any): boolean {
    // Administradores pueden ver todo
    if (
      user.roleName === "Administrador" ||
      user.permissions?.includes("audit.view.all")
    ) {
      return true;
    }

    // Ver solo propios
    if (user.permissions?.includes("audit.view.own")) {
      return auditLog.userId === user.id;
    }

    // Ver del equipo (TODO: implementar lógica de equipos)
    if (user.permissions?.includes("audit.view.team")) {
      return true; // Por ahora permitir todo
    }

    return false;
  }

  /**
   * Aplicar filtros de scope basados en permisos
   */
  private applyScopeFilters(filters: AuditLogFiltersDto, user: any): void {
    // Administradores pueden ver todo
    if (
      user.roleName === "Administrador" ||
      user.permissions?.includes("audit.view.all")
    ) {
      return;
    }

    // Filtrar solo registros propios
    if (user.permissions?.includes("audit.view.own")) {
      filters.userId = user.id;
      return;
    }

    // Filtrar por equipo (TODO: implementar lógica de equipos)
    if (user.permissions?.includes("audit.view.team")) {
      // Por ahora no aplicar filtros adicionales
      return;
    }

    // Si no tiene permisos, filtrar por usuario actual
    filters.userId = user.id;
  }

  /**
   * Parsear filtro de acción
   */
  private parseActionFilter(
    action: any
  ): AuditAction | AuditAction[] | undefined {
    if (!action) return undefined;

    if (typeof action === "string") {
      if (action.includes(",")) {
        return action.split(",") as AuditAction[];
      }
      return action as AuditAction;
    }

    if (Array.isArray(action)) {
      return action as AuditAction[];
    }

    return undefined;
  }

  /**
   * Parsear filtros de array
   */
  private parseArrayFilter(filter: any): string | string[] | undefined {
    if (!filter) return undefined;

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

  /**
   * Validar datos de log de auditoría
   */
  private validateAuditLogData(data: CreateAuditLogDto): string | null {
    if (!data.userEmail) {
      return "Email de usuario requerido";
    }

    if (!data.action) {
      return "Acción requerida";
    }

    if (!Object.values(AuditAction).includes(data.action)) {
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

    // Validar longitudes
    if (
      data.entityName &&
      data.entityName.length > AUDIT_VALIDATION_RULES.MAX_ENTITY_NAME_LENGTH
    ) {
      return `Nombre de entidad demasiado largo (máximo ${AUDIT_VALIDATION_RULES.MAX_ENTITY_NAME_LENGTH} caracteres)`;
    }

    if (
      data.userName &&
      data.userName.length > AUDIT_VALIDATION_RULES.MAX_USER_NAME_LENGTH
    ) {
      return `Nombre de usuario demasiado largo (máximo ${AUDIT_VALIDATION_RULES.MAX_USER_NAME_LENGTH} caracteres)`;
    }

    if (data.module.length > AUDIT_VALIDATION_RULES.MAX_MODULE_LENGTH) {
      return `Nombre de módulo demasiado largo (máximo ${AUDIT_VALIDATION_RULES.MAX_MODULE_LENGTH} caracteres)`;
    }

    return null;
  }
}
