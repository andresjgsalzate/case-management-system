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

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

// Aplicar middleware de auditoría después de la autenticación
router.use(AuditMiddleware.initializeAuditContext);

// Rutas para casos
router.get("/stats", getCaseStats);
router.get("/", getCases);
router.get("/:id", getCaseById);
router.post("/", AuditMiddleware.auditCreate("cases"), createCase);
router.put("/:id", AuditMiddleware.auditUpdate("cases"), updateCase);
router.delete("/:id", AuditMiddleware.auditDelete("cases"), deleteCase);

export default router;
