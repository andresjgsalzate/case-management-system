import { Router } from "express";
import { DashboardMetricsController } from "../controllers/DashboardMetricsController";
import { authenticateToken } from "../middleware/auth";
import { AuditMiddleware } from "../middleware/auditMiddleware";
import { requirePermission } from "../middleware/authorizationMiddleware";

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

// Aplicar middleware de auditoría después de la autenticación
router.use(AuditMiddleware.initializeAuditContext);

// Rutas de métricas del dashboard - con auditoría y permisos para acceso a reportes
router.get(
  "/general",
  requirePermission("dashboard.read.own"),
  AuditMiddleware.auditCreate("report_access"),
  DashboardMetricsController.getGeneralMetrics
);
router.get(
  "/dashboard-stats",
  requirePermission("dashboard.read.own"),
  AuditMiddleware.auditCreate("report_access"),
  DashboardMetricsController.getDashboardStats
);
router.get(
  "/time",
  requirePermission("dashboard.read.own"),
  AuditMiddleware.auditCreate("report_access"),
  DashboardMetricsController.getTimeMetrics
);
router.get(
  "/users/time",
  requirePermission("dashboard.read.own"),
  AuditMiddleware.auditCreate("report_access"),
  DashboardMetricsController.getUserTimeMetrics
);
router.get(
  "/cases/time",
  requirePermission("dashboard.read.own"),
  AuditMiddleware.auditCreate("report_access"),
  DashboardMetricsController.getCaseTimeMetrics
);
router.get(
  "/status",
  requirePermission("dashboard.read.own"),
  AuditMiddleware.auditCreate("report_access"),
  DashboardMetricsController.getStatusMetrics
);
router.get(
  "/applications",
  requirePermission("dashboard.read.own"),
  AuditMiddleware.auditCreate("report_access"),
  DashboardMetricsController.getApplicationMetrics
);
router.get(
  "/performance",
  requirePermission("dashboard.read.own"),
  AuditMiddleware.auditCreate("report_access"),
  DashboardMetricsController.getPerformanceMetrics
);

export default router;
