import { Router } from "express";
import { UserController } from "../controllers/UserController";
import { authenticateToken } from "../middleware/auth";

const router = Router();
const userController = new UserController();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// Rutas CRUD para usuarios
router.post("/", userController.createUser.bind(userController));
router.get("/", userController.getUsers.bind(userController));
router.get("/:id", userController.getUserById.bind(userController));
router.put("/:id", userController.updateUser.bind(userController));
router.delete("/:id", userController.deleteUser.bind(userController));

// Rutas para gestión de contraseñas
router.put(
  "/:id/change-password",
  userController.changePassword.bind(userController)
);
router.put(
  "/:id/update-password",
  userController.updatePassword.bind(userController)
);

// Ruta para cambiar estado del usuario
router.patch(
  "/:id/toggle-status",
  userController.toggleUserStatus.bind(userController)
);

export { router as userRoutes };
