"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestController = void 0;
const PermissionService_1 = require("../services/PermissionService");
const RoleService_1 = require("../services/RoleService");
class TestController {
    constructor() {
        this.permissionService = new PermissionService_1.PermissionService();
        this.roleService = new RoleService_1.RoleService();
    }
    async getPermissionsTest(req, res) {
        try {
            const permissions = await this.permissionService.getAllPermissions();
            res.json({
                success: true,
                data: permissions,
                total: permissions.length,
            });
        }
        catch (error) {
            console.error("Error getting permissions:", error);
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }
    async getRolesTest(req, res) {
        try {
            const roles = await this.roleService.getAllRoles();
            res.json({
                success: true,
                data: roles,
                total: roles.length,
            });
        }
        catch (error) {
            console.error("Error getting roles:", error);
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }
    async getPermissionsByModule(req, res) {
        try {
            const { module } = req.params;
            if (!module) {
                res.status(400).json({ error: "Módulo requerido" });
                return;
            }
            const permissions = await this.permissionService.getPermissionsByModule(module);
            res.json({
                success: true,
                module,
                data: permissions,
                total: permissions.length,
            });
        }
        catch (error) {
            console.error("Error getting permissions by module:", error);
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }
    async getRolePermissions(req, res) {
        try {
            const { roleId } = req.params;
            if (!roleId) {
                res.status(400).json({ error: "ID de rol requerido" });
                return;
            }
            const roleData = await this.roleService.getRoleWithPermissions(roleId);
            if (!roleData) {
                res.status(404).json({ error: "Rol no encontrado" });
                return;
            }
            res.json({
                success: true,
                role: {
                    id: roleData.role.id,
                    name: roleData.role.name,
                    description: roleData.role.description,
                },
                permissions: roleData.permissions.map((permission) => ({
                    id: permission.id,
                    name: permission.name,
                    description: permission.description,
                    module: permission.module,
                    action: permission.action,
                    scope: permission.scope,
                })),
                permissionsByModule: roleData.permissionsByModule,
                totalPermissions: roleData.permissions.length,
            });
        }
        catch (error) {
            console.error("Error getting role permissions:", error);
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }
    async getSystemStatus(req, res) {
        try {
            const permissions = await this.permissionService.getAllPermissions();
            const roles = await this.roleService.getAllRoles();
            const moduleStats = permissions.reduce((acc, permission) => {
                if (!acc[permission.module]) {
                    acc[permission.module] = {
                        total: 0,
                        actions: new Set(),
                        scopes: new Set(),
                    };
                }
                acc[permission.module].total++;
                acc[permission.module].actions.add(permission.action);
                acc[permission.module].scopes.add(permission.scope);
                return acc;
            }, {});
            Object.keys(moduleStats).forEach((module) => {
                moduleStats[module].actions = Array.from(moduleStats[module].actions);
                moduleStats[module].scopes = Array.from(moduleStats[module].scopes);
            });
            res.json({
                success: true,
                system: {
                    totalPermissions: permissions.length,
                    totalRoles: roles.length,
                    totalModules: Object.keys(moduleStats).length,
                    moduleStats,
                    roles: roles.map((role) => ({
                        id: role.id,
                        name: role.name,
                        description: role.description,
                        isActive: role.isActive,
                    })),
                },
            });
        }
        catch (error) {
            console.error("Error getting system status:", error);
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }
}
exports.TestController = TestController;
