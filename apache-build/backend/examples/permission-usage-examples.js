"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.permissionExamplesRouter = void 0;
const express_1 = require("express");
const authorizationMiddleware_1 = require("../middleware/authorizationMiddleware");
const router = (0, express_1.Router)();
exports.permissionExamplesRouter = router;
router.get("/dispositions", (0, authorizationMiddleware_1.requirePermissionWithScope)("dispositions", "read"), async (req, res) => {
    const user = req.userWithPermissions;
    const scope = user?.permissionScope;
    const queryFilters = {};
    switch (scope) {
        case "own":
            if (user)
                queryFilters.userId = user.id;
            break;
        case "team":
            if (user)
                queryFilters.teamId = user.teamId;
            break;
        case "all":
            break;
    }
    res.json({
        message: `Disposiciones con scope: ${scope}`,
        filters: queryFilters,
        scope,
    });
});
router.post("/dispositions", (0, authorizationMiddleware_1.requirePermission)("dispositions.create.own"), async (req, res) => {
    res.json({
        message: "Disposición creada correctamente",
    });
});
router.put("/dispositions/:id", (0, authorizationMiddleware_1.filterByScope)("dispositions", "update", {
    getEntityId: (req) => req.params.id,
}), async (req, res) => {
    res.json({
        message: "Disposición actualizada",
        dispositionId: req.params.id,
    });
});
router.get("/cases/dashboard", (0, authorizationMiddleware_1.requireAllPermissions)(["cases.read.all", "dashboard.view.all"]), async (req, res) => {
    res.json({
        message: "Dashboard de casos - acceso completo",
    });
});
router.get("/cases", (0, authorizationMiddleware_1.requireAnyPermission)(["cases.view.own", "cases.view.team", "cases.view.all"]), async (req, res) => {
    res.json({
        message: "Lista de casos según permisos del usuario",
    });
});
router.post("/cases/:id/assign", (0, authorizationMiddleware_1.requireAnyPermission)(["cases.assign.team", "cases.assign.all"]), async (req, res) => {
    res.json({
        message: "Caso asignado correctamente",
        caseId: req.params.id,
    });
});
router.get("/todos", (0, authorizationMiddleware_1.filterByScope)("todos", "ver", {
    userIdField: "assignedTo",
    teamIdField: "teamId",
}), async (req, res) => {
    const user = req.userWithPermissions;
    const filters = user?.scopeFilters;
    res.json({
        message: "Todos filtrados por scope",
        appliedFilters: filters,
        scope: user?.permissionScope,
    });
});
router.get("/admin/panel", (0, authorizationMiddleware_1.requireAdmin)(), async (req, res) => {
    res.json({
        message: "Panel administrativo",
    });
});
router.get("/admin/users", (0, authorizationMiddleware_1.requirePermission)("users.manage.all"), async (req, res) => {
    res.json({
        message: "Gestión de usuarios",
    });
});
const checkComplexPermission = async (user, permissionService) => {
    const hasBasicAccess = await permissionService.hasPermission(user.roleId, "cases.read.own");
    const hasAdvancedAccess = await permissionService.hasPermission(user.roleId, "reports.generate.team");
    return hasBasicAccess && hasAdvancedAccess;
};
router.get("/complex-operation", async (req, res) => {
    res.json({
        message: "Operación compleja autorizada",
    });
});
class ExampleService {
    async checkUserPermissions(userId, roleId) {
        const permissionService = new (await Promise.resolve().then(() => __importStar(require("../services/PermissionService")))).PermissionService();
        const canCreateCases = await permissionService.hasPermission(roleId, "cases.create.own");
        const highestScope = await permissionService.getHighestScope(roleId, "dispositions", "read");
        const permissions = await permissionService.hasPermissions(roleId, [
            "cases.read.own",
            "dispositions.read.own",
            "todos.read.own",
        ]);
        return {
            canCreateCases,
            highestScope,
            permissions,
        };
    }
}
