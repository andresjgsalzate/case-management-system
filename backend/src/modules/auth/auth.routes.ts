import { Router } from "express";
import { AuthController } from "./auth.controller";
import { authenticateToken } from "../../middleware/auth";

const router = Router();
const authController = new AuthController();

// Rutas públicas
router.post("/login", authController.login);
router.post("/register", authController.register);
router.post("/refresh-token", authController.refreshToken);

// Rutas protegidas
router.get("/me", authenticateToken, authController.me);
router.get("/users", authenticateToken, authController.getUsers);
router.get(
  "/users/email/:email",
  authenticateToken,
  authController.getUserByEmail
);
router.put(
  "/users/:userId/role",
  authenticateToken,
  authController.updateUserRole
);

export default router;
