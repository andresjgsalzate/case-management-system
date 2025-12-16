"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionController = void 0;
const PermissionService_1 = require("../services/PermissionService");
class PermissionController {
    constructor() {
        this.permissionService = new PermissionService_1.PermissionService();
    }
    async getAllPermissions(req, res) {
        try {
            const permissions = await this.permissionService.getAllPermissions();
            res.json({
                success: true,
                data: permissions,
                message: "Permisos obtenidos correctamente",
            });
        }
        catch (error) {
            console.error("Error al obtener permisos:", error);
            res.status(500).json({
                success: false,
                error: "Error interno del servidor",
            });
        }
    }
    async getPermissionsByModule(req, res) {
        try {
            const { module } = req.params;
            if (!module) {
                return res.status(400).json({
                    success: false,
                    error: "El módulo es requerido",
                });
            }
            const permissions = await this.permissionService.getPermissionsByModule(module);
            res.json({
                success: true,
                data: permissions,
                message: `Permisos del módulo ${module} obtenidos correctamente`,
            });
        }
        catch (error) {
            console.error("Error al obtener permisos por módulo:", error);
            res.status(500).json({
                success: false,
                error: "Error interno del servidor",
            });
        }
    }
    async getModulesStructure(req, res) {
        try {
            const structure = await this.permissionService.getModulesStructure();
            res.json({
                success: true,
                data: structure,
                message: "Estructura de módulos obtenida correctamente",
            });
        }
        catch (error) {
            console.error("Error al obtener estructura de módulos:", error);
            res.status(500).json({
                success: false,
                error: "Error interno del servidor",
            });
        }
    }
    async searchPermissions(req, res) {
        try {
            const { module, action, scope, search } = req.query;
            const filters = {
                module: module,
                action: action,
                scope: scope,
                search: search,
            };
            const permissions = await this.permissionService.searchPermissions(filters);
            res.json({
                success: true,
                data: permissions,
                message: "Búsqueda de permisos completada",
                filters: filters,
            });
        }
        catch (error) {
            console.error("Error al buscar permisos:", error);
            res.status(500).json({
                success: false,
                error: "Error interno del servidor",
            });
        }
    }
    async createPermission(req, res) {
        try {
            const { name, description, module, action, scope } = req.body;
            if (!name || !module || !action || !scope) {
                return res.status(400).json({
                    success: false,
                    error: "Campos requeridos: name, module, action, scope",
                });
            }
            if (!["own", "team", "all"].includes(scope)) {
                return res.status(400).json({
                    success: false,
                    error: "El scope debe ser: own, team o all",
                });
            }
            const permission = await this.permissionService.createPermission({
                name,
                description,
                module,
                action,
                scope,
            });
            res.status(201).json({
                success: true,
                data: permission,
                message: "Permiso creado correctamente",
            });
        }
        catch (error) {
            console.error("Error al crear permiso:", error);
            if (error instanceof Error &&
                error.message === "Ya existe un permiso con ese nombre") {
                return res.status(409).json({
                    success: false,
                    error: error.message,
                });
            }
            res.status(500).json({
                success: false,
                error: "Error interno del servidor",
            });
        }
    }
    async checkUserPermissions(req, res) {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: "No autenticado",
                });
            }
            const { permissions } = req.body;
            if (!Array.isArray(permissions)) {
                return res.status(400).json({
                    success: false,
                    error: "Se debe proporcionar un array de permisos a verificar",
                });
            }
            const permissionResults = {};
            for (const permission of permissions) {
                try {
                    const hasPermission = await this.permissionService.hasPermission(user.id, permission);
                    permissionResults[permission] = hasPermission;
                }
                catch (error) {
                    permissionResults[permission] = false;
                }
            }
            res.json({
                success: true,
                data: {
                    userId: user.id,
                    roleName: user.roleName,
                    permissions: permissionResults,
                },
                message: "Verificación de permisos completada",
            });
        }
        catch (error) {
            console.error("Error al verificar permisos del usuario:", error);
            res.status(500).json({
                success: false,
                error: "Error interno del servidor",
            });
        }
    }
    async getHighestScope(req, res) {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: "No autenticado",
                });
            }
            const { module, action } = req.params;
            if (!module || !action) {
                return res.status(400).json({
                    success: false,
                    error: "Módulo y acción son requeridos",
                });
            }
            const roleId = user.role || "";
            if (!roleId) {
                return res.status(400).json({
                    success: false,
                    error: "Usuario sin rol asignado",
                });
            }
            const highestScope = await this.permissionService.getHighestScope(roleId, module, action);
            res.json({
                success: true,
                data: {
                    module,
                    action,
                    highestScope,
                    hasPermission: !!highestScope,
                },
                message: "Scope obtenido correctamente",
            });
        }
        catch (error) {
            console.error("Error al obtener scope:", error);
            res.status(500).json({
                success: false,
                error: "Error interno del servidor",
            });
        }
    }
    async getActions(req, res) {
        try {
            const actions = await this.permissionService.getAllActions();
            res.json({
                success: true,
                data: actions,
                message: "Acciones obtenidas correctamente",
            });
        }
        catch (error) {
            console.error("Error al obtener acciones:", error);
            res.status(500).json({
                success: false,
                error: "Error interno del servidor",
            });
        }
    }
    async translateAction(req, res) {
        try {
            const { fromAction, toAction } = req.body;
            if (!fromAction || !toAction) {
                return res.status(400).json({
                    success: false,
                    error: "fromAction y toAction son requeridos",
                });
            }
            const result = await this.permissionService.translateAction(fromAction, toAction);
            res.json({
                success: true,
                data: result,
                message: `Acción "${fromAction}" traducida a "${toAction}"`,
            });
        }
        catch (error) {
            console.error("Error al traducir acción:", error);
            res.status(500).json({
                success: false,
                error: "Error interno del servidor",
            });
        }
    }
    async updateNamesFormat(req, res) {
        try {
            const result = await this.permissionService.updateNamesFormat();
            res.json({
                success: true,
                data: result,
                message: "Formato de nombres actualizado correctamente",
            });
        }
        catch (error) {
            console.error("Error al actualizar formato de nombres:", error);
            res.status(500).json({
                success: false,
                error: "Error interno del servidor",
            });
        }
    }
}
exports.PermissionController = PermissionController;
