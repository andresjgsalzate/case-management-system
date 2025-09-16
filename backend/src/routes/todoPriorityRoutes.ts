import { Router } from "express";
import { TodoPriorityController } from "../controllers/TodoPriorityController";
import { authenticateToken } from "../middleware/auth";
import { AuditMiddleware } from "../middleware/auditMiddleware";

const router = Router();
const todoPriorityController = new TodoPriorityController();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Aplicar middleware de auditoría después de la autenticación
router.use(AuditMiddleware.initializeAuditContext);

/**
 * @route GET /api/admin/todo-priorities
 * @desc Obtener lista de prioridades con filtros
 * @access Privado
 */
router.get(
  "/",
  todoPriorityController.getAllPriorities.bind(todoPriorityController)
);

/**
 * @route GET /api/admin/todo-priorities/stats
 * @desc Obtener estadísticas de prioridades
 * @access Privado
 */
router.get(
  "/stats",
  todoPriorityController.getPriorityStats.bind(todoPriorityController)
);

/**
 * @route GET /api/admin/todo-priorities/:id
 * @desc Obtener prioridad por ID
 * @access Privado
 */
router.get(
  "/:id",
  todoPriorityController.getPriorityById.bind(todoPriorityController)
);

/**
 * @route POST /api/admin/todo-priorities
 * @desc Crear nueva prioridad
 * @access Privado
 */
router.post(
  "/",
  AuditMiddleware.auditCreate("todo_priorities"),
  todoPriorityController.createPriority.bind(todoPriorityController)
);

/**
 * @route PUT /api/admin/todo-priorities/:id
 * @desc Actualizar prioridad
 * @access Privado
 */
router.put(
  "/:id",
  AuditMiddleware.auditUpdate("todo_priorities"),
  todoPriorityController.updatePriority.bind(todoPriorityController)
);

/**
 * @route PUT /api/admin/todo-priorities/:id/toggle
 * @desc Alternar estado activo/inactivo de la prioridad
 * @access Privado
 */
router.put(
  "/:id/toggle",
  AuditMiddleware.auditUpdate("todo_priorities"),
  todoPriorityController.togglePriorityStatus.bind(todoPriorityController)
);

/**
 * @route DELETE /api/admin/todo-priorities/:id
 * @desc Eliminar prioridad
 * @access Privado
 */
router.delete(
  "/:id",
  AuditMiddleware.auditDelete("todo_priorities"),
  todoPriorityController.deletePriority.bind(todoPriorityController)
);

/**
 * @route PUT /api/admin/todo-priorities/reorder
 * @desc Reordenar prioridades
 * @access Privado
 */
router.put(
  "/reorder",
  AuditMiddleware.auditUpdate("todo_priorities"),
  todoPriorityController.reorderPriorities.bind(todoPriorityController)
);

export { router as todoPriorityRoutes };
