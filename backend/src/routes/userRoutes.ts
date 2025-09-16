import { Router } from "express";
import { UserController } from "../controllers/UserController";
import { authenticateToken } from "../middleware/auth";
import { AuditMiddleware } from "../middleware/auditMiddleware";

const router = Router();
const userController = new UserController();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// Aplicar middleware de auditoría después de la autenticación
router.use(AuditMiddleware.initializeAuditContext);

// Rutas CRUD para usuarios
router.post(
  "/",
  AuditMiddleware.auditCreate("user_profiles"),
  userController.createUser.bind(userController)
);
router.get("/", userController.getUsers.bind(userController));
router.get("/:id", userController.getUserById.bind(userController));
router.put(
  "/:id",
  AuditMiddleware.auditUpdate("user_profiles"),
  userController.updateUser.bind(userController)
);
router.delete(
  "/:id",
  AuditMiddleware.auditDelete("user_profiles"),
  userController.deleteUser.bind(userController)
);

// Rutas para gestión de contraseñas
router.put(
  "/:id/change-password",
  AuditMiddleware.auditUpdate("user_profiles"),
  userController.changePassword.bind(userController)
);
router.put(
  "/:id/update-password",
  AuditMiddleware.auditUpdate("user_profiles"),
  userController.updatePassword.bind(userController)
);

// Ruta para cambiar estado del usuario
router.patch(
  "/:id/toggle-status",
  AuditMiddleware.auditUpdate("user_profiles"),
  userController.toggleUserStatus.bind(userController)
);

export { router as userRoutes };
