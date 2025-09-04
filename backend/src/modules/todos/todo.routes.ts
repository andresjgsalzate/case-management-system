import { Router } from "express";
import { TodoController } from "./todo.controller";
import { authenticateToken } from "../../middleware/auth";

const router = Router();
const todoController = new TodoController();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

// Rutas para TODOs
router.get("/", (req, res) => todoController.getAllTodos(req, res));
router.get("/priorities", (req, res) =>
  todoController.getTodoPriorities(req, res)
);
router.get("/metrics", (req, res) => todoController.getTodoMetrics(req, res));
router.get("/:id", (req, res) => todoController.getTodoById(req, res));
router.post("/", (req, res) => todoController.createTodo(req, res));
router.put("/:id", (req, res) => todoController.updateTodo(req, res));
router.delete("/:id", (req, res) => todoController.deleteTodo(req, res));
router.patch("/:id/complete", (req, res) =>
  todoController.completeTodo(req, res)
);
router.patch("/:id/reactivate", (req, res) =>
  todoController.reactivateTodo(req, res)
);

// Timer control routes
router.post("/:id/timer/start", (req, res) =>
  todoController.startTimer(req, res)
);
router.post("/:id/timer/pause", (req, res) =>
  todoController.pauseTimer(req, res)
);
router.get("/:id/time-entries", (req, res) =>
  todoController.getTodoTimeEntries(req, res)
);
router.post("/:id/time-entries/manual", (req, res) =>
  todoController.addManualTimeEntry(req, res)
);
router.get("/:id/manual-time-entries", (req, res) =>
  todoController.getManualTimeEntries(req, res)
);
router.delete("/:id/manual-time-entries/:entryId", (req, res) =>
  todoController.deleteManualTimeEntry(req, res)
);

export default router;
