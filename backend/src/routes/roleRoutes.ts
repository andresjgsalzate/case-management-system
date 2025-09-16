import { Router } from "express";
import { RoleController } from "../controllers/RoleController";
import { authenticateToken } from "../middleware/auth";
import { AuditMiddleware } from "../middleware/auditMiddleware";

const router = Router();
const roleController = new RoleController();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Aplicar middleware de auditoría después de la autenticación
router.use(AuditMiddleware.initializeAuditContext);

/**
 * @route GET /api/roles
 * @desc Obtener lista de roles con filtros
 * @access Privado
 */
router.get("/", roleController.getAllRoles.bind(roleController));

/**
 * @route GET /api/roles/search
 * @desc Buscar roles con filtros avanzados
 * @access Privado
 */
router.get("/search", roleController.searchRoles.bind(roleController));

/**
 * @route GET /api/roles/stats
 * @desc Obtener estadísticas de roles
 * @access Privado
 */
router.get("/stats", roleController.getRoleStats.bind(roleController));

/**
 * @route GET /api/roles/:id/permissions
 * @desc Obtener permisos de un rol
 * @access Privado
 */
router.get(
  "/:id/permissions",
  roleController.getRolePermissions.bind(roleController)
);

/**
 * @route GET /api/roles/:id
 * @desc Obtener rol por ID
 * @access Privado
 */
router.get("/:id", roleController.getRoleById.bind(roleController));

/**
 * @route POST /api/roles
 * @desc Crear nuevo rol
 * @access Privado
 */
router.post(
  "/",
  AuditMiddleware.auditCreate("roles"),
  roleController.createRole.bind(roleController)
);

/**
 * @route POST /api/roles/:id/clone
 * @desc Clonar un rol existente
 * @access Privado
 */
router.post(
  "/:id/clone",
  AuditMiddleware.auditCreate("roles"),
  roleController.cloneRole.bind(roleController)
);

/**
 * @route PUT /api/roles/:id
 * @desc Actualizar rol
 * @access Privado
 */
router.put(
  "/:id",
  AuditMiddleware.auditUpdate("roles"),
  roleController.updateRole.bind(roleController)
);

/**
 * @route PUT /api/roles/:id/permissions
 * @desc Asignar permisos a un rol
 * @access Privado
 */
router.put(
  "/:id/permissions",
  AuditMiddleware.auditUpdate("roles"),
  roleController.assignPermissions.bind(roleController)
);

/**
 * @route DELETE /api/roles/:id
 * @desc Eliminar rol
 * @access Privado
 */
router.delete(
  "/:id",
  AuditMiddleware.auditDelete("roles"),
  roleController.deleteRole.bind(roleController)
);

export { router as roleRoutes };
