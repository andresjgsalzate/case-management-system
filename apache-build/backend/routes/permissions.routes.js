"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PermissionController_1 = require("../controllers/PermissionController");
const RoleController_1 = require("../controllers/RoleController");
const auth_1 = require("../middleware/auth");
const auditMiddleware_1 = require("../middleware/auditMiddleware");
const authorizationMiddleware_1 = require("../middleware/authorizationMiddleware");
const router = (0, express_1.Router)();
const permissionController = new PermissionController_1.PermissionController();
const roleController = new RoleController_1.RoleController();
router.use(auth_1.authenticateToken);
router.use(auditMiddleware_1.AuditMiddleware.initializeAuditContext);
router.get("/permissions", auth_1.authenticateToken, (req, res) => permissionController.getAllPermissions(req, res));
router.get("/permissions/module/:module", auth_1.authenticateToken, (req, res) => permissionController.getPermissionsByModule(req, res));
router.get("/permissions/structure", auth_1.authenticateToken, (req, res) => permissionController.getModulesStructure(req, res));
router.get("/permissions/actions", auth_1.authenticateToken, (req, res) => permissionController.getActions(req, res));
router.put("/permissions/translate-action", auth_1.authenticateToken, (req, res) => permissionController.translateAction(req, res));
router.put("/permissions/update-names-format", auth_1.authenticateToken, (req, res) => permissionController.updateNamesFormat(req, res));
router.get("/permissions/search", (0, authorizationMiddleware_1.requireAdmin)(), (req, res) => permissionController.searchPermissions(req, res));
router.post("/permissions", (0, authorizationMiddleware_1.requireAdmin)(), auditMiddleware_1.AuditMiddleware.auditCreate("permissions"), (req, res) => permissionController.createPermission(req, res));
router.post("/permissions/check", auth_1.authenticateToken, (req, res) => permissionController.checkUserPermissions(req, res));
router.get("/permissions/scope/:module/:action", (req, res) => permissionController.getHighestScope(req, res));
router.get("/roles", auth_1.authenticateToken, (req, res) => roleController.getAllRoles(req, res));
router.get("/roles/search", auth_1.authenticateToken, (req, res) => roleController.searchRoles(req, res));
router.get("/roles/stats", (0, authorizationMiddleware_1.requireAdmin)(), (req, res) => roleController.getRoleStats(req, res));
router.get("/roles/:id", (0, authorizationMiddleware_1.requireAdmin)(), (req, res) => roleController.getRoleById(req, res));
router.post("/roles", (0, authorizationMiddleware_1.requireAdmin)(), auditMiddleware_1.AuditMiddleware.auditCreate("roles"), (req, res) => roleController.createRole(req, res));
router.put("/roles/:id", (0, authorizationMiddleware_1.requireAdmin)(), auditMiddleware_1.AuditMiddleware.auditUpdate("roles"), (req, res) => roleController.updateRole(req, res));
router.delete("/roles/:id", (0, authorizationMiddleware_1.requireAdmin)(), auditMiddleware_1.AuditMiddleware.auditDelete("roles"), (req, res) => roleController.deleteRole(req, res));
router.post("/roles/:id/permissions", (0, authorizationMiddleware_1.requireAdmin)(), auditMiddleware_1.AuditMiddleware.auditUpdate("role_permissions"), (req, res) => roleController.assignPermissions(req, res));
router.post("/roles/:id/clone", (0, authorizationMiddleware_1.requireAdmin)(), auditMiddleware_1.AuditMiddleware.auditCreate("roles"), (req, res) => roleController.cloneRole(req, res));
router.get("/roles/:id/can-delete", (0, authorizationMiddleware_1.requireAdmin)(), (req, res) => roleController.checkCanDeleteRole(req, res));
router.get("/example/dispositions", (0, authorizationMiddleware_1.requirePermissionWithScope)("dispositions", "view"), (req, res) => {
    res.json({
        message: "Lista de disposiciones según scope del usuario",
        scope: req.userWithPermissions?.permissionScope,
        filters: req.userWithPermissions?.scopeFilters,
    });
});
router.post("/example/cases", (0, authorizationMiddleware_1.requirePermission)("cases.create.own"), (req, res) => {
    res.json({
        message: "Crear caso - permiso específico verificado",
    });
});
router.get("/example/admin-dashboard", (0, authorizationMiddleware_1.requirePermission)("dashboard.view.all"), (req, res) => {
    res.json({
        message: "Dashboard administrativo - acceso completo",
    });
});
exports.default = router;
