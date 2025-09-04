import { Router } from "express";
import { HealthController } from "./health.controller";

const router = Router();
const healthController = new HealthController();

// Ruta de health check
router.get("/", healthController.getHealth.bind(healthController));

export default router;
