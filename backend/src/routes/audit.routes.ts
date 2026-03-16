import { Router } from "express";
import { AuditController } from "../controllers/AuditController";
import { authenticateToken } from "../middleware/auth";

const router = Router();
const auditController = new AuditController();

// ===========================
// MIDDLEWARE DE AUTENTICACIÓN
// ===========================

// Todas las rutas de auditoría requieren autenticación
router.use(authenticateToken);

// ===========================
// RUTAS DE CONSULTA DE AUDITORÍA
// ===========================

/**
 * @route GET /api/audit/logs
 * @desc Obtener logs de auditoría con filtros y paginación
 * @access Requiere permisos: audit.view.own, audit.view.team, audit.view.all
 * @query {string} userId - ID del usuario (opcional)
 * @query {string} userEmail - Email del usuario para filtrar (opcional)
 * @query {string} userRole - Rol del usuario para filtrar (opcional)
 * @query {string} action - Acción realizada (CREATE, UPDATE, DELETE, etc.) (opcional)
 * @query {string} module - Módulo del sistema (opcional)
 * @query {string} entityType - Tipo de entidad (opcional)
 * @query {string} entityId - ID de la entidad específica (opcional)
 * @query {string} startDate - Fecha de inicio (ISO string) (opcional)
 * @query {string} endDate - Fecha de fin (ISO string) (opcional)
 * @query {string} ipAddress - Dirección IP para filtrar (opcional)
 * @query {string} sessionId - ID de sesión para filtrar (opcional)
 * @query {string} search - Búsqueda general (opcional)
 * @query {number} page - Número de página (default: 1)
 * @query {number} limit - Elementos por página (default: 20, max: 100)
 * @query {string} sortBy - Campo para ordenar (default: createdAt)
 * @query {string} sortOrder - Orden (ASC/DESC, default: DESC)
 * @query {boolean} includeChanges - Incluir cambios detallados (default: false)
 */
router.get("/logs", async (req, res) => {
  try {
    console.log("🔍 DEBUG: Acceso a /api/audit/logs");
    console.log("Headers:", req.headers.authorization);
    console.log("User:", req.user);
    await auditController.getAuditLogs(req as any, res);
  } catch (error) {
    console.error("❌ Error en audit logs route:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @route GET /api/audit/logs/:id
 * @desc Obtener un log de auditoría específico por ID
 * @access Requiere permisos: audit.view.own, audit.view.team, audit.view.all
 * @param {string} id - ID del log de auditoría
 */
router.get("/logs/:id", async (req, res) => {
  await auditController.getAuditLogById(req as any, res);
});

/**
 * @route GET /api/audit/entity/:entityType/:entityId/history
 * @desc Obtener historial completo de cambios de una entidad específica
 * @access Requiere permisos: audit.view.own, audit.view.team, audit.view.all
 * @param {string} entityType - Tipo de entidad (cases, todos, users, etc.)
 * @param {string} entityId - ID de la entidad
 * @query {boolean} includeChanges - Incluir cambios detallados (default: true)
 */
router.get("/entity/:entityType/:entityId/history", async (req, res) => {
  await auditController.getEntityHistory(req as any, res);
});

/**
 * @route GET /api/audit/statistics
 * @desc Obtener estadísticas de auditoría del sistema
 * @access Requiere permisos: audit.admin.all
 * @query {number} days - Número de días para las estadísticas (default: 30, max: 365)
 */
router.get("/statistics", async (req, res) => {
  await auditController.getAuditStatistics(req as any, res);
});

// ===========================
// RUTAS DE EXPORTACIÓN
// ===========================

/**
 * @route POST /api/audit/export
 * @desc Exportar logs de auditoría en diferentes formatos
 * @access Requiere permisos: audit.export.own, audit.export.team, audit.export.all
 * @body {object} filters - Filtros de exportación
 * @body {string} format - Formato de exportación (csv, xlsx, json)
 * @body {boolean} includeHeaders - Incluir headers en CSV/XLSX (default: true)
 * @body {boolean} includeSensitiveData - Incluir datos sensibles (solo admin)
 */
router.post("/export", async (req, res) => {
  await auditController.exportAuditLogs(req as any, res);
});

// ===========================
// RUTAS DE ADMINISTRACIÓN
// ===========================

/**
 * @route POST /api/audit/logs
 * @desc Crear un log de auditoría manual (para casos especiales)
 * @access Requiere permisos: audit.admin.all
 * @body {object} auditLogData - Datos del log de auditoría
 */
router.post("/logs", async (req, res) => {
  await auditController.createAuditLog(req as any, res);
});

/**
 * @route DELETE /api/audit/cleanup
 * @desc Limpiar logs de auditoría antiguos
 * @access Requiere permisos: audit.admin.all
 * @body {number} daysToKeep - Días de retención (mínimo 30, máximo 2555)
 */
router.delete("/cleanup", async (req, res) => {
  await auditController.cleanupOldLogs(req as any, res);
});

// ===========================
// RUTAS DE CONFIGURACIÓN (FUTURAS)
// ===========================

/**
 * @route GET /api/audit/config
 * @desc Obtener configuración del sistema de auditoría
 * @access Requiere permisos: audit.config.all
 * @todo Implementar endpoint de configuración
 */
// router.get("/config", async (req, res) => {
//   // TODO: Implementar configuración de auditoría
//   res.json({
//     success: false,
//     message: "Endpoint de configuración no implementado aún"
//   });
// });

/**
 * @route PUT /api/audit/config
 * @desc Actualizar configuración del sistema de auditoría
 * @access Requiere permisos: audit.config.all
 * @todo Implementar endpoint de configuración
 */
// router.put("/config", async (req, res) => {
//   // TODO: Implementar actualización de configuración
//   res.json({
//     success: false,
//     message: "Endpoint de configuración no implementado aún"
//   });
// });

// ===========================
// RUTAS DE MONITORING Y SALUD
// ===========================

/**
 * @route GET /api/audit/health
 * @desc Verificar el estado del sistema de auditoría
 * @access Requiere permisos: audit.admin.all
 */
router.get("/health", async (req, res) => {
  try {
    // Verificar conectividad básica con la base de datos
    const healthCheck = {
      status: "ok",
      timestamp: new Date().toISOString(),
      database: "connected",
      version: "1.2.0",
    };

    res.json({
      success: true,
      data: healthCheck,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Sistema de auditoría no disponible",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
});

// ===========================
// MIDDLEWARE DE MANEJO DE ERRORES
// ===========================

// Middleware para manejar rutas no encontradas específicamente en auditoría
router.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta de auditoría no encontrada: ${req.method} ${req.originalUrl}`,
  });
});

export default router;
