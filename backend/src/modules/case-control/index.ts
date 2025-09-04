import { Router } from "express";
import caseControlRoutes from "./case-control.routes";
import timerRoutes from "./timer.routes";
import caseStatusRoutes from "./case-status.routes";

const router = Router();

// Montar las rutas específicas primero (antes de las rutas con parámetros)
router.use("/case-statuses", caseStatusRoutes);
router.use("/timer", timerRoutes);
router.use("/", caseControlRoutes);

export default router;
