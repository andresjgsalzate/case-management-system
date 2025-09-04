import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { authenticateToken } from "../middleware/auth";

const router = Router();
const authController = new AuthController();

// Rutas de autenticación y permisos (protegidas)
router.get(
  "/permissions",
  authenticateToken,
  authController.getUserPermissions
);
router.get(
  "/check-permission/:permission",
  authenticateToken,
  authController.checkPermission
);
router.get(
  "/check-module/:module",
  authenticateToken,
  authController.checkModuleAccess
);

export default router;
