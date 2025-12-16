"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuditController_1 = require("../controllers/AuditController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const auditController = new AuditController_1.AuditController();
router.use(auth_1.authenticateToken);
router.get("/logs", async (req, res) => {
    try {
        console.log("🔍 DEBUG: Acceso a /api/audit/logs");
        console.log("Headers:", req.headers.authorization);
        console.log("User:", req.user);
        await auditController.getAuditLogs(req, res);
    }
    catch (error) {
        console.error("❌ Error en audit logs route:", error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
router.get("/logs/:id", async (req, res) => {
    await auditController.getAuditLogById(req, res);
});
router.get("/entity/:entityType/:entityId/history", async (req, res) => {
    await auditController.getEntityHistory(req, res);
});
router.get("/statistics", async (req, res) => {
    await auditController.getAuditStatistics(req, res);
});
router.post("/export", async (req, res) => {
    await auditController.exportAuditLogs(req, res);
});
router.post("/logs", async (req, res) => {
    await auditController.createAuditLog(req, res);
});
router.delete("/cleanup", async (req, res) => {
    await auditController.cleanupOldLogs(req, res);
});
router.get("/health", async (req, res) => {
    try {
        const healthCheck = {
            status: "ok",
            timestamp: new Date().toISOString(),
            database: "connected",
            version: "1.0.0",
        };
        res.json({
            success: true,
            data: healthCheck,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Sistema de auditoría no disponible",
            error: error instanceof Error ? error.message : "Error desconocido",
        });
    }
});
router.use("*", (req, res) => {
    res.status(404).json({
        success: false,
        message: `Ruta de auditoría no encontrada: ${req.method} ${req.originalUrl}`,
    });
});
exports.default = router;
