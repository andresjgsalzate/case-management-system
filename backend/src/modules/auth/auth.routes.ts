import { Router } from "express";
import { AuthController } from "./auth.controller";
import { authenticateToken } from "../../middleware/auth";
import { AppDataSource } from "../../config/database";

const router = Router();
let authController: AuthController;

// Función para inicializar el controlador después de que la DB esté lista
export function initializeAuthController() {
  console.log("🔧 Inicializando AuthController...");
  console.log(
    "📊 Entidades disponibles:",
    AppDataSource.entityMetadatas?.map((meta: any) => meta.name) || []
  );

  if (AppDataSource.entityMetadatas.length === 0) {
    throw new Error(
      "No hay entidades cargadas - no se puede inicializar AuthController"
    );
  }

  authController = new AuthController();
  console.log("✅ AuthController creado exitosamente");
}

// Rutas públicas
router.post("/login", (req, res, next) => authController.login(req, res, next));
router.post("/register", (req, res, next) =>
  authController.register(req, res, next)
);
router.post("/refresh-token", (req, res, next) =>
  authController.refreshToken(req, res, next)
);

// Rutas protegidas
router.get("/me", authenticateToken, (req, res, next) =>
  authController.me(req, res, next)
);
router.get("/users", authenticateToken, (req, res, next) =>
  authController.getUsers(req, res, next)
);
router.get("/users/email/:email", authenticateToken, (req, res, next) =>
  authController.getUserByEmail(req, res, next)
);
router.put("/users/:userId/role", authenticateToken, (req, res, next) =>
  authController.updateUserRole(req, res, next)
);

// Rutas de gestión de sesiones
router.post("/logout", (req, res, next) =>
  authController.logout(req, res, next)
);
router.post("/logout-all", authenticateToken, (req, res, next) =>
  authController.logoutAllSessions(req, res, next)
);
router.get("/sessions", authenticateToken, (req, res, next) =>
  authController.getActiveSessions(req, res, next)
);

export default router;
