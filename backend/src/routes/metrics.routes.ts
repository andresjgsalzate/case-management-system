import { Router } from "express";
import { DashboardMetricsController } from "../controllers/DashboardMetricsController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

// Rutas de métricas del dashboard
router.get("/general", DashboardMetricsController.getGeneralMetrics);
router.get("/dashboard-stats", DashboardMetricsController.getDashboardStats);
router.get("/time", DashboardMetricsController.getTimeMetrics);
router.get("/users/time", DashboardMetricsController.getUserTimeMetrics);
router.get("/cases/time", DashboardMetricsController.getCaseTimeMetrics);
router.get("/status", DashboardMetricsController.getStatusMetrics);
router.get("/applications", DashboardMetricsController.getApplicationMetrics);
router.get("/performance", DashboardMetricsController.getPerformanceMetrics);

export default router;
