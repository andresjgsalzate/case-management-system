"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const archive_controller_1 = require("./archive.controller");
const auth_1 = require("../../middleware/auth");
const auditMiddleware_1 = require("../../middleware/auditMiddleware");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.use(auditMiddleware_1.AuditMiddleware.initializeAuditContext);
router.get("/stats", archive_controller_1.getArchiveStats);
router.get("/items", archive_controller_1.getArchivedItems);
router.get("/search", archive_controller_1.searchArchivedItems);
router.post("/case/:caseId", auditMiddleware_1.AuditMiddleware.auditCreate("archived_cases"), archive_controller_1.archiveCase);
router.post("/todo/:todoId", auditMiddleware_1.AuditMiddleware.auditCreate("archived_todos"), archive_controller_1.archiveTodo);
router.post("/:type/:id/restore", auditMiddleware_1.AuditMiddleware.auditUpdate("archived_items"), archive_controller_1.restoreArchivedItem);
router.delete("/cases/:id", auditMiddleware_1.AuditMiddleware.auditDelete("archived_cases"), (req, res, next) => {
    req.params.type = "case";
    (0, archive_controller_1.deleteArchivedItem)(req, res, next);
});
router.delete("/todos/:id", auditMiddleware_1.AuditMiddleware.auditDelete("archived_todos"), (req, res, next) => {
    req.params.type = "todo";
    (0, archive_controller_1.deleteArchivedItem)(req, res, next);
});
router.delete("/:type/:id", archive_controller_1.deleteArchivedItem);
exports.default = router;
