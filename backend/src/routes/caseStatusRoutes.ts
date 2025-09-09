import { Router } from "express";
import { CaseStatusController } from "../controllers/CaseStatusController";
import { authenticateToken } from "../middleware/auth";

const router = Router();
const caseStatusController = new CaseStatusController();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

/**
 * @route GET /api/case-statuses
 * @desc Obtener lista de estados con filtros
 * @access Privado
 */
router.get("/", caseStatusController.getAllStatuses.bind(caseStatusController));

/**
 * @route GET /api/case-statuses/search
 * @desc Buscar estados con filtros avanzados
 * @access Privado
 */
router.get(
  "/search",
  caseStatusController.searchStatuses.bind(caseStatusController)
);

/**
 * @route GET /api/case-statuses/stats
 * @desc Obtener estadísticas de estados
 * @access Privado
 */
router.get(
  "/stats",
  caseStatusController.getStatusStats.bind(caseStatusController)
);

/**
 * @route GET /api/case-statuses/active
 * @desc Obtener estados activos ordenados
 * @access Privado
 */
router.get(
  "/active",
  caseStatusController.getActiveStatusesOrdered.bind(caseStatusController)
);

/**
 * @route GET /api/case-statuses/:id
 * @desc Obtener estado por ID
 * @access Privado
 */
router.get(
  "/:id",
  caseStatusController.getStatusById.bind(caseStatusController)
);

/**
 * @route POST /api/case-statuses
 * @desc Crear nuevo estado
 * @access Privado
 */
router.post("/", caseStatusController.createStatus.bind(caseStatusController));

/**
 * @route PUT /api/case-statuses/:id
 * @desc Actualizar estado
 * @access Privado
 */
router.put(
  "/:id",
  caseStatusController.updateStatus.bind(caseStatusController)
);

/**
 * @route PUT /api/case-statuses/reorder
 * @desc Reordenar estados
 * @access Privado
 */
router.put(
  "/reorder",
  caseStatusController.reorderStatuses.bind(caseStatusController)
);

/**
 * @route DELETE /api/case-statuses/:id
 * @desc Eliminar estado
 * @access Privado
 */
router.delete(
  "/:id",
  caseStatusController.deleteStatus.bind(caseStatusController)
);

/**
 * @route GET /api/case-statuses/:id/can-delete
 * @desc Verificar si se puede eliminar un estado
 * @access Privado
 */
router.get(
  "/:id/can-delete",
  caseStatusController.checkCanDeleteStatus.bind(caseStatusController)
);

export { router as caseStatusRoutes };
