import { Router } from "express";
import { TestController } from "../controllers/TestController";

const router = Router();
const testController = new TestController();

// Rutas de prueba para el sistema de permisos (sin autenticación)
router.get(
  "/permissions",
  testController.getPermissionsTest.bind(testController)
);
router.get("/roles", testController.getRolesTest.bind(testController));
router.get(
  "/permissions/module/:module",
  testController.getPermissionsByModule.bind(testController)
);
router.get(
  "/roles/:roleId/permissions",
  testController.getRolePermissions.bind(testController)
);
router.get(
  "/system-status",
  testController.getSystemStatus.bind(testController)
);

export default router;
