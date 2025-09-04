import { Router } from "express";
import { TimeEntriesController } from "./time-entries.controller";
import { authenticateToken } from "../../middleware/auth";

const router = Router();
const timeEntriesController = new TimeEntriesController();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

// Rutas para time entries
router.get(
  "/case-control/:caseControlId",
  timeEntriesController.getTimeEntriesByCaseControl.bind(timeEntriesController)
);
router.get(
  "/user",
  timeEntriesController.getTimeEntriesByUser.bind(timeEntriesController)
);
router.get(
  "/:id",
  timeEntriesController.getTimeEntry.bind(timeEntriesController)
);
router.delete(
  "/:id",
  timeEntriesController.deleteTimeEntry.bind(timeEntriesController)
);

export default router;
