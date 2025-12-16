"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeAuthController = initializeAuthController;
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const auth_1 = require("../../middleware/auth");
const database_1 = require("../../config/database");
const router = (0, express_1.Router)();
let authController;
function initializeAuthController() {
    console.log("🔧 Inicializando AuthController...");
    console.log("📊 Entidades disponibles:", database_1.AppDataSource.entityMetadatas?.map((meta) => meta.name) || []);
    if (database_1.AppDataSource.entityMetadatas.length === 0) {
        throw new Error("No hay entidades cargadas - no se puede inicializar AuthController");
    }
    authController = new auth_controller_1.AuthController();
    console.log("✅ AuthController creado exitosamente");
}
router.post("/login", (req, res, next) => authController.login(req, res, next));
router.post("/register", (req, res, next) => authController.register(req, res, next));
router.post("/refresh-token", (req, res, next) => authController.refreshToken(req, res, next));
router.get("/me", auth_1.authenticateToken, (req, res, next) => authController.me(req, res, next));
router.get("/users", auth_1.authenticateToken, (req, res, next) => authController.getUsers(req, res, next));
router.get("/users/email/:email", auth_1.authenticateToken, (req, res, next) => authController.getUserByEmail(req, res, next));
router.put("/users/:userId/role", auth_1.authenticateToken, (req, res, next) => authController.updateUserRole(req, res, next));
router.post("/logout", (req, res, next) => authController.logout(req, res, next));
router.post("/logout-all", auth_1.authenticateToken, (req, res, next) => authController.logoutAllSessions(req, res, next));
router.get("/sessions", auth_1.authenticateToken, (req, res, next) => authController.getActiveSessions(req, res, next));
exports.default = router;
