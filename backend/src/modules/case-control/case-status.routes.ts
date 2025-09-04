import { Router } from "express";
import { CaseStatusController } from "./case-status.controller";
import { authenticateToken } from "../../middleware/auth";

const router = Router();
const caseStatusController = new CaseStatusController();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

// Rutas para Case Status Control
router.get("/", caseStatusController.getAllStatuses.bind(caseStatusController));
router.get(
  "/:id",
  caseStatusController.getStatusById.bind(caseStatusController)
);
router.post("/", caseStatusController.createStatus.bind(caseStatusController));
router.put(
  "/:id",
  caseStatusController.updateStatus.bind(caseStatusController)
);
router.delete(
  "/:id",
  caseStatusController.deleteStatus.bind(caseStatusController)
);
router.post(
  "/initialize",
  caseStatusController.initializeDefaultStatuses.bind(caseStatusController)
);

export default router;
