import { Router } from "express";
import { ManualTimeEntriesController } from "./manual-time-entries.controller";
import { authenticateToken } from "../../middleware/auth";
import { AuditMiddleware } from "../../middleware/auditMiddleware";

const router = Router();
const manualTimeEntriesController = new ManualTimeEntriesController();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

// Aplicar middleware de auditoría después de la autenticación
router.use(AuditMiddleware.initializeAuditContext);

// Rutas para manual time entries
router.get(
  "/case-control/:caseControlId",
  manualTimeEntriesController.getManualTimeEntriesByCaseControl.bind(
    manualTimeEntriesController
  )
);
router.get(
  "/user",
  manualTimeEntriesController.getManualTimeEntriesByUser.bind(
    manualTimeEntriesController
  )
);
router.post(
  "/",
  AuditMiddleware.auditCreate("manual_time_entries"),
  manualTimeEntriesController.createManualTimeEntry.bind(
    manualTimeEntriesController
  )
);
router.get(
  "/:id",
  manualTimeEntriesController.getManualTimeEntry.bind(
    manualTimeEntriesController
  )
);
router.put(
  "/:id",
  AuditMiddleware.auditUpdate("manual_time_entries"),
  manualTimeEntriesController.updateManualTimeEntry.bind(
    manualTimeEntriesController
  )
);
router.delete(
  "/:id",
  AuditMiddleware.auditDelete("manual_time_entries"),
  manualTimeEntriesController.deleteManualTimeEntry.bind(
    manualTimeEntriesController
  )
);

export default router;
