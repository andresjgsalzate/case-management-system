import { Router } from "express";
import { CaseControlController } from "./case-control.controller";
import { authenticateToken } from "../../middleware/auth";

const router = Router();
const caseControlController = new CaseControlController();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

// Ruta para obtener estados de casos
router.get(
  "/statuses",
  caseControlController.getCaseStatuses.bind(caseControlController)
);

// Rutas para Case Controls
router.get(
  "/",
  caseControlController.getAllCaseControls.bind(caseControlController)
);
router.get(
  "/:id",
  caseControlController.getCaseControlById.bind(caseControlController)
);
router.post(
  "/",
  caseControlController.createCaseControl.bind(caseControlController)
);
router.put(
  "/:id/status",
  caseControlController.updateCaseControlStatus.bind(caseControlController)
);
router.delete(
  "/:id",
  caseControlController.deleteCaseControl.bind(caseControlController)
);

// Rutas para Time Entries
router.get(
  "/:id/time-entries",
  caseControlController.getTimeEntries.bind(caseControlController)
);
router.get(
  "/:id/manual-time-entries",
  caseControlController.getManualTimeEntries.bind(caseControlController)
);
router.post(
  "/:id/manual-time-entries",
  caseControlController.addManualTimeEntry.bind(caseControlController)
);
router.delete(
  "/:id/manual-time-entries/:entryId",
  caseControlController.deleteManualTimeEntry.bind(caseControlController)
);

// Rutas para entradas de tiempo del timer
router.delete(
  "/:id/time-entries/:entryId",
  caseControlController.deleteTimeEntry.bind(caseControlController)
);

export default router;
