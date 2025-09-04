import { Router } from "express";
import { TimerController } from "./timer.controller";
import { authenticateToken } from "../../middleware/auth";

const router = Router();
const timerController = new TimerController();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

// Rutas para Timer Control
router.post("/start", timerController.startTimer.bind(timerController));
router.post("/stop", timerController.stopTimer.bind(timerController));
router.post("/pause", timerController.pauseTimer.bind(timerController));
router.get(
  "/:caseControlId/active-time",
  timerController.getActiveTime.bind(timerController)
);

export default router;
