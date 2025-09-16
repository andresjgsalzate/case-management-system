import { Router } from "express";
import { TodoController } from "./todo.controller";
import { authenticateToken } from "../../middleware/auth";
import { AuditMiddleware } from "../../middleware/auditMiddleware";

const router = Router();
const todoController = new TodoController();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

// Aplicar middleware de auditoría después de la autenticación
router.use(AuditMiddleware.initializeAuditContext);

// Rutas para TODOs
router.get("/", (req, res) => todoController.getAllTodos(req, res));
router.get("/priorities", (req, res) =>
  todoController.getTodoPriorities(req, res)
);
router.get("/metrics", (req, res) => todoController.getTodoMetrics(req, res));
router.get("/:id", (req, res) => todoController.getTodoById(req, res));
router.post("/", AuditMiddleware.auditCreate("todos"), (req, res) =>
  todoController.createTodo(req, res)
);
router.put("/:id", AuditMiddleware.auditUpdate("todos"), (req, res) =>
  todoController.updateTodo(req, res)
);
router.delete("/:id", AuditMiddleware.auditDelete("todos"), (req, res) =>
  todoController.deleteTodo(req, res)
);
router.patch(
  "/:id/complete",
  AuditMiddleware.auditUpdate("todos"),
  (req, res) => todoController.completeTodo(req, res)
);
router.patch(
  "/:id/reactivate",
  AuditMiddleware.auditUpdate("todos"),
  (req, res) => todoController.reactivateTodo(req, res)
);
router.patch("/:id/archive", AuditMiddleware.auditUpdate("todos"), (req, res) =>
  todoController.archiveTodo(req, res)
);

// Timer control routes
router.post("/:id/start-timer", (req, res) =>
  todoController.startTimer(req, res)
);
router.post("/:id/pause-timer", (req, res) =>
  todoController.pauseTimer(req, res)
);
router.get("/:id/time-entries", (req, res) =>
  todoController.getTodoTimeEntries(req, res)
);
router.delete("/:id/time-entries/:entryId", (req, res) =>
  todoController.deleteTimeEntry(req, res)
);
router.post("/:id/manual-time-entries", (req, res) =>
  todoController.addManualTimeEntry(req, res)
);
router.get("/:id/manual-time-entries", (req, res) =>
  todoController.getManualTimeEntries(req, res)
);
router.delete("/:id/manual-time-entries/:entryId", (req, res) =>
  todoController.deleteManualTimeEntry(req, res)
);

export default router;
