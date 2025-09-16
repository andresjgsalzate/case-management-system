import { Router } from "express";
import { ApplicationController } from "../controllers/ApplicationController";
import { authenticateToken } from "../middleware/auth";
import { AuditMiddleware } from "../middleware/auditMiddleware";

const router = Router();
const applicationController = new ApplicationController();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Aplicar middleware de auditoría después de la autenticación
router.use(AuditMiddleware.initializeAuditContext);

/**
 * @route GET /api/applications
 * @desc Obtener lista de aplicaciones con filtros
 * @access Privado
 */
router.get(
  "/",
  applicationController.getAllApplications.bind(applicationController)
);

/**
 * @route GET /api/applications/search
 * @desc Buscar aplicaciones con filtros avanzados
 * @access Privado
 */
router.get(
  "/search",
  applicationController.searchApplications.bind(applicationController)
);

/**
 * @route GET /api/applications/stats
 * @desc Obtener estadísticas de aplicaciones
 * @access Privado
 */
router.get(
  "/stats",
  applicationController.getApplicationStats.bind(applicationController)
);

/**
 * @route GET /api/applications/:id
 * @desc Obtener aplicación por ID
 * @access Privado
 */
router.get(
  "/:id",
  applicationController.getApplicationById.bind(applicationController)
);

/**
 * @route POST /api/applications
 * @desc Crear nueva aplicación
 * @access Privado
 */
router.post(
  "/",
  AuditMiddleware.auditCreate("aplicaciones"),
  applicationController.createApplication.bind(applicationController)
);

/**
 * @route PUT /api/applications/:id
 * @desc Actualizar aplicación
 * @access Privado
 */
router.put(
  "/:id",
  AuditMiddleware.auditUpdate("aplicaciones"),
  applicationController.updateApplication.bind(applicationController)
);

/**
 * @route DELETE /api/applications/:id
 * @desc Eliminar aplicación
 * @access Privado
 */
router.delete(
  "/:id",
  AuditMiddleware.auditDelete("aplicaciones"),
  applicationController.deleteApplication.bind(applicationController)
);

/**
 * @route GET /api/applications/:id/can-delete
 * @desc Verificar si se puede eliminar una aplicación
 * @access Privado
 */
router.get(
  "/:id/can-delete",
  applicationController.checkCanDeleteApplication.bind(applicationController)
);

export { router as applicationRoutes };
