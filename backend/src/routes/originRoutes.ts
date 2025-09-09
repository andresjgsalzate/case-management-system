import { Router } from "express";
import { OriginController } from "../controllers/OriginController";
import { authenticateToken } from "../middleware/auth";

const router = Router();
const originController = new OriginController();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

/**
 * @route GET /api/origins
 * @desc Obtener lista de orígenes con filtros
 * @access Privado
 */
router.get("/", originController.getAllOrigins.bind(originController));

/**
 * @route GET /api/origins/search
 * @desc Buscar orígenes con filtros avanzados
 * @access Privado
 */
router.get("/search", originController.searchOrigins.bind(originController));

/**
 * @route GET /api/origins/stats
 * @desc Obtener estadísticas de orígenes
 * @access Privado
 */
router.get("/stats", originController.getOriginStats.bind(originController));

/**
 * @route GET /api/origins/:id
 * @desc Obtener origen por ID
 * @access Privado
 */
router.get("/:id", originController.getOriginById.bind(originController));

/**
 * @route POST /api/origins
 * @desc Crear nuevo origen
 * @access Privado
 */
router.post("/", originController.createOrigin.bind(originController));

/**
 * @route PUT /api/origins/:id
 * @desc Actualizar origen
 * @access Privado
 */
router.put("/:id", originController.updateOrigin.bind(originController));

/**
 * @route DELETE /api/origins/:id
 * @desc Eliminar origen
 * @access Privado
 */
router.delete("/:id", originController.deleteOrigin.bind(originController));

/**
 * @route GET /api/origins/:id/can-delete
 * @desc Verificar si se puede eliminar un origen
 * @access Privado
 */
router.get(
  "/:id/can-delete",
  originController.checkCanDeleteOrigin.bind(originController)
);

export { router as originRoutes };
