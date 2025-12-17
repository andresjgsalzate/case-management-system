import { Router } from "express";
import {
  createCase,
  getCases,
  getCaseById,
  updateCase,
  deleteCase,
  getCaseStats,
} from "./case.controller";
import { authenticateToken } from "../../middleware/auth";
import { AuditMiddleware } from "../../middleware/auditMiddleware";
import { requirePermission } from "../../middleware/authorizationMiddleware";

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

// Aplicar middleware de auditoría después de la autenticación
router.use(AuditMiddleware.initializeAuditContext);

// Rutas para casos
router.get("/stats", requirePermission("cases.view.own"), getCaseStats);
router.get("/", requirePermission("cases.view.own"), getCases);
router.get("/:id", requirePermission("cases.view.own"), getCaseById);
router.post(
  "/",
  requirePermission("cases.create.own"),
  AuditMiddleware.auditCreate("cases"),
  createCase
);
router.put(
  "/:id",
  requirePermission("cases.edit.own"),
  AuditMiddleware.auditUpdate("cases"),
  updateCase
);
router.delete(
  "/:id",
  requirePermission("cases.delete.own"),
  AuditMiddleware.auditDelete("cases"),
  deleteCase
);

export default router;
