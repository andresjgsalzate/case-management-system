import { Router } from "express";
import { PermissionController } from "../controllers/PermissionController";
import { RoleController } from "../controllers/RoleController";
import { authenticateToken } from "../middleware/auth";
import { AuditMiddleware } from "../middleware/auditMiddleware";
import {
  requirePermission,
  requireAdmin,
  requirePermissionWithScope,
} from "../middleware/authorizationMiddleware";

const router = Router();
const permissionController = new PermissionController();
const roleController = new RoleController();

// Aplicar middleware de auditoría a rutas que requieren autenticación
router.use(authenticateToken);
router.use(AuditMiddleware.initializeAuditContext);

// ===========================
// RUTAS DE PERMISOS
// ===========================

/**
 * @route GET /api/permissions
 * @desc Obtener todos los permisos
 * @access Requiere autenticación básica
 */
router.get("/permissions", authenticateToken, (req, res) =>
  permissionController.getAllPermissions(req, res)
);

/**
 * @route GET /api/permissions/module/:module
 * @desc Obtener permisos por módulo
 * @access Requiere autenticación básica
 */
router.get("/permissions/module/:module", authenticateToken, (req, res) =>
  permissionController.getPermissionsByModule(req, res)
);

/**
 * @route GET /api/permissions/structure
 * @desc Obtener estructura de módulos y permisos
 * @access Requiere autenticación básica
 */
router.get("/permissions/structure", authenticateToken, (req, res) =>
  permissionController.getModulesStructure(req, res)
);

/**
 * @route GET /api/permissions/actions
 * @desc Obtener todas las acciones distintas
 * @access Requiere autenticación básica
 */
router.get("/permissions/actions", authenticateToken, (req, res) =>
  permissionController.getActions(req, res)
);

/**
 * @route PUT /api/permissions/translate-action
 * @desc Traducir acción de español a inglés
 * @access Requiere autenticación básica
 */
router.put("/permissions/translate-action", authenticateToken, (req, res) =>
  permissionController.translateAction(req, res)
);

/**
 * @route PUT /api/permissions/update-names-format
 * @desc Actualizar formato de nombres de permisos
 * @access Requiere autenticación básica
 */
router.put("/permissions/update-names-format", authenticateToken, (req, res) =>
  permissionController.updateNamesFormat(req, res)
);

/**
 * @route GET /api/permissions/search
 * @desc Buscar permisos con filtros
 * @access Requiere permiso: roles.gestionar.all
 */
router.get("/permissions/search", requireAdmin(), (req, res) =>
  permissionController.searchPermissions(req, res)
);

/**
 * @route POST /api/permissions
 * @desc Crear un nuevo permiso
 * @access Requiere permiso: roles.gestionar.all
 */
router.post(
  "/permissions",
  requireAdmin(),
  AuditMiddleware.auditCreate("permissions"),
  (req, res) => permissionController.createPermission(req, res)
);

/**
 * @route POST /api/permissions/check
 * @desc Verificar permisos del usuario actual
 * @access Autenticado (cualquier usuario)
 */
router.post("/permissions/check", authenticateToken, (req, res) =>
  permissionController.checkUserPermissions(req, res)
);

/**
 * @route GET /api/permissions/scope/:module/:action
 * @desc Obtener el scope más alto para una acción
 * @access Autenticado (cualquier usuario)
 */
router.get("/permissions/scope/:module/:action", (req, res) =>
  permissionController.getHighestScope(req, res)
);

// ===========================
// RUTAS DE ROLES
// ===========================

/**
 * @route GET /api/roles
 * @desc Obtener todos los roles
 * @access Requiere autenticación básica
 */
router.get("/roles", authenticateToken, (req, res) =>
  roleController.getAllRoles(req, res)
);

/**
 * @route GET /api/roles/search
 * @desc Buscar roles con filtros
 * @access Requiere autenticación básica
 */
router.get("/roles/search", authenticateToken, (req, res) =>
  roleController.searchRoles(req, res)
);

/**
 * @route GET /api/roles/stats
 * @desc Obtener estadísticas de roles
 * @access Requiere permiso: roles.gestionar.all
 */
router.get("/roles/stats", requireAdmin(), (req, res) =>
  roleController.getRoleStats(req, res)
);

/**
 * @route GET /api/roles/:id
 * @desc Obtener rol por ID con permisos
 * @access Requiere permiso: roles.gestionar.all
 */
router.get("/roles/:id", requireAdmin(), (req, res) =>
  roleController.getRoleById(req, res)
);

/**
 * @route POST /api/roles
 * @desc Crear un nuevo rol
 * @access Requiere permiso: roles.gestionar.all
 */
router.post(
  "/roles",
  requireAdmin(),
  AuditMiddleware.auditCreate("roles"),
  (req, res) => roleController.createRole(req, res)
);

/**
 * @route PUT /api/roles/:id
 * @desc Actualizar un rol existente
 * @access Requiere permiso: roles.gestionar.all
 */
router.put(
  "/roles/:id",
  requireAdmin(),
  AuditMiddleware.auditUpdate("roles"),
  (req, res) => roleController.updateRole(req, res)
);

/**
 * @route DELETE /api/roles/:id
 * @desc Eliminar un rol (soft delete)
 * @access Requiere permiso: roles.gestionar.all
 */
router.delete(
  "/roles/:id",
  requireAdmin(),
  AuditMiddleware.auditDelete("roles"),
  (req, res) => roleController.deleteRole(req, res)
);

/**
 * @route POST /api/roles/:id/permissions
 * @desc Asignar permisos a un rol
 * @access Requiere permiso: roles.gestionar.all
 */
router.post(
  "/roles/:id/permissions",
  requireAdmin(),
  AuditMiddleware.auditUpdate("role_permissions"),
  (req, res) => roleController.assignPermissions(req, res)
);

/**
 * @route POST /api/roles/:id/clone
 * @desc Clonar un rol existente
 * @access Requiere permiso: roles.gestionar.all
 */
router.post(
  "/roles/:id/clone",
  requireAdmin(),
  AuditMiddleware.auditCreate("roles"),
  (req, res) => roleController.cloneRole(req, res)
);

/**
 * @route GET /api/roles/:id/can-delete
 * @desc Verificar si un rol puede ser eliminado
 * @access Requiere permiso: roles.gestionar.all
 */
router.get("/roles/:id/can-delete", requireAdmin(), (req, res) =>
  roleController.checkCanDeleteRole(req, res)
);

// ===========================
// RUTAS DE EJEMPLO PARA OTROS MÓDULOS
// ===========================

/**
 * Ejemplos de cómo usar el middleware de permisos en otros controladores
 */

// Ejemplo para disposiciones
router.get(
  "/example/dispositions",
  requirePermissionWithScope("dispositions", "view"),
  (req, res) => {
    res.json({
      message: "Lista de disposiciones según scope del usuario",
      scope: req.userWithPermissions?.permissionScope,
      filters: req.userWithPermissions?.scopeFilters,
    });
  }
);

// Ejemplo para casos
router.post(
  "/example/cases",
  requirePermission("cases.create.own"),
  (req, res) => {
    res.json({
      message: "Crear caso - permiso específico verificado",
    });
  }
);

// Ejemplo para múltiples permisos
router.get(
  "/example/admin-dashboard",
  requirePermission("dashboard.view.all"),
  (req, res) => {
    res.json({
      message: "Dashboard administrativo - acceso completo",
    });
  }
);

export default router;
