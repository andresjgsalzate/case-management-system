import { Router } from "express";
import { ManualTimeEntriesController } from "./manual-time-entries.controller";
import { authenticateToken } from "../../middleware/auth";

const router = Router();
const manualTimeEntriesController = new ManualTimeEntriesController();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

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
  manualTimeEntriesController.updateManualTimeEntry.bind(
    manualTimeEntriesController
  )
);
router.delete(
  "/:id",
  manualTimeEntriesController.deleteManualTimeEntry.bind(
    manualTimeEntriesController
  )
);

export default router;
