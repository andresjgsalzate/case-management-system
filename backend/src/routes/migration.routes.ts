import { Router } from "express";
import { MigrationController } from "../controllers/MigrationController";

const router = Router();
const migrationController = new MigrationController();

/**
 * @route POST /api/migration/update-case-scoring
 * @description Actualiza las puntuaciones y clasificaciones de todos los casos
 */
router.post(
  "/update-case-scoring",
  migrationController.updateCaseScoring.bind(migrationController)
);

export default router;
