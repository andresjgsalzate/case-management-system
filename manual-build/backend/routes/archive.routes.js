"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const authorizationMiddleware_1 = require("../middleware/authorizationMiddleware");
const ArchiveController_express_1 = require("../controllers/ArchiveController.express");
const restore_service_1 = require("../modules/archive/restore-service");
const router = express_1.default.Router();
const archiveController = new ArchiveController_express_1.ArchiveController();
const restoreService = new restore_service_1.RestoreService();
router.get("/stats", auth_1.authenticateToken, (0, authorizationMiddleware_1.requirePermission)("archive.stats.all"), archiveController.getArchiveStats);
router.get("/cases", auth_1.authenticateToken, (0, authorizationMiddleware_1.requirePermission)("archive.view.all"), async (req, res, next) => {
    try {
        res.json({
            success: true,
            data: [],
        });
    }
    catch (error) {
        next(error);
    }
});
router.post("/cases", auth_1.authenticateToken, (0, authorizationMiddleware_1.requirePermission)("archive.create.own"), async (req, res, next) => {
    try {
        res.status(201).json({
            success: true,
            data: { id: "placeholder" },
        });
    }
    catch (error) {
        next(error);
    }
});
router.get("/cases/:id", auth_1.authenticateToken, (0, authorizationMiddleware_1.requirePermission)("archive.view.own"), async (req, res, next) => {
    try {
        const { id } = req.params;
        res.json({
            success: true,
            data: { id },
        });
    }
    catch (error) {
        next(error);
    }
});
router.put("/cases/:id/restore", auth_1.authenticateToken, (0, authorizationMiddleware_1.requirePermission)("archive.restore.own"), async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = req.user;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "ID requerido",
            });
        }
        const result = await restoreService.restoreCase(id, (user.id || "system"));
        if (result.success) {
            res.json({
                success: true,
                message: result.message,
                data: {
                    id: result.caseId,
                    restored: true,
                },
            });
        }
        else {
            res.status(400).json({
                success: false,
                message: result.message,
            });
        }
    }
    catch (error) {
        next(error);
    }
});
router.delete("/cases/:id", auth_1.authenticateToken, (0, authorizationMiddleware_1.requirePermission)("archive.delete.own"), archiveController.deleteArchivedCase);
router.get("/todos", auth_1.authenticateToken, (0, authorizationMiddleware_1.requirePermission)("archive.view.all"), async (req, res, next) => {
    try {
        res.json({
            success: true,
            data: [],
        });
    }
    catch (error) {
        next(error);
    }
});
router.post("/todos", auth_1.authenticateToken, (0, authorizationMiddleware_1.requirePermission)("archive.create.own"), async (req, res, next) => {
    try {
        res.status(201).json({
            success: true,
            data: { id: "placeholder" },
        });
    }
    catch (error) {
        next(error);
    }
});
router.put("/todos/:id/restore", auth_1.authenticateToken, (0, authorizationMiddleware_1.requirePermission)("archive.restore.own"), async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = req.user;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "ID requerido",
            });
        }
        const result = await restoreService.restoreTodo(id, (user.id || "system"));
        if (result.success) {
            res.json({
                success: true,
                message: result.message,
                data: {
                    id: result.todoId,
                    restored: true,
                },
            });
        }
        else {
            res.status(400).json({
                success: false,
                message: result.message,
            });
        }
    }
    catch (error) {
        next(error);
    }
});
router.delete("/todos/:id", auth_1.authenticateToken, (0, authorizationMiddleware_1.requirePermission)("archive.delete.own"), async (req, res, next) => {
    try {
        await archiveController.deleteArchivedTodo(req, res, next);
    }
    catch (error) {
        next(error);
    }
});
router.get("/items", auth_1.authenticateToken, (0, authorizationMiddleware_1.requirePermission)("archive.view.all"), archiveController.getArchivedItems);
router.get("/search", auth_1.authenticateToken, (0, authorizationMiddleware_1.requirePermission)("archive.view.all"), async (req, res, next) => {
    try {
        res.json({
            success: true,
            data: [],
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
