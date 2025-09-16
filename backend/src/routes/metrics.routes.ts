import { Router } from "express";
import { DashboardMetricsController } from "../controllers/DashboardMetricsController";
import { authenticateToken } from "../middleware/auth";
import { AuditMiddleware } from "../middleware/auditMiddleware";

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

// Aplicar middleware de auditoría después de la autenticación
router.use(AuditMiddleware.initializeAuditContext);

// Rutas de métricas del dashboard - con auditoría para acceso a reportes
router.get(
  "/general",
  AuditMiddleware.auditCreate("report_access"),
  DashboardMetricsController.getGeneralMetrics
);
router.get(
  "/dashboard-stats",
  AuditMiddleware.auditCreate("report_access"),
  DashboardMetricsController.getDashboardStats
);
router.get(
  "/time",
  AuditMiddleware.auditCreate("report_access"),
  DashboardMetricsController.getTimeMetrics
);
router.get(
  "/users/time",
  AuditMiddleware.auditCreate("report_access"),
  DashboardMetricsController.getUserTimeMetrics
);
router.get(
  "/cases/time",
  AuditMiddleware.auditCreate("report_access"),
  DashboardMetricsController.getCaseTimeMetrics
);
router.get(
  "/status",
  AuditMiddleware.auditCreate("report_access"),
  DashboardMetricsController.getStatusMetrics
);
router.get(
  "/applications",
  AuditMiddleware.auditCreate("report_access"),
  DashboardMetricsController.getApplicationMetrics
);
router.get(
  "/performance",
  AuditMiddleware.auditCreate("report_access"),
  DashboardMetricsController.getPerformanceMetrics
);

export default router;
